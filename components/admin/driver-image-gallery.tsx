"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type DriverImageGalleryItem = {
  key: string
  url?: string | null
  title?: string
  subtitle?: string
}

export function DriverImageGallery({
  images,
  fallbackLabel = "Failed to load image preview",
  gridClassName,
  itemClassName,
  imageClassName,
}: {
  images: DriverImageGalleryItem[]
  fallbackLabel?: string
  gridClassName?: string
  itemClassName?: string
  imageClassName?: string
}) {
  const [active, setActive] = useState<DriverImageGalleryItem | null>(null)

  if (!images.length) {
    return <p className="text-sm text-muted-foreground">No images available.</p>
  }

  return (
    <>
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", gridClassName)}>
        {images.map((image, idx) => (
          <button
            key={`${image.key}-${idx}`}
            className={cn("overflow-hidden rounded-md border text-left", itemClassName)}
            onClick={() => setActive(image)}
          >
            {image.url ? (
              <img
                src={image.url}
                alt={image.title || `Driver image ${idx + 1}`}
                className={cn("h-28 w-full object-cover", imageClassName)}
              />
            ) : (
              <div className={cn("flex h-28 items-center justify-center bg-muted px-2 text-center text-xs text-muted-foreground", imageClassName)}>
                {fallbackLabel}
              </div>
            )}
            <div className="space-y-1 p-2">
              {image.title ? <p className="text-xs font-medium">{image.title}</p> : null}
              {image.subtitle ? <p className="text-[11px] text-muted-foreground">{image.subtitle}</p> : null}
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
        </DialogContent>
      </Dialog>
    </>
  )
}
