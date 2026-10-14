/**
 * Storefront behavior: renders the live catalog, and runs the checkout
 * drawer that mounts Puurk's inline checkout (@puurk/js) on this page.
 *
 * Flow: Book & Pay → customer details → POST /api/checkout (our server
 * creates the Puurk session at the catalog price) → Puurk.checkout.mount()
 * → onComplete → confirmation.
 */
(function () {
  'use strict'

  const config = window.STOREFRONT_CONFIG || { environment: 'sandbox', puurkJsUrl: '/vendor/puurk.js' }
  const present = window.SERVICE_PRESENTATION
  const CONFIRMATION_DELAY_MS = 1400

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
          window.Puurk.configure({ environment: config.environment })
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
  // Catalog
  // ---------------------------------------------------------------------

  let catalog = []
  let activeCategory = 'all'

  /**
   * "or as low as $X/mo with Puurk" line for a service.
   * @param {object} service Storefront service.
   * @return {HTMLElement|null}
   */
  function asLowAsLine (service) {
    if (!service.as_low_as) return null
    return el('p', { class: 'as-low-as' }, [
      'or as low as ',
      el('strong', { text: `${formatPrice(service.as_low_as.monthly_payment)}/mo` }),
      ' with',
      el('img', { src: '/images/puurk-logo.svg', alt: 'Puurk', width: 54, height: 13 })
    ])
  }

  /**
   * Builds a treatment card.
   * @param {object} service Storefront service.
   * @return {HTMLElement}
   */
  function treatmentCard (service) {
    const look = present(service)
    const meta = [look.duration, look.category[0].toUpperCase() + look.category.slice(1)].filter(Boolean).join(' · ')
    const button = el('button', { class: 'btn btn--primary btn--sm', type: 'button', 'data-book': service.id }, ['Book & Pay'])
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
          el('div', {}, [
            el('p', { class: 'price' }, [formatPrice(service.unit_price)]),
            asLowAsLine(service) || ''
          ]),
          button
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
        el('p', { class: 'package__price', text: formatPrice(service.unit_price) }),
        asLowAsLine(service) || '',
        el('button', { class: 'btn btn--light btn--sm', type: 'button', 'data-book': service.id }, ['Book & Pay'])
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
    observeReveals(grid)
  }

  /** Renders the signature packages band (hidden when there are none). */
  function renderPackages () {
    const packages = catalog.filter(s => s.is_package)
    $('#packages').hidden = packages.length === 0
    $('#package-grid').replaceChildren(...packages.map(packageCard))
    observeReveals($('#package-grid'))
  }

  /** Fills the announcement bar and example plan with real "as low as" pricing. */
  function renderPricingHighlights () {
    const priced = catalog.filter(s => s.as_low_as)
    if (priced.length === 0) return
    const lowest = priced.reduce((min, s) => (s.as_low_as.monthly_payment < min.as_low_as.monthly_payment ? s : min))
    $('[data-lowest-monthly-amount]').textContent = formatPrice(lowest.as_low_as.monthly_payment)
    $('[data-lowest-monthly]').hidden = false

    const showcase = catalog.filter(s => s.as_low_as).sort((a, b) => b.unit_price - a.unit_price)[0]
    $('[data-example-plan]').textContent =
      `${formatPrice(showcase.as_low_as.monthly_payment)}/mo × ${showcase.as_low_as.term_length}`
    $('.plan-chip__meta').textContent = `${showcase.name} · ${formatPrice(showcase.unit_price)}`
  }

  /** Loads the catalog from our server and renders it. */
  async function loadCatalog () {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      catalog = (await res.json()).services || []
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
  // Checkout drawer
  // ---------------------------------------------------------------------

  const drawer = $('#checkout-drawer')
  const backdrop = $('#drawer-backdrop')
  const page = $('#page')
  const form = $('#details-form')

  const state = {
    service: null,
    attemptId: null,
    controller: null,
    expiryTimer: null,
    lastFocus: null,
    customer: null
  }

  /**
   * Shows one drawer step and updates the progress indicator.
   * @param {'details'|'checkout'|'done'} step
   */
  function showStep (step) {
    const order = ['details', 'checkout', 'done']
    $$('[data-step]', drawer).forEach(section => { section.hidden = section.dataset.step !== step })
    $$('[data-step-indicator]', drawer).forEach(item => {
      const position = order.indexOf(item.dataset.stepIndicator)
      item.classList.toggle('is-active', position === order.indexOf(step))
      item.classList.toggle('is-complete', position < order.indexOf(step))
    })
    $('#order-summary').hidden = step === 'done'
    $('.drawer__body', drawer).scrollTop = 0
  }

  function newAttemptId () {
    return window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }

  /**
   * Opens the drawer for a service.
   * @param {object} service Storefront service.
   */
  function openDrawer (service) {
    const look = present(service)
    state.service = service
    state.attemptId = newAttemptId()
    state.lastFocus = document.activeElement

    $('#drawer-title').textContent = service.name
    $('#summary-image').src = look.image
    $('#summary-name').textContent = service.name
    $('#summary-price').textContent = formatPrice(service.unit_price)
    $('#summary-monthly').textContent = service.as_low_as
      ? `or ${formatPrice(service.as_low_as.monthly_payment)}/mo with Puurk`
      : ''
    $('#details-error').hidden = true
    resetCheckoutArea()
    showStep('details')

    // Start loading the SDK while the customer types.
    loadPuurk().catch(() => {})

    page.inert = true
    document.body.classList.add('drawer-open')
    backdrop.hidden = false
    drawer.hidden = false
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open')
      drawer.classList.add('is-open')
    })
    setTimeout(() => $('#customer-name').focus(), 250)
  }

  function closeDrawer () {
    if (drawer.hidden) return
    teardownCheckout()
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
   * Asks our server to create a Puurk checkout session for the selected service.
   * @param {{name: string, email: string, phone: string}} customer
   * @return {Promise<{session_id: string, expires_at: string}>}
   */
  async function createSession (customer) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only the service id is sent; the server decides the price.
      body: JSON.stringify({ service_id: state.service.id, attempt_id: state.attemptId, customer })
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
        onComplete: result => {
          clearTimeout(state.expiryTimer)
          setTimeout(() => showConfirmation(result), CONFIRMATION_DELAY_MS)
        },
        onError: error => {
          // The embedded checkout shows the details; offer a clean restart.
          console.error('Puurk checkout error', error)
          showProblem('Something went wrong with this checkout. You can start again. You have not been charged.')
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
   * Swaps the embedded checkout for our branded confirmation.
   * @param {{session_id: string, contract_id: string|null}} result
   */
  function showConfirmation (result) {
    teardownCheckout()
    const firstName = (state.customer?.name || '').split(/\s+/)[0]
    $('#confirmation-text').textContent =
      `${firstName ? `Thank you, ${firstName}. ` : ''}Your ${state.service.name} is booked and your payment plan is confirmed. ` +
      'A receipt is on its way to your inbox, and our concierge will reach out to schedule your visit.'
    const params = new URLSearchParams({ session_id: result.session_id, service: state.service.name })
    if (result.contract_id) params.set('contract_id', result.contract_id)
    $('#confirmation-link').href = `/success.html?${params}`
    showStep('done')
  }

  function setupDrawer () {
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-book]')
      if (!trigger) return
      const service = catalog.find(s => s.id === trigger.dataset.book)
      if (service) openDrawer(service)
    })

    $('#drawer-close').addEventListener('click', closeDrawer)
    backdrop.addEventListener('click', closeDrawer)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer()
    })

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
  setupHeader()
  setupTabs()
  setupDrawer()
  observeReveals()
  loadCatalog()
})()
