"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import styles from "./ThemeToggle.module.css"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={styles.toggleButton}
      aria-label="Toggle theme"
    >
      <Sun className={`${styles.icon} ${styles.sun}`} />
      <Moon className={`${styles.icon} ${styles.moon}`} />
    </button>
  )
}
