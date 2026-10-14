/**
 * Merchant-side presentation for catalog items. Puurk owns the catalog
 * (names, prices); the merchant's website owns how each treatment looks:
 * category tab, photo, duration and marketing copy. Rules match on the
 * service name plus its catalog category, so the sandbox's seeded catalog
 * and real med-spa menus both render well. First match wins; anything
 * unmatched gets the default.
 */
window.SERVICE_PRESENTATION = (function () {
  const rules = [
    {
      match: /consult/i,
      category: 'face',
      image: '/images/consultation.webp',
      duration: '45 min',
      blurb: 'A private, one-on-one assessment with our clinicians to map out a treatment plan around your goals, timeline and budget.'
    },
    {
      match: /follow[- ]?up|touch[- ]?up/i,
      category: 'face',
      image: '/images/follow-up.webp',
      duration: '30 min',
      blurb: 'A follow-up visit to review your results, fine-tune your plan and keep your skin on track, finished with a hydrating mask.'
    },
    {
      match: /skin analysis|imaging/i,
      category: 'face',
      image: '/images/skin-analysis.webp',
      duration: '50 min',
      blurb: 'In-depth imaging and analysis of your skin, followed by a tailored treatment and a take-home regimen from our aestheticians.'
    },
    {
      match: /premium|signature|luxe|ultimate/i,
      category: 'wellness',
      image: '/images/package-premium.webp',
      duration: 'Series of 6',
      blurb: 'Our most complete transformation: a sequenced series of advanced skin and restorative body treatments, planned by our medical director.'
    },
    {
      match: /starter|intro/i,
      category: 'wellness',
      image: '/images/package-starter.webp',
      duration: 'Series of 3',
      blurb: 'The perfect introduction to Lumière: a consultation followed by a curated series of our most-loved treatments.'
    },
    {
      match: /botox|dysport|xeomin|daxxify|letybo|jeuveau|neuromod|filler|juvederm|restylane|rha|sculptra|radiesse|kybella|injectable|lip|pdo|thread|aveli|hylenex/i,
      category: 'face',
      image: '/images/injectables.webp',
      duration: '45 min',
      blurb: 'Precise, natural-looking injectable treatments by our board-certified nurse injectors, tailored to your features.'
    },
    {
      match: /laser|co2|ipl|gmp|gentle ?max|resurfac|photofacial|morpheus|aviclear|enlighten|microneedl|rf\b|tighten/i,
      category: 'face',
      image: '/images/laser.webp',
      duration: '60 min',
      blurb: 'Advanced resurfacing that refines texture, softens fine lines and evens tone, with minimal downtime.'
    },
    {
      match: /peel|dermaplan|acne|aquagold|face reality|enzyme/i,
      category: 'face',
      image: '/images/peel.webp',
      duration: '45 min',
      blurb: 'Medical-grade peels and resurfacing facials that clear, brighten and renew, customized to your skin.'
    },
    {
      match: /hydrafacial|facial|mask|skin/i,
      category: 'face',
      image: '/images/skin-analysis.webp',
      duration: '50 min',
      blurb: 'A deeply restorative facial that cleanses, hydrates and leaves your skin luminous, customized by our aestheticians.'
    },
    {
      match: /brow|lash|tint/i,
      category: 'face',
      image: '/images/glow.webp',
      duration: '30 min',
      blurb: 'Brow and lash artistry that frames your features and wakes up your whole face.'
    },
    {
      match: /massage|tissue/i,
      category: 'body',
      image: '/images/massage.webp',
      duration: '75 min',
      blurb: 'Restorative deep-tissue bodywork that releases tension, eases soreness and leaves you deeply relaxed.'
    },
    {
      match: /emsculpt|ems chair|sculpt|contour|body|glute|cellulite|venus|exilis|attiva/i,
      category: 'body',
      image: '/images/package-starter.webp',
      duration: '45 min',
      blurb: 'Non-invasive body contouring that tones muscle, smooths and tightens, with no downtime.'
    },
    {
      match: /wax|electrolog|electrolysis|hair removal|lhr/i,
      category: 'body',
      image: '/images/essentials.webp',
      duration: '30 min',
      blurb: 'Gentle, precise hair removal in a calm, private suite, for smooth results that last.'
    },
    {
      match: /\biv\b|vitamin|wellness|weight|hormone|b12|nad|glutathione|myer|lab|urgent|telehealth|hair restoration/i,
      category: 'wellness',
      image: '/images/serum.webp',
      duration: '45 min',
      blurb: 'Clinician-guided wellness therapies to restore energy and balance from the inside out.'
    },
    {
      match: /package|series|membership/i,
      category: 'wellness',
      image: '/images/package-premium.webp',
      duration: 'Package',
      blurb: 'A curated series of complementary treatments, sequenced by our clinicians for lasting results.'
    }
  ]

  const fallback = {
    category: 'wellness',
    image: '/images/serum.webp',
    duration: null,
    blurb: 'A personalized treatment delivered by our licensed specialists in a calm, private suite.'
  }

  // Placeholder descriptions in seeded data shouldn't reach the storefront.
  const placeholderDescription = /sandbox fixture|^\s*$/i

  /**
   * Returns how a catalog item should look on the storefront.
   * @param {{name: string, description?: string, category?: string|null, is_package?: boolean}} service
   * @return {{category: string, image: string, duration: string|null, blurb: string}}
   */
  return function present (service) {
    const text = `${service.name} ${service.category || ''}`
    const rule = rules.find(r => r.match.test(text)) || fallback
    const description = service.description && !placeholderDescription.test(service.description)
      ? service.description
      : rule.blurb
    return { category: rule.category, image: rule.image, duration: rule.duration, blurb: description }
  }
})()
