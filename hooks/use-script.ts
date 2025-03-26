"use client"

import { useState, useEffect } from "react"

type ScriptStatus = "idle" | "loading" | "ready" | "error"

interface ScriptOptions {
  removeOnUnmount?: boolean
  callbackName?: string
}

export function useScript(src: string, options: ScriptOptions = {}): ScriptStatus {
  const { removeOnUnmount = false, callbackName } = options
  const [status, setStatus] = useState<ScriptStatus>(src ? "loading" : "idle")

  useEffect(() => {
    if (!src) {
      setStatus("idle")
      return
    }

    // If a callback name is provided, create a global callback function
    if (callbackName && typeof window !== "undefined") {
      // @ts-ignore - dynamically adding property to window
      window[callbackName] = () => {
        setStatus("ready")
      }
    }

    // Check if the script already exists
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement
    let isNewScript = false

    if (!script) {
      isNewScript = true
      // Create script
      script = document.createElement("script")
      script.src = src
      script.async = true
      script.defer = true
      script.setAttribute("data-status", "loading")
      document.body.appendChild(script)
    } else {
      // Grab existing script status from attribute and set to state
      const dataStatus = script.getAttribute("data-status")
      if (dataStatus) setStatus(dataStatus as ScriptStatus)
    }

    // Script event handler to update status in state
    const setStateFromEvent = (event: Event) => {
      const newStatus = event.type === "load" ? "ready" : "error"
      script.setAttribute("data-status", newStatus)
      setStatus(newStatus)
    }

    // Add event listeners
    script.addEventListener("load", setStateFromEvent)
    script.addEventListener("error", setStateFromEvent)

    // Remove event listeners on cleanup
    return () => {
      if (script) {
        script.removeEventListener("load", setStateFromEvent)
        script.removeEventListener("error", setStateFromEvent)
      }

      // Clean up the global callback if it was created
      if (callbackName && typeof window !== "undefined") {
        // @ts-ignore - dynamically removing property from window
        delete window[callbackName]
      }

      // Remove script if it was created by this hook instance and removeOnUnmount is true
      if (removeOnUnmount && isNewScript && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [src, callbackName, removeOnUnmount])

  return status
}

