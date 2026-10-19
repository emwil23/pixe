const loaded = new Set<string>()

/** Google Fonts family names are letters, digits and spaces ("Playfair Display", "Inter Tight"). */
export const isFontName = (name: string) => /^[A-Za-z0-9][A-Za-z0-9 ]{1,39}$/.test(name.trim())

/**
 * Loads a Google Fonts family so a font card can show it. Only runs when a board has a font card, and the
 * privacy page says so: the browser then asks fonts.googleapis.com for the stylesheet.
 */
export function loadGoogleFont(family: string) {
  const name = family.trim()
  if (!isFontName(name) || loaded.has(name)) return
  loaded.add(name)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;700&display=swap`
  document.head.append(link)
}

/** The CSS font stack for a Google font, with a sensible fallback while it loads. */
export const fontStack = (family: string) =>
  `'${family.replace(/'/g, '')}', ui-sans-serif, system-ui`

/** A Google Fonts page for the family. */
export const fontUrl = (family: string) =>
  `https://fonts.google.com/specimen/${encodeURIComponent(family.trim()).replace(/%20/g, '+')}`
