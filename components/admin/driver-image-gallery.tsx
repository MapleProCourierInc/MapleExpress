"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type DriverImageGalleryItem = {
  key: string
  url?: string | null
  title?: string
  subtitle?: string
}

export function DriverImageGallery({
  images,
  fallbackLabel = "Failed to load image preview",
}: {
  images: DriverImageGalleryItem[]
  fallbackLabel?: string
}) {
  const [active, setActive] = useState<DriverImageGalleryItem | null>(null)

  if (!images.length) {
    return <p className="text-sm text-muted-foreground">No images available.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image, idx) => (
          <button key={`${image.key}-${idx}`} className="overflow-hidden rounded-md border text-left" onClick={() => setActive(image)}>
            {image.url ? (
              <img src={image.url} alt={image.title || `Driver image ${idx + 1}`} className="h-28 w-full object-cover" />
            ) : (
              <div className="flex h-28 items-center justify-center bg-muted px-2 text-center text-xs text-muted-foreground">{fallbackLabel}</div>
            )}
            <div className="space-y-1 p-2">
              {image.title ? <p className="text-xs font-medium">{image.title}</p> : null}
              {image.subtitle ? <p className="break-all text-[11px] text-muted-foreground">{image.subtitle}</p> : null}
              <p className="break-all text-[11px] text-muted-foreground">{image.key}</p>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{active?.title || "Image preview"}</DialogTitle>
          </DialogHeader>
          {active ? (
            active.url ? (
              <div className="relative h-[60vh] w-full">
                <Image src={active.url} alt={active.title || "Driver image preview"} fill className="object-contain" unoptimized />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{fallbackLabel}</p>
            )
          ) : null}
          {active?.subtitle ? <p className="text-xs text-muted-foreground">{active.subtitle}</p> : null}
          {active ? <p className="break-all text-xs text-muted-foreground">{active.key}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
