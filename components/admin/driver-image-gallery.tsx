"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function DriverImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<string | null>(null)

  if (!images.length) {
    return <p className="text-sm text-muted-foreground">No images available.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((url, idx) => (
          <button key={`${url}-${idx}`} className="overflow-hidden rounded-md border" onClick={() => setActive(url)}>
            <img src={url} alt={`Driver image ${idx + 1}`} className="h-28 w-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {active ? (
            <div className="relative h-[60vh] w-full">
              <Image src={active} alt="Driver image preview" fill className="object-contain" unoptimized />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
