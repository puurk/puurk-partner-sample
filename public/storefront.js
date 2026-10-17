/**
 * Storefront behavior: renders the catalog, keeps a shopping cart, shows
 * Puurk pricing with the @puurk/js widgets, and runs the checkout drawer
 * that embeds Puurk's checkout on this page.
 *
 * The same page runs two ways (window.STOREFRONT_CONFIG.mode):
 * - `server`: our server curates the menu (GET /api/services) and creates
 *   the Puurk session from the cart's items (POST /api/checkout), then the
 *   page mounts it with Puurk.checkout.mount().
 * - `static`: no server at all. The menu comes from Puurk.catalog.services()
 *   and Puurk.checkout.start() creates and mounts the session from the cart
 *   with the publishable client id.
 *
 * Either way the browser only sends service ids and quantities; Puurk prices
 * them, including each service's down payment and plan lengths, so the
 * widgets and the checkout always agree.
 */
(function () {
  'use strict'

  const config = window.STOREFRONT_CONFIG || { mode: 'server', environment: 'sandbox', puurkJsUrl: '/vendor/puurk.js', payInFull: true }
  const isStatic = config.mode === 'static'
  const present = window.SERVICE_PRESENTATION
  const CONFIRMATION_DELAY_MS = 1400
  const STATUS_CHECK_WINDOW_MS = 75 * 1000
  const STATUS_CHECK_INTERVAL_MS = 3000
  const SESSION_LIFETIME_MS = 30 * 60 * 1000
  const TOAST_MS = 3500
  const MAX_LINE_QUANTITY = 10
  const CART_STORAGE_KEY = 'lumiere-cart'
  const checkoutMode = new URLSearchParams(location.search).get('checkout') === 'modal' ? 'modal' : 'inline'

  // Puurk's public demo deployment (static/config.demosite.js) says so on the
  // page. Off by default, so a copy of this sample never shows it.
  if (config.demoNotice === true) document.querySelector('[data-demo-notice]')?.removeAttribute('hidden')

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

  // The pricing widgets inherit the page's font and text color. Their
  // colors and the headline price font are set from storefront.css
  // (`[data-puurk-widget]` rules), so only the plan-details dialog's font
  // is passed here.
  const WIDGET_APPEARANCE = { fontFamily: CHECKOUT_APPEARANCE.fontFamily, borderRadius: '10px' }

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

  let Puurk = null

  /**
   * Loads @puurk/js and configures it with this storefront's environment
   * and publishable client id.
   * @return {Promise<object>} The global Puurk SDK.
   */
  function loadPuurk () {
    return new Promise((resolve, reject) => {
      const script = el('script', { src: config.puurkJsUrl, async: true })
      script.onload = () => {
        if (!window.Puurk) return reject(new Error('Puurk SDK did not load'))
        window.Puurk.configure({
          environment: config.environment,
          clientId: config.clientId,
          oid: config.oid,
          ...(config.apiUrl ? { apiUrl: config.apiUrl } : {})
        })
        resolve(window.Puurk)
      }
      script.onerror = () => reject(new Error('Puurk SDK failed to load'))
      document.head.append(script)
    })
  }

  /** @return {boolean} Whether Puurk pricing can be shown (needs a publishable client id). */
  function pricingEnabled () {
    return Boolean(Puurk && config.clientId && config.oid)
  }

  // ---------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------

  // Puurk.cart(): service ids and quantities only, saved in this browser.
  let cart = null

  /** @return {number} Total quantity in the cart. */
  function cartCount () {
    return cart ? cart.count : 0
  }

  /**
   * Adds one of a service to the cart.
   * @param {object} service Storefront service.
   */
  function addToCart (service) {
    if (cart.quantityOf(service.id) >= MAX_LINE_QUANTITY) {
      showToast(`You can book up to ${MAX_LINE_QUANTITY} of each treatment online.`)
      return
    }
    cart.add(service.id)
    showToast(`${service.name} added to your cart.`)
  }

  /** Drops cart lines whose service is no longer on the menu. */
  function pruneCart () {
    const ids = new Set(catalog.map(s => s.id))
    for (const item of cart.items) {
      if (!ids.has(item.service_id)) cart.remove(item.service_id)
    }
  }

  /** Re-renders everything that shows the cart. */
  function onCartChange () {
    renderCartBadge()
    renderCart()
    renderAddButtons()
  }

  // ---------------------------------------------------------------------
  // Catalog
  // ---------------------------------------------------------------------

  let catalog = []
  let activeCategory = 'all'
  // Price widgets per grid, destroyed when the grid re-renders.
  const priceWidgets = { treatments: [], packages: [] }

  /**
   * A card's pricing slot. With Puurk pricing it becomes a price block
   * widget: "As low as $X/mo", or "+$X/mo" once the cart has items. Without
   * it, the full price.
   * @param {object} service Storefront service.
   * @param {string} variant Card variant, `card` or `package`.
   * @return {HTMLElement}
   */
  function priceSlot (service, variant) {
    if (!pricingEnabled()) {
      return el('div', { class: `price-block price-block--${variant}` }, [el('p', { class: 'price', text: formatPrice(service.unit_price) })])
    }
    return el('div', { class: `price-block price-block--${variant}` }, [
      el('div', { 'data-price-for': service.id }),
      el('p', { class: 'price__terms' }, [el('span', { class: 'price__with' }, ['Pay over time with', puurkLogo(48)])])
    ])
  }

  /**
   * Mounts a price block widget in every pricing slot of a grid.
   * @param {HTMLElement} grid The grid that was just rendered.
   * @param {'treatments'|'packages'} key Which grid.
   */
  function mountPrices (grid, key) {
    priceWidgets[key].forEach(widget => widget.destroy())
    priceWidgets[key] = []
    if (!pricingEnabled()) return
    for (const slot of $$('[data-price-for]', grid)) {
      priceWidgets[key].push(Puurk.widgets.priceBlock(slot, {
        serviceId: slot.dataset.priceFor,
        cart,
        payInFull: config.payInFull !== false,
        appearance: WIDGET_APPEARANCE
      }))
    }
  }

  /** Updates the add-to-cart buttons with what's already in the cart. */
  function renderAddButtons () {
    for (const button of $$('[data-add-to-cart]')) {
      const quantity = cart ? cart.quantityOf(button.dataset.addToCart) : 0
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
          priceSlot(service, 'card'),
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
        priceSlot(service, 'package'),
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
    mountPrices(grid, 'treatments')
    renderAddButtons()
    observeReveals(grid)
  }

  /** Renders the signature packages band (hidden when there are none). */
  function renderPackages () {
    const packages = catalog.filter(s => s.is_package)
    $('#packages').hidden = packages.length === 0
    $('#package-grid').replaceChildren(...packages.map(packageCard))
    mountPrices($('#package-grid'), 'packages')
    renderAddButtons()
    observeReveals($('#package-grid'))
  }

  /**
   * Fills the announcement bar and example plan with real "as low as"
   * pricing: one quote prices every menu item on its own.
   */
  async function renderPricingHighlights () {
    if (!pricingEnabled() || catalog.length === 0) return
    let quote
    try {
      quote = await Puurk.catalog.quote([], catalog.map(s => s.id))
    } catch (e) {
      console.warn('Pricing highlights unavailable', e)
      return
    }
    const priced = catalog
      .map(service => ({ service, increment: quote.increments[service.id] }))
      .filter(({ increment }) => increment?.as_low_as)
    if (priced.length === 0) return

    const lowest = priced.reduce((min, p) => (p.increment.as_low_as.monthly_payment < min.increment.as_low_as.monthly_payment ? p : min))
    $('[data-lowest-monthly-amount]').textContent = formatPrice(Math.ceil(lowest.increment.as_low_as.monthly_payment / 100) * 100)
    $('[data-lowest-monthly]').hidden = false

    const { service, increment } = [...priced].sort((a, b) => b.service.unit_price - a.service.unit_price)[0]
    $('[data-example-plan]').textContent =
      `${formatPrice(Math.ceil(increment.as_low_as.monthly_payment / 100) * 100)}/mo × ${increment.as_low_as.term_length}`
    $('.plan-chip__meta').textContent = increment.down_payment
      ? `${service.name} · ${formatPrice(service.unit_price)} · ${formatPrice(increment.down_payment)} down`
      : `${service.name} · ${formatPrice(service.unit_price)}`
  }

  /**
   * The online menu with no server: Puurk's public catalog, or just the
   * services listed in config.serviceIds (in that order), up to a limit.
   * @return {Promise<Array<object>>} Storefront services.
   */
  async function loadStaticCatalog () {
    const ids = Array.isArray(config.serviceIds) && config.serviceIds.length > 0 ? config.serviceIds : null
    const services = await Puurk.catalog.services(ids ? { ids } : {})
    const ordered = ids ? ids.map(id => services.find(s => s.id === id)).filter(Boolean) : services
    const treatments = ordered.filter(s => !s.is_package).slice(0, config.maxServices ?? 12)
    const packages = ordered.filter(s => s.is_package).slice(0, config.maxPackages ?? 4)
    return [...treatments, ...packages]
  }

  /** Loads the catalog (from our server, or from Puurk on the static site) and renders it. */
  async function loadCatalog () {
    try {
      if (isStatic) {
        catalog = await loadStaticCatalog()
      } else {
        const res = await fetch('/api/services')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        catalog = (await res.json()).services || []
      }
      pruneCart()
      renderCartBadge()
      renderTreatments()
      renderPackages()
      renderPricingHighlights()
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
   * The cart's lines with their menu entries, for display. Puurk prices the
   * cart at checkout; these are only for the line list.
   * @return {Array<{service: object, quantity: number, line_total: number}>}
   */
  function cartLines () {
    if (!cart) return []
    return cart.items
      .map(item => ({ service: catalog.find(s => s.id === item.service_id), quantity: item.quantity }))
      .filter(line => line.service)
      .map(line => ({ ...line, line_total: line.service.unit_price * line.quantity }))
  }

  /** Renders the editable cart step. The totals underneath are a cart summary widget. */
  function renderCart () {
    const lines = cartLines()
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
  }

  /**
   * Mounts the cart summary widgets: totals in the cart step, and the
   * itemized order summary above details and payment. They update
   * themselves whenever the cart changes.
   */
  function mountCartSummaries () {
    if (!pricingEnabled()) {
      $('#cart-totals').replaceChildren(el('p', { class: 'cart-totals__row', text: 'Payment options are shown at checkout.' }))
      return
    }
    const options = { cart, payInFull: config.payInFull !== false, appearance: WIDGET_APPEARANCE }
    Puurk.widgets.cartSummary('#cart-totals', { ...options, lines: false })
    Puurk.widgets.cartSummary('#order-summary', options)
  }

  // ---------------------------------------------------------------------
  // Checkout drawer
  // ---------------------------------------------------------------------

  const drawer = $('#checkout-drawer')
  const backdrop = $('#drawer-backdrop')
  const page = $('#page')
  const form = $('#details-form')

  const STEP_TITLES = { cart: 'Your cart', details: 'Your details', checkout: 'Plan & Payment', done: 'Confirmed' }

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
    if (cartCount() === 0) return
    state.attemptId = newAttemptId()
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
      email: customer.email.length > 254 || !/^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]+$/.test(customer.email),
      phone: false
    }
    for (const [key, input] of Object.entries(fields)) input.setAttribute('aria-invalid', String(invalid[key]))
    const firstInvalid = Object.keys(invalid).find(key => invalid[key])
    if (firstInvalid) {
      fields[firstInvalid].focus()
      return null
    }
    // Phone is optional; leave it out rather than sending an empty value.
    return customer.phone ? customer : { name: customer.name, email: customer.email }
  }

  /**
   * Asks our server to create a Puurk checkout session for the cart.
   * @param {{name: string, email: string, phone: string}} customer
   * @return {Promise<{session_id: string, expires_at: string}>}
   */
  async function createServerSession (customer) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only service ids and quantities are sent; Puurk decides prices.
      body: JSON.stringify({ items: cart.items, attempt_id: state.attemptId, customer })
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
   * Callbacks shared by both ways of starting the embedded checkout.
   * @param {function(): string|null} sessionId Returns the session id once known.
   * @return {object} Puurk checkout options.
   */
  function checkoutOptions (sessionId) {
    return {
      appearance: CHECKOUT_APPEARANCE,
      payInFull: config.payInFull !== false,
      onComplete: result => {
        clearTimeout(state.expiryTimer)
        setTimeout(() => showConfirmation(result), checkoutMode === 'modal' ? 0 : CONFIRMATION_DELAY_MS)
      },
      onCancel: () => {
        if (checkoutMode === 'modal') showProblem('Checkout was closed before it finished. You can start again.')
      },
      onError: error => {
        console.error('Puurk checkout error', error)
        const id = sessionId()
        if (id) recoverFromError(id)
        else showProblem('We could not load secure checkout. Please try again.')
      }
    }
  }

  /**
   * Creates a session for the cart and shows the Puurk checkout in the
   * drawer (or, with ?checkout=modal on the static site, in Puurk's modal).
   * @param {{name: string, email: string, phone: string}} customer
   */
  async function startCheckout (customer) {
    resetCheckoutArea()
    showStep('checkout')
    state.purchased = cartLines().map(({ service, quantity }) => ({ name: service.name, quantity }))

    let sessionId = null
    let expiresAt = null
    try {
      if (isStatic) {
        // No server: Puurk creates the session from the cart with the
        // publishable client id, then mounts it.
        const started = await Puurk.checkout.start({
          cart,
          customer,
          ...(checkoutMode === 'modal' ? { mode: 'modal' } : { container: '#puurk-checkout' }),
          clearCart: false,
          metadata: { source: 'storefront-static-example' },
          ...checkoutOptions(() => sessionId)
        })
        state.controller = started
        sessionId = started.sessionId
        expiresAt = started.expiresAt
      } else {
        const session = await createServerSession(customer)
        sessionId = session.session_id
        expiresAt = session.expires_at
        state.controller = await Puurk.checkout.mount('#puurk-checkout', sessionId, checkoutOptions(() => sessionId))
      }
      $('#checkout-loading').hidden = true
      if (checkoutMode === 'modal') {
        $('#checkout-loading p').textContent = 'Finish your payment in the secure Puurk window.'
        $('#checkout-loading').hidden = false
      }
    } catch (e) {
      console.error('Checkout could not start', e)
      showProblem(e.customerMessage || 'We could not start checkout. Please try again.')
      return
    }

    // Sessions expire (30 minutes). The embedded UI shows an expiry notice;
    // give the customer a one-click way to begin a fresh session.
    const msUntilExpiry = expiresAt ? Date.parse(expiresAt) - Date.now() : SESSION_LIFETIME_MS
    if (Number.isFinite(msUntilExpiry) && msUntilExpiry > 0) {
      state.expiryTimer = setTimeout(() => {
        showProblem('This checkout timed out for your security. Start again to pick up where you left off.')
      }, msUntilExpiry + 1000)
    }
  }

  /**
   * Looks up the session's real outcome: from our server, or straight from
   * Puurk on the static site.
   * @param {string} sessionId
   * @return {Promise<{status: string, contract_id: string|null}|null>} Null when unknown.
   */
  async function fetchSessionStatus (sessionId) {
    try {
      if (isStatic) return await Puurk.checkout.status(sessionId)
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
        if (service && cart) addToCart(service)
        return
      }
      const step = e.target.closest('[data-qty-step]')
      if (step) {
        const id = step.dataset.service
        cart.setQuantity(id, cart.quantityOf(id) + Number(step.dataset.qtyStep))
        return
      }
      const remove = e.target.closest('[data-remove]')
      if (remove) {
        cart.remove(remove.dataset.remove)
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

  /** Loads the SDK, then the cart, widgets and catalog. */
  async function start () {
    try {
      Puurk = await loadPuurk()
    } catch (e) {
      console.error(e)
      $('#treatment-grid').replaceChildren()
      $('#treatment-grid').setAttribute('aria-busy', 'false')
      $('#catalog-error').hidden = false
      return
    }
    if (isStatic && !pricingEnabled()) {
      console.error('The static storefront needs clientId and oid in config.js')
      $('#catalog-error').hidden = false
      return
    }
    // The same storage key as before, so saved carts carry over.
    cart = Puurk.cart({ persist: CART_STORAGE_KEY })
    cart.on('change', onCartChange)
    renderCartBadge()
    mountCartSummaries()
    await loadCatalog()
  }

  document.documentElement.classList.remove('no-js')
  $('#year').textContent = String(new Date().getFullYear())
  renderCartBadge()
  setupHeader()
  setupTabs()
  setupCartAndDrawer()
  observeReveals()
  start()
})()
