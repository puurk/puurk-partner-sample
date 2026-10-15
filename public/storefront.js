/**
 * Storefront behavior: renders the live catalog, keeps a shopping cart
 * with live "as low as" pricing, and runs the checkout drawer that mounts
 * Puurk's inline checkout (@puurk/js) on this page.
 *
 * Flow: Add to cart → Cart → customer details → POST /api/checkout (our
 * server creates the Puurk session at the server-priced cart total) →
 * Puurk.checkout.mount() → onComplete → confirmation.
 */
(function () {
  'use strict'

  const config = window.STOREFRONT_CONFIG || { environment: 'sandbox', puurkJsUrl: '/vendor/puurk.js', payInFull: true }
  const present = window.SERVICE_PRESENTATION
  const CONFIRMATION_DELAY_MS = 1400
  const STATUS_CHECK_WINDOW_MS = 75 * 1000
  const STATUS_CHECK_INTERVAL_MS = 3000
  const QUOTE_DEBOUNCE_MS = 150
  const TOAST_MS = 3500
  const MAX_LINE_QUANTITY = 10
  const CART_STORAGE_KEY = 'lumiere-cart'

  // Lumière's brand, passed to the embedded Puurk checkout so it matches
  // the rest of the site (including Stripe's card fields).
  const CHECKOUT_APPEARANCE = {
    colors: {
      primary: '#2B2320',
      primaryText: '#FBF8F4',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#2B2320',
      textMuted: '#8C7B6F',
      border: '#E9DFD3',
      danger: '#A63D32',
      success: '#3F7A5A'
    },
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    borderRadius: '10px',
    fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }]
  }

  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector))

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  const wholeCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  /**
   * Formats cents as dollars, dropping ".00" for round amounts.
   * @param {number} cents Amount in cents.
   * @return {string}
   */
  function formatPrice (cents) {
    return cents % 100 === 0 ? wholeCurrency.format(cents / 100) : currency.format(cents / 100)
  }

  /**
   * Creates an element with attributes and children.
   * @param {string} tag Tag name.
   * @param {object} [attrs] Attributes; `class` and `text` are shorthands.
   * @param {Array<Node|string>} [children] Child nodes or text.
   * @return {HTMLElement}
   */
  function el (tag, attrs = {}, children = []) {
    const node = document.createElement(tag)
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue
      if (key === 'class') node.className = value
      else if (key === 'text') node.textContent = value
      else node.setAttribute(key, value === true ? '' : value)
    }
    for (const child of children) node.append(child)
    return node
  }

  /**
   * The Puurk logo, inline with pricing copy.
   * @param {number} [width] Rendered width in px.
   * @return {HTMLElement}
   */
  function puurkLogo (width = 54) {
    return el('img', { src: '/images/puurk-logo.svg', alt: 'Puurk', width, height: Math.round(width * 0.24) })
  }

  // ---------------------------------------------------------------------
  // SDK loading
  // ---------------------------------------------------------------------

  let sdkPromise = null

  /**
   * Loads @puurk/js once and configures it for this storefront's environment.
   * @return {Promise<object>} The global Puurk SDK.
   */
  function loadPuurk () {
    if (!sdkPromise) {
      sdkPromise = new Promise((resolve, reject) => {
        const script = el('script', { src: config.puurkJsUrl, async: true })
        script.onload = () => {
          if (!window.Puurk) return reject(new Error('Puurk SDK did not load'))
          window.Puurk.configure(config.apiUrl
            ? { environment: config.environment, apiUrl: config.apiUrl }
            : { environment: config.environment })
          resolve(window.Puurk)
        }
        script.onerror = () => reject(new Error('Puurk SDK failed to load'))
        document.head.append(script)
      }).catch(e => {
        sdkPromise = null
        throw e
      })
    }
    return sdkPromise
  }

  // ---------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------

  // service id → quantity, in the order items were added.
  const cart = new Map()
  let quote = null
  let quoteSeq = 0
  let quoteTimer = null

  /** Restores the cart saved in this browser (best effort). */
  function loadCart () {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
      for (const item of Array.isArray(saved) ? saved : []) {
        if (typeof item?.service_id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) {
          cart.set(item.service_id, Math.min(item.quantity, MAX_LINE_QUANTITY))
        }
      }
    } catch {
      // Storage unavailable (private mode, blocked): start with an empty cart.
    }
  }

  /** Saves the cart in this browser (best effort). */
  function saveCart () {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems()))
    } catch {
      // Storage unavailable: the cart still works for this page view.
    }
  }

  /**
   * The cart as API items.
   * @return {Array<{service_id: string, quantity: number}>}
   */
  function cartItems () {
    return [...cart].map(([serviceId, quantity]) => ({ service_id: serviceId, quantity }))
  }

  /** @return {number} Total quantity in the cart. */
  function cartCount () {
    return [...cart.values()].reduce((sum, quantity) => sum + quantity, 0)
  }

  /**
   * Sets a line's quantity (0 removes it) and refreshes everything priced
   * off the cart.
   * @param {string} serviceId
   * @param {number} quantity
   */
  function setQuantity (serviceId, quantity) {
    if (quantity <= 0) cart.delete(serviceId)
    else cart.set(serviceId, Math.min(quantity, MAX_LINE_QUANTITY))
    saveCart()
    renderCartBadge()
    renderCart()
    refreshQuote()
  }

  /**
   * Adds one of a service to the cart.
   * @param {object} service Storefront service.
   */
  function addToCart (service) {
    const current = cart.get(service.id) ?? 0
    if (current >= MAX_LINE_QUANTITY) {
      showToast(`You can book up to ${MAX_LINE_QUANTITY} of each treatment online.`)
      return
    }
    setQuantity(service.id, current + 1)
    showToast(`${service.name} added to your cart.`)
  }

  /** Drops cart lines whose service is no longer on the menu. */
  function pruneCart () {
    const ids = new Set(catalog.map(s => s.id))
    let changed = false
    for (const id of [...cart.keys()]) {
      if (!ids.has(id)) {
        cart.delete(id)
        changed = true
      }
    }
    if (changed) saveCart()
  }

  /**
   * Asks our server to price the cart and the "as low as" increments.
   * Debounced; out-of-order responses are ignored.
   */
  function refreshQuote () {
    clearTimeout(quoteTimer)
    quoteTimer = setTimeout(async () => {
      const seq = ++quoteSeq
      try {
        const res = await fetch('/api/cart/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cartItems() })
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        if (seq !== quoteSeq) return
        quote = body
      } catch (e) {
        console.error('Cart quote failed', e)
        if (seq !== quoteSeq) return
        quote = null
      }
      renderIncrements()
      renderCart()
      renderOrderSummary()
    }, QUOTE_DEBOUNCE_MS)
  }

  // ---------------------------------------------------------------------
  // Catalog
  // ---------------------------------------------------------------------

  let catalog = []
  let activeCategory = 'all'

  /**
   * What a card's headline price says. With an empty cart it's the item's
   * own lowest monthly payment. Once the cart has items, it's what adding the
   * item does to the cart's lowest monthly payment, quoted from live terms
   * because plan lengths change with the amount.
   * @param {object} service Storefront service.
   * @return {{label: string, price: string, plan: object, cart: boolean}|null} Headline, or
   *   null when the item has no plan quote.
   */
  function headline (service) {
    const increment = quote?.increments?.[service.id]
    if (cart.size > 0 && quote?.as_low_as && increment?.as_low_as) {
      const plan = increment.as_low_as
      // Longer plans unlock at higher totals, so adding an item can lower
      // the cart's lowest monthly payment.
      if (increment.delta < 0) {
        return { label: 'Your cart drops to', price: formatPrice(plan.monthly_payment), plan, cart: true }
      }
      return { label: 'Adds to your cart', price: `+${formatPrice(increment.delta)}`, plan, cart: true }
    }
    if (!service.as_low_as) return null
    return { label: 'As low as', price: formatPrice(service.as_low_as.monthly_payment), plan: service.as_low_as, cart: false }
  }

  /**
   * Builds a card's pricing: the monthly price leads, with paying in full as
   * the secondary price. Without a plan quote, the full price leads.
   * @param {object} service Storefront service.
   * @param {string} variant Card variant, `card` or `package`.
   * @return {HTMLElement}
   */
  function priceBlock (service, variant) {
    const attrs = { class: `price-block price-block--${variant}`, 'data-price-for': service.id, 'data-variant': variant }
    const full = formatPrice(service.unit_price)
    const head = headline(service)
    if (!head) return el('div', attrs, [el('p', { class: 'price', text: full })])
    const { plan } = head
    // In the cart view the plan line describes the whole cart after adding.
    const terms = head.cart
      ? [`Cart: ${formatPrice(plan.monthly_payment)}/mo for ${plan.term_length} months`]
      : [`for ${plan.term_length} months`]
    if (plan.down_payment && !head.cart) terms.push(`${formatPrice(plan.down_payment)} today`)
    return el('div', attrs, [
      el('p', { class: 'price__from', text: head.label }),
      el('p', { class: 'price' }, [head.price, el('span', { class: 'price__per', text: '/mo' })]),
      el('p', { class: 'price__terms' }, [terms.join(' · '), el('span', { class: 'price__with' }, ['with', puurkLogo(48)])]),
      el('p', { class: 'price__full' }, ['or ', el('strong', { text: full }), ' paid in full'])
    ])
  }

  /** Updates every card's pricing from the latest quote. */
  function renderIncrements () {
    for (const block of $$('[data-price-for]')) {
      const service = catalog.find(s => s.id === block.dataset.priceFor)
      if (service) block.replaceWith(priceBlock(service, block.dataset.variant))
    }
    for (const button of $$('[data-add-to-cart]')) {
      const quantity = cart.get(button.dataset.addToCart) ?? 0
      button.textContent = quantity > 0 ? `In cart (${quantity}) · Add` : 'Add to cart'
      button.classList.toggle('is-in-cart', quantity > 0)
    }
  }

  /**
   * The add-to-cart button for a service.
   * @param {object} service Storefront service.
   * @param {string} className Button classes.
   * @return {HTMLElement}
   */
  function addButton (service, className) {
    return el('button', { class: className, type: 'button', 'data-add-to-cart': service.id }, ['Add to cart'])
  }

  /**
   * Builds a treatment card.
   * @param {object} service Storefront service.
   * @return {HTMLElement}
   */
  function treatmentCard (service) {
    const look = present(service)
    const meta = [look.duration, look.category[0].toUpperCase() + look.category.slice(1)].filter(Boolean).join(' · ')
    return el('article', { class: 'card reveal', 'data-category': look.category }, [
      el('div', { class: 'card__media' }, [
        el('img', { src: look.image, alt: '', loading: 'lazy', width: 900, height: 675 }),
        el('span', { class: 'card__tag', text: look.category })
      ]),
      el('div', { class: 'card__body' }, [
        el('h3', { class: 'card__title', text: service.name }),
        meta ? el('p', { class: 'card__meta', text: meta }) : '',
        el('p', { class: 'card__desc', text: look.blurb }),
        el('div', { class: 'card__pricing' }, [
          priceBlock(service, 'card'),
          addButton(service, 'btn btn--primary btn--sm')
        ])
      ])
    ])
  }

  /**
   * Builds a signature-package feature card.
   * @param {object} service Storefront package.
   * @return {HTMLElement}
   */
  function packageCard (service) {
    const look = present(service)
    return el('article', { class: 'package reveal' }, [
      el('div', { class: 'package__media' }, [el('img', { src: look.image, alt: '', loading: 'lazy', width: 900, height: 675 })]),
      el('div', { class: 'package__body' }, [
        el('p', { class: 'package__label', text: /series/i.test(look.duration || '') ? look.duration : 'Signature package' }),
        el('h3', { class: 'package__title', text: service.name }),
        el('p', { class: 'package__desc', text: look.blurb }),
        priceBlock(service, 'package'),
        addButton(service, 'btn btn--light btn--sm')
      ])
    ])
  }

  /** Renders the treatment grid for the active category tab. */
  function renderTreatments () {
    const grid = $('#treatment-grid')
    const treatments = catalog.filter(s => !s.is_package)
    const visible = treatments.filter(s => activeCategory === 'all' || present(s).category === activeCategory)
    grid.replaceChildren(...visible.map(treatmentCard))
    if (visible.length === 0) {
      grid.append(el('p', { class: 'empty-category', text: 'New treatments in this category are coming soon.' }))
    }
    grid.setAttribute('aria-busy', 'false')
    grid.setAttribute('aria-labelledby', `tab-${activeCategory}`)
    renderIncrements()
    observeReveals(grid)
  }

  /** Renders the signature packages band (hidden when there are none). */
  function renderPackages () {
    const packages = catalog.filter(s => s.is_package)
    $('#packages').hidden = packages.length === 0
    $('#package-grid').replaceChildren(...packages.map(packageCard))
    renderIncrements()
    observeReveals($('#package-grid'))
  }

  /** Fills the announcement bar and example plan with real "as low as" pricing. */
  function renderPricingHighlights () {
    const priced = catalog.filter(s => s.as_low_as)
    if (priced.length === 0) return
    const lowest = priced.reduce((min, s) => (s.as_low_as.monthly_payment < min.as_low_as.monthly_payment ? s : min))
    $('[data-lowest-monthly-amount]').textContent = formatPrice(lowest.as_low_as.monthly_payment)
    $('[data-lowest-monthly]').hidden = false

    const showcase = [...priced].sort((a, b) => b.unit_price - a.unit_price)[0]
    $('[data-example-plan]').textContent =
      `${formatPrice(showcase.as_low_as.monthly_payment)}/mo × ${showcase.as_low_as.term_length}`
    const downPayment = showcase.as_low_as.down_payment
    $('.plan-chip__meta').textContent = downPayment
      ? `${showcase.name} · ${formatPrice(showcase.unit_price)} · ${formatPrice(downPayment)} down`
      : `${showcase.name} · ${formatPrice(showcase.unit_price)}`
  }

  /** Loads the catalog from our server and renders it. */
  async function loadCatalog () {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      catalog = (await res.json()).services || []
      pruneCart()
      renderCartBadge()
      renderTreatments()
      renderPackages()
      renderPricingHighlights()
      refreshQuote()
    } catch (e) {
      console.error('Catalog failed to load', e)
      $('#treatment-grid').replaceChildren()
      $('#treatment-grid').setAttribute('aria-busy', 'false')
      $('#catalog-error').hidden = false
    }
  }

  function setupTabs () {
    const tabs = $$('#treatment-tabs [role="tab"]')
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab))
      tab.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
        next.focus()
        selectTab(next)
      })
    })

    function selectTab (tab) {
      tabs.forEach(t => {
        t.setAttribute('aria-selected', String(t === tab))
        t.tabIndex = t === tab ? 0 : -1
      })
      activeCategory = tab.dataset.category
      renderTreatments()
    }
  }

  // ---------------------------------------------------------------------
  // Cart rendering
  // ---------------------------------------------------------------------

  /** Updates the header cart button's count. */
  function renderCartBadge () {
    const count = cartCount()
    const badge = $('#cart-count')
    badge.textContent = String(count)
    badge.hidden = count === 0
    $('#cart-button').setAttribute('aria-label', `Open cart, ${count} item${count === 1 ? '' : 's'}`)
  }

  /**
   * The cart's "or as low as" line.
   * @return {Array<Node|string>|null}
   */
  function cartMonthlyContent () {
    if (!quote?.as_low_as || cart.size === 0) return null
    const { monthly_payment: monthly, down_payment: downPayment } = quote.as_low_as
    if (!downPayment) return ['or as low as ', el('strong', { text: `${formatPrice(monthly)}/mo` }), ' with', puurkLogo(58)]
    return [
      'or ', el('strong', { text: formatPrice(downPayment) }), ' today, then as low as ',
      el('strong', { text: `${formatPrice(monthly)}/mo` }), ' with', puurkLogo(58)
    ]
  }

  /**
   * Prices the cart locally from the catalog, for instant feedback while a
   * quote is in flight. The server reprices everything at checkout.
   * @return {{lines: Array<object>, total: number}}
   */
  function localCart () {
    const lines = []
    for (const [serviceId, quantity] of cart) {
      const service = catalog.find(s => s.id === serviceId)
      if (service) lines.push({ service, quantity, line_total: service.unit_price * quantity })
    }
    return { lines, total: lines.reduce((sum, line) => sum + line.line_total, 0) }
  }

  /** Renders the editable cart step. */
  function renderCart () {
    const { lines, total } = localCart()
    const list = $('#cart-lines')
    list.replaceChildren(...lines.map(({ service, quantity, line_total: lineTotal }) => {
      const look = present(service)
      return el('li', { class: 'cart-line' }, [
        el('img', { src: look.image, alt: '', width: 72, height: 54 }),
        el('div', { class: 'cart-line__info' }, [
          el('p', { class: 'cart-line__name', text: service.name }),
          el('p', { class: 'cart-line__unit', text: `${formatPrice(service.unit_price)} each` }),
          el('div', { class: 'qty', role: 'group', 'aria-label': `Quantity of ${service.name}` }, [
            el('button', { type: 'button', class: 'qty__btn', 'data-qty-step': '-1', 'data-service': service.id, 'aria-label': `Remove one ${service.name}` }, ['−']),
            el('span', { class: 'qty__value', 'aria-live': 'polite', text: String(quantity) }),
            el('button', { type: 'button', class: 'qty__btn', 'data-qty-step': '1', 'data-service': service.id, 'aria-label': `Add one ${service.name}`, disabled: quantity >= MAX_LINE_QUANTITY }, ['+'])
          ])
        ]),
        el('div', { class: 'cart-line__end' }, [
          el('p', { class: 'cart-line__total', text: formatPrice(lineTotal) }),
          el('button', { type: 'button', class: 'text-button', 'data-remove': service.id, 'aria-label': `Remove ${service.name} from cart` }, ['Remove'])
        ])
      ])
    }))
    const empty = lines.length === 0
    $('#cart-empty').hidden = !empty
    $('#cart-totals').hidden = empty
    $('#cart-checkout').hidden = empty
    $('#cart-subtotal').textContent = formatPrice(total)
    const monthly = cartMonthlyContent()
    $('#cart-monthly').replaceChildren(...(monthly || []))
    $('#cart-monthly').hidden = !monthly
  }

  /** Renders the compact order summary shown above details and payment. */
  function renderOrderSummary () {
    const { lines, total } = localCart()
    const monthly = cartMonthlyContent()
    $('#order-summary').replaceChildren(
      el('ul', { class: 'order-summary__lines' }, lines.map(({ service, quantity, line_total: lineTotal }) =>
        el('li', {}, [
          el('span', { text: quantity > 1 ? `${service.name} × ${quantity}` : service.name }),
          el('span', { text: formatPrice(lineTotal) })
        ]))),
      el('div', { class: 'order-summary__total' }, [el('span', { text: 'Total' }), el('strong', { text: formatPrice(total) })]),
      monthly ? el('p', { class: 'order-summary__monthly' }, monthly) : ''
    )
  }

  // ---------------------------------------------------------------------
  // Checkout drawer
  // ---------------------------------------------------------------------

  const drawer = $('#checkout-drawer')
  const backdrop = $('#drawer-backdrop')
  const page = $('#page')
  const form = $('#details-form')

  const STEP_TITLES = { cart: 'Your cart', details: 'Your details', checkout: 'Plan & payment', done: 'Confirmed' }

  const state = {
    attemptId: null,
    controller: null,
    expiryTimer: null,
    lastFocus: null,
    customer: null,
    // What was checked out, kept for the confirmation after the cart clears.
    purchased: null
  }

  /**
   * Shows one drawer step and updates the progress indicator.
   * @param {'cart'|'details'|'checkout'|'done'} step
   */
  function showStep (step) {
    const order = ['cart', 'details', 'checkout', 'done']
    $$('[data-step]', drawer).forEach(section => { section.hidden = section.dataset.step !== step })
    $$('[data-step-indicator]', drawer).forEach(item => {
      const position = order.indexOf(item.dataset.stepIndicator)
      item.classList.toggle('is-active', position === order.indexOf(step))
      item.classList.toggle('is-complete', position < order.indexOf(step))
    })
    $('#drawer-title').textContent = STEP_TITLES[step]
    $('#order-summary').hidden = step !== 'details' && step !== 'checkout'
    if (step === 'details' || step === 'checkout') renderOrderSummary()
    if (step === 'cart') renderCart()
    $('.drawer__body', drawer).scrollTop = 0
  }

  function newAttemptId () {
    return window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }

  /** Opens the drawer on the cart. */
  function openDrawer () {
    state.lastFocus = document.activeElement
    $('#details-error').hidden = true
    resetCheckoutArea()
    showStep('cart')

    page.inert = true
    document.body.classList.add('drawer-open')
    backdrop.hidden = false
    drawer.hidden = false
    hideToast()
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open')
      drawer.classList.add('is-open')
    })
    setTimeout(() => ($('#cart-checkout').hidden ? $('#drawer-close') : $('#cart-checkout')).focus(), 250)
  }

  function closeDrawer () {
    if (drawer.hidden) return
    teardownCheckout()
    // A new checkout attempt starts next time, so a resumed cart never
    // replays an old session.
    state.attemptId = null
    backdrop.classList.remove('is-open')
    drawer.classList.remove('is-open')
    page.inert = false
    document.body.classList.remove('drawer-open')
    setTimeout(() => {
      backdrop.hidden = true
      drawer.hidden = true
    }, 450)
    if (state.lastFocus) state.lastFocus.focus()
  }

  /** Moves from the cart to customer details. */
  function goToDetails () {
    if (cart.size === 0) return
    state.attemptId = newAttemptId()
    // Start loading the SDK while the customer types.
    loadPuurk().catch(() => {})
    showStep('details')
    setTimeout(() => $('#customer-name').focus(), 50)
  }

  function teardownCheckout () {
    clearTimeout(state.expiryTimer)
    state.expiryTimer = null
    if (state.controller) {
      state.controller.destroy()
      state.controller = null
    }
  }

  function resetCheckoutArea () {
    teardownCheckout()
    $('#puurk-checkout').replaceChildren()
    $('#puurk-checkout').hidden = false
    $('#checkout-loading p').textContent = 'Preparing your payment options…'
    $('#checkout-loading').hidden = false
    $('#checkout-problem').hidden = true
  }

  /**
   * Shows a "start again" panel under (or instead of) the embedded checkout.
   * @param {string} message Customer-facing explanation.
   */
  function showProblem (message) {
    $('#checkout-loading').hidden = true
    $('#checkout-problem-text').textContent = message
    $('#checkout-problem').hidden = false
  }

  /**
   * Reads and validates the details form.
   * @return {{name: string, email: string, phone: string}|null} Null when invalid.
   */
  function readCustomer () {
    const fields = {
      name: $('#customer-name'),
      email: $('#customer-email'),
      phone: $('#customer-phone')
    }
    const customer = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim()
    }
    const invalid = {
      name: customer.name.length === 0,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email),
      phone: false
    }
    for (const [key, input] of Object.entries(fields)) input.setAttribute('aria-invalid', String(invalid[key]))
    const firstInvalid = Object.keys(invalid).find(key => invalid[key])
    if (firstInvalid) {
      fields[firstInvalid].focus()
      return null
    }
    return customer
  }

  /**
   * Asks our server to create a Puurk checkout session for the cart.
   * @param {{name: string, email: string, phone: string}} customer
   * @return {Promise<{session_id: string, expires_at: string}>}
   */
  async function createSession (customer) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only service ids and quantities are sent; the server decides prices.
      body: JSON.stringify({ items: cartItems(), attempt_id: state.attemptId, customer })
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(body.error || 'We could not start checkout. Please try again.')
      error.customerMessage = body.error
      throw error
    }
    return body
  }

  /**
   * Creates a session and mounts the inline Puurk checkout in the drawer.
   * @param {{name: string, email: string, phone: string}} customer
   */
  async function startCheckout (customer) {
    resetCheckoutArea()
    showStep('checkout')
    state.purchased = localCart().lines.map(({ service, quantity }) => ({ name: service.name, quantity }))

    let session, Puurk
    try {
      [session, Puurk] = await Promise.all([createSession(customer), loadPuurk()])
    } catch (e) {
      console.error('Checkout could not start', e)
      showProblem(e.customerMessage || 'We could not start checkout. Please try again.')
      return
    }

    try {
      state.controller = await Puurk.checkout.mount('#puurk-checkout', session.session_id, {
        appearance: CHECKOUT_APPEARANCE,
        payInFull: config.payInFull !== false,
        onComplete: result => {
          clearTimeout(state.expiryTimer)
          setTimeout(() => showConfirmation(result), CONFIRMATION_DELAY_MS)
        },
        onError: error => {
          console.error('Puurk checkout error', error)
          recoverFromError(session.session_id)
        }
      })
      $('#checkout-loading').hidden = true
    } catch (e) {
      console.error('Puurk checkout failed to mount', e)
      showProblem('We could not load secure checkout. Please try again.')
      return
    }

    // Sessions expire (30 minutes). The embedded UI shows an expiry notice;
    // give the customer a one-click way to begin a fresh session.
    const msUntilExpiry = Date.parse(session.expires_at) - Date.now()
    if (Number.isFinite(msUntilExpiry) && msUntilExpiry > 0) {
      state.expiryTimer = setTimeout(() => {
        showProblem('This checkout timed out for your security. Start again to pick up where you left off.')
      }, msUntilExpiry + 1000)
    }
  }

  /**
   * Asks our server for the session's real outcome.
   * @param {string} sessionId
   * @return {Promise<{status: string, contract_id: string|null}|null>} Null when unknown.
   */
  async function fetchSessionStatus (sessionId) {
    try {
      const res = await fetch(`/api/checkout/${encodeURIComponent(sessionId)}/status`, { cache: 'no-store' })
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  }

  /**
   * Handles an error from the embedded checkout. An error the browser sees
   * (e.g. a network or gateway timeout on confirm) doesn't mean the payment
   * failed: Puurk may still be finishing it. Check the session's real
   * status for a while before offering "Start again", so a customer is
   * never invited to pay twice.
   * @param {string} sessionId
   */
  async function recoverFromError (sessionId) {
    const attempt = state.attemptId
    const stillCurrent = () => state.attemptId === attempt && !drawer.hidden
    clearTimeout(state.expiryTimer)
    $('#puurk-checkout').hidden = true
    $('#checkout-problem').hidden = true
    $('#checkout-loading').hidden = false
    $('#checkout-loading p').textContent = 'Confirming your payment. This can take up to a minute…'

    const deadline = Date.now() + STATUS_CHECK_WINDOW_MS
    while (stillCurrent()) {
      const session = await fetchSessionStatus(sessionId)
      if (session?.status === 'completed') {
        showConfirmation({ session_id: sessionId, contract_id: session.contract_id })
        return
      }
      if (session?.status === 'expired' || Date.now() >= deadline) break
      await new Promise(resolve => setTimeout(resolve, STATUS_CHECK_INTERVAL_MS))
    }
    if (!stillCurrent()) return

    showProblem('Something went wrong with this checkout and it was not completed. You have not been charged. You can start again.')
  }

  /**
   * Describes purchased items for confirmation copy.
   * @param {Array<{name: string, quantity: number}>} items
   * @return {string} e.g. "Laser Treatment and 2 more treatments"
   */
  function describeItems (items) {
    if (!items || items.length === 0) return 'treatment'
    const [first, ...rest] = items
    const firstLabel = first.quantity > 1 ? `${first.name} × ${first.quantity}` : first.name
    if (rest.length === 0) return firstLabel
    return `${firstLabel} and ${rest.length} more treatment${rest.length === 1 ? '' : 's'}`
  }

  /**
   * Swaps the embedded checkout for our branded confirmation, and empties
   * the cart.
   * @param {{session_id: string, contract_id: string|null}} result A null
   *   contract_id means the client paid in full.
   */
  function showConfirmation (result) {
    teardownCheckout()
    const items = describeItems(state.purchased)
    const firstName = (state.customer?.name || '').split(/\s+/)[0]
    const paid = result.contract_id ? 'your payment plan is confirmed' : 'your payment is complete'
    $('#confirmation-text').textContent =
      `${firstName ? `Thank you, ${firstName}. ` : ''}Your ${items} ${state.purchased?.length > 1 ? 'are' : 'is'} booked and ${paid}. ` +
      'A receipt is on its way to your inbox, and our concierge will reach out to schedule your visit.'
    const params = new URLSearchParams({ session_id: result.session_id, service: items })
    if (result.contract_id) params.set('contract_id', result.contract_id)
    $('#confirmation-link').href = `/success.html?${params}`
    cart.clear()
    saveCart()
    renderCartBadge()
    refreshQuote()
    showStep('done')
  }

  // ---------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------

  let toastTimer = null

  /**
   * Shows a short confirmation with a "View cart" action.
   * @param {string} message
   */
  function showToast (message) {
    const toast = $('#cart-toast')
    $('#cart-toast-text').textContent = message
    toast.hidden = false
    requestAnimationFrame(() => toast.classList.add('is-visible'))
    clearTimeout(toastTimer)
    toastTimer = setTimeout(hideToast, TOAST_MS)
  }

  function hideToast () {
    const toast = $('#cart-toast')
    clearTimeout(toastTimer)
    toast.classList.remove('is-visible')
    setTimeout(() => { if (!toast.classList.contains('is-visible')) toast.hidden = true }, 300)
  }

  function setupCartAndDrawer () {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add-to-cart]')
      if (add) {
        const service = catalog.find(s => s.id === add.dataset.addToCart)
        if (service) addToCart(service)
        return
      }
      const step = e.target.closest('[data-qty-step]')
      if (step) {
        const id = step.dataset.service
        setQuantity(id, (cart.get(id) ?? 0) + Number(step.dataset.qtyStep))
        return
      }
      const remove = e.target.closest('[data-remove]')
      if (remove) {
        setQuantity(remove.dataset.remove, 0)
        return
      }
      if (e.target.closest('[data-close-drawer]')) closeDrawer()
      if (e.target.closest('[data-goto-step="cart"]')) {
        state.attemptId = null
        showStep('cart')
      }
    })

    $('#cart-button').addEventListener('click', openDrawer)
    $('#cart-toast-view').addEventListener('click', openDrawer)
    $('#cart-checkout').addEventListener('click', goToDetails)
    $('#drawer-close').addEventListener('click', closeDrawer)
    backdrop.addEventListener('click', closeDrawer)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer()
    })

    if (config.payInFull === false) {
      $('#details-fine').textContent = 'You\'ll choose a payment plan on the next step. Your details are shared with Puurk to set up your payments.'
    }

    form.addEventListener('submit', async e => {
      e.preventDefault()
      const customer = readCustomer()
      if (!customer) {
        $('#details-error').textContent = 'Please enter your name and a valid email address.'
        $('#details-error').hidden = false
        return
      }
      $('#details-error').hidden = true
      state.customer = customer
      await startCheckout(customer)
    })

    $('#checkout-retry').addEventListener('click', () => {
      state.attemptId = newAttemptId()
      startCheckout(state.customer)
    })
  }

  // ---------------------------------------------------------------------
  // Page chrome
  // ---------------------------------------------------------------------

  let revealObserver = null

  /**
   * Fades in `.reveal` elements as they scroll into view.
   * @param {ParentNode} [root] Where to look for new reveal elements.
   */
  function observeReveals (root = document) {
    const targets = $$('.reveal:not(.is-visible)', root)
    if (!('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-visible'))
      return
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          revealObserver.unobserve(entry.target)
        })
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    }
    targets.forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`
      revealObserver.observe(t)
    })
  }

  function setupHeader () {
    const header = $('#site-header')
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const toggle = $('#nav-toggle')
    const nav = $('#site-nav')
    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open))
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
      nav.classList.toggle('is-open', open)
    }
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false) })
  }

  document.documentElement.classList.remove('no-js')
  $('#year').textContent = String(new Date().getFullYear())
  loadCart()
  renderCartBadge()
  setupHeader()
  setupTabs()
  setupCartAndDrawer()
  observeReveals()
  loadCatalog()
})()
