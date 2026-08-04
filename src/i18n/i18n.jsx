import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import en from './en.json'
import hi from './hi.json'

// LLD Vol 1 §5 (Localization NFR) + FR-CP-07: English/Hindi at pilot,
// i18n framework must support new locales without a code change — adding
// a locale here means dropping in one more JSON file, nothing else.
const DICTIONARIES = { en, hi }

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('ndisp.locale') || 'en')

  const setLocaleAndPersist = useCallback((next) => {
    setLocale(next)
    localStorage.setItem('ndisp.locale', next)
  }, [])

  const t = useCallback(
    (key, fallback) => DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key] ?? fallback ?? key,
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale: setLocaleAndPersist, t }), [locale, setLocaleAndPersist, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
