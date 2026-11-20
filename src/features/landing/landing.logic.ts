export function salesContactHref(sales?: string, activation?: string): string {
  for (const value of [sales, activation]) {
    if (!value) continue
    try {
      const url = new URL(value)
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
    } catch { /* Fall back to the next configured contact. */ }
  }
  return '/login'
}

export function salesWhatsappHref(): string {
  const message = 'Olá! Quero conhecer melhor o AylaFlow e entender como a solução pode funcionar na minha empresa.'
  return 'https://wa.me/5545991335359?text=' + encodeURIComponent(message)
}

export function showLandingTop(scrollY: number): boolean {
  return scrollY >= 600
}

export function landingTopBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'auto' : 'smooth'
}
