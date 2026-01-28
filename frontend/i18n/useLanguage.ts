"use client"

import { useEffect, useState } from "react"
import en from "./en"
import vi from "./vi"

type Language = "en" | "vi"

const dictionaries = {
  en,
  vi,
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("vi")

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null
    if (saved && dictionaries[saved]) {
      setLanguage(saved)
    }
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  return {
    language,
    t: dictionaries[language],
    changeLanguage,
  }
}
