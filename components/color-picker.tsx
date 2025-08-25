"use client"

import { useState } from "react"

function hexToHSL(hex: string) {
  hex = hex.replace("#", "")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("")
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function ColorPicker() {
  const [color, setColor] = useState("#1fb2a6")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setColor(hex)
    const { h, s, l } = hexToHSL(hex)
    const hsl = `${h} ${s}% ${l}%`
    const foreground = l > 50 ? "0 0% 0%" : "0 0% 100%"
    const root = document.documentElement
    root.style.setProperty("--primary", hsl)
    root.style.setProperty("--ring", hsl)
    root.style.setProperty("--secondary", hsl)
    root.style.setProperty("--accent", hsl)
    root.style.setProperty("--primary-foreground", foreground)
    root.style.setProperty("--secondary-foreground", foreground)
    root.style.setProperty("--accent-foreground", foreground)
  }

  return (
    <input
      type="color"
      value={color}
      onChange={handleChange}
      className="h-8 w-8 cursor-pointer rounded-md border p-0"
      title="Pick theme color"
    />
  )
}
