"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  normalizePhoneInput,
  PHONE_NUMBER_LENGTH,
  PHONE_NUMBER_VALIDATION_MESSAGE,
} from "@/lib/phone-validation"

export const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ onChange, onInput, onInvalid, placeholder, title, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete={props.autoComplete || "tel"}
      pattern={`[0-9]{${PHONE_NUMBER_LENGTH}}`}
      minLength={PHONE_NUMBER_LENGTH}
      maxLength={PHONE_NUMBER_LENGTH}
      placeholder={placeholder || "10-digit phone number"}
      title={title || PHONE_NUMBER_VALIDATION_MESSAGE}
      onInput={(event) => {
        event.currentTarget.setCustomValidity("")
        onInput?.(event)
      }}
      onInvalid={(event) => {
        event.currentTarget.setCustomValidity(PHONE_NUMBER_VALIDATION_MESSAGE)
        onInvalid?.(event)
      }}
      onChange={(event) => {
        event.currentTarget.value = normalizePhoneInput(event.currentTarget.value)
        event.currentTarget.setCustomValidity("")
        onChange?.(event)
      }}
    />
  ),
)

PhoneInput.displayName = "PhoneInput"
