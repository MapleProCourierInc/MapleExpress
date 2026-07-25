type DialogOutsideInteractionEvent = {
  target: EventTarget | null
  detail?: {
    originalEvent?: {
      target?: EventTarget | null
    }
  }
  preventDefault: () => void
}

function getTargetElement(target: EventTarget | null | undefined): Element | null {
  if (target instanceof Element) {
    return target
  }

  if (target instanceof Node) {
    return target.parentElement
  }

  return null
}

export function preventGooglePlacesDialogDismiss(event: DialogOutsideInteractionEvent) {
  const targets = [event.target, event.detail?.originalEvent?.target]
  const isGooglePlacesInteraction = targets.some((target) =>
    getTargetElement(target)?.closest(".pac-container"),
  )

  if (isGooglePlacesInteraction) {
    event.preventDefault()
  }
}
