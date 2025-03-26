"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { PackageItem } from "@/components/ship-now/ship-now-form"

interface PackageDetailsFormProps {
  package: PackageItem
  onUpdatePackage: (pkg: Partial<PackageItem>) => void
  onNext: () => void
  canProceed: boolean
}

export function PackageDetailsForm({ package: pkg, onUpdatePackage, onNext, canProceed }: PackageDetailsFormProps) {
  const handleInputChange = (field: keyof PackageItem, value: any) => {
    onUpdatePackage({
      [field]: value,
    })
  }

  return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Package Details</h1>
          <p className="text-muted-foreground mt-2">Please provide the details of your package</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="contents">Package Contents</Label>
            <Textarea
                id="contents"
                placeholder="Describe the contents of your package"
                value={pkg.contents}
                onChange={(e) => handleInputChange("contents", e.target.value)}
                className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="length">Length (cm)</Label>
              <Input
                  id="length"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={pkg.length || ""}
                  onChange={(e) => handleInputChange("length", Number.parseFloat(e.target.value) || 0)}
                  className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="width">Width (cm)</Label>
              <Input
                  id="width"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={pkg.width || ""}
                  onChange={(e) => handleInputChange("width", Number.parseFloat(e.target.value) || 0)}
                  className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                  id="height"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={pkg.height || ""}
                  onChange={(e) => handleInputChange("height", Number.parseFloat(e.target.value) || 0)}
                  className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={pkg.weight || ""}
                onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || 0)}
                className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
                id="fragile"
                checked={pkg.fragile}
                onCheckedChange={(checked) => handleInputChange("fragile", checked === true)}
            />
            <Label htmlFor="fragile">This package contains fragile items</Label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onNext} disabled={!canProceed}>
            Continue
          </Button>
        </div>
      </div>
  )
}

