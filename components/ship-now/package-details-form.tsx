"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PackageItem } from "@/components/ship-now/ship-now-form"

interface PackageDetailsFormProps {
  package: PackageItem
  onUpdatePackage: (pkg: Partial<PackageItem>) => void
  onNext: () => void
  canProceed: boolean
}

type DimensionField = "length" | "width" | "height"
type DimensionUnit = "cm" | "in" | "m"
type WeightUnit = "kg" | "lb" | "g"

const dimensionFields: DimensionField[] = ["length", "width", "height"]

const dimensionUnitOptions: Array<{ value: DimensionUnit; label: string }> = [
  { value: "cm", label: "cm" },
  { value: "in", label: "in" },
  { value: "m", label: "m" },
]

const weightUnitOptions: Array<{ value: WeightUnit; label: string }> = [
  { value: "lb", label: "lb" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
]

const dimensionLabels: Record<DimensionField, string> = {
  length: "Length",
  width: "Width",
  height: "Height",
}

const convertDimensionToCm = (value: number, unit: DimensionUnit) => {
  if (unit === "in") return value * 2.54
  if (unit === "m") return value * 100
  return value
}

const convertDimensionFromCm = (value: number, unit: DimensionUnit) => {
  if (unit === "in") return value / 2.54
  if (unit === "m") return value / 100
  return value
}

const convertWeightToKg = (value: number, unit: WeightUnit) => {
  if (unit === "lb") return value * 0.45359237
  if (unit === "g") return value / 1000
  return value
}

const convertWeightFromKg = (value: number, unit: WeightUnit) => {
  if (unit === "lb") return value / 0.45359237
  if (unit === "g") return value * 1000
  return value
}

const formatMeasurementValue = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return ""
  return Number.parseFloat(value.toFixed(3)).toString()
}

const parseMeasurementValue = (value: string) => {
  const numValue = Number.parseFloat(value)
  return isNaN(numValue) ? 0 : numValue
}

const getDimensionInputStep = (unit: DimensionUnit) => (unit === "m" ? "0.01" : "0.1")

const getWeightInputStep = (unit: WeightUnit) => (unit === "g" ? "1" : "0.1")

const defaultDimensionUnit: DimensionUnit = "cm"
const defaultWeightUnit: WeightUnit = "kg"

const getDimensionInputValues = (pkg: PackageItem, unit: DimensionUnit) => ({
  length: formatMeasurementValue(convertDimensionFromCm(pkg.length, unit)),
  width: formatMeasurementValue(convertDimensionFromCm(pkg.width, unit)),
  height: formatMeasurementValue(convertDimensionFromCm(pkg.height, unit)),
})

export function PackageDetailsForm({ package: pkg, onUpdatePackage, onNext, canProceed }: PackageDetailsFormProps) {
  const [showFragileDialog, setShowFragileDialog] = useState(false)
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>(defaultDimensionUnit)
  const [dimensionInputValues, setDimensionInputValues] = useState<Record<DimensionField, string>>(() =>
    getDimensionInputValues(pkg, defaultDimensionUnit)
  )
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(defaultWeightUnit)
  const [weightInputValue, setWeightInputValue] = useState(() =>
    formatMeasurementValue(convertWeightFromKg(pkg.weight, defaultWeightUnit))
  )

  useEffect(() => {
    setDimensionInputValues(getDimensionInputValues(pkg, dimensionUnit))
    setWeightInputValue(formatMeasurementValue(convertWeightFromKg(pkg.weight, weightUnit)))
  }, [pkg.id])

  const handleInputChange = (field: keyof PackageItem, value: any) => {
    if (field === "length" || field === "width" || field === "height" || field === "weight") {
      // Ensure numeric values are properly converted to numbers
      const numValue = Number.parseFloat(value)
      onUpdatePackage({
        [field]: isNaN(numValue) ? 0 : numValue,
      })
    } else {
      onUpdatePackage({
        [field]: value,
      })
    }
  }

  const handleDimensionChange = (field: DimensionField, value: string) => {
    setDimensionInputValues((prev) => ({
      ...prev,
      [field]: value,
    }))
    onUpdatePackage({
      [field]: convertDimensionToCm(parseMeasurementValue(value), dimensionUnit),
    })
  }

  const handleDimensionUnitChange = (unit: DimensionUnit) => {
    setDimensionUnit(unit)
    onUpdatePackage({
      length: convertDimensionToCm(parseMeasurementValue(dimensionInputValues.length), unit),
      width: convertDimensionToCm(parseMeasurementValue(dimensionInputValues.width), unit),
      height: convertDimensionToCm(parseMeasurementValue(dimensionInputValues.height), unit),
    })
  }

  const handleWeightChange = (value: string) => {
    setWeightInputValue(value)
    onUpdatePackage({
      weight: convertWeightToKg(parseMeasurementValue(value), weightUnit),
    })
  }

  const handleWeightUnitChange = (unit: WeightUnit) => {
    setWeightUnit(unit)
    onUpdatePackage({
      weight: convertWeightToKg(parseMeasurementValue(weightInputValue), unit),
    })
  }

  const handleFragileChange = (checked: boolean | "indeterminate") => {
    const isFragile = checked === true

    handleInputChange("fragile", isFragile)

    if (isFragile) {
      setShowFragileDialog(true)
    }
  }

  const handleSignatureRequiredChange = (checked: boolean | "indeterminate") => {
    handleInputChange("signatureRequired", checked === true)
  }

  return (
    <>
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

          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Label>Package Dimensions</Label>
              <div className="w-24">
                <Label htmlFor="dimension-unit" className="sr-only">
                  Dimension unit
                </Label>
                <Select value={dimensionUnit} onValueChange={(value) => handleDimensionUnitChange(value as DimensionUnit)}>
                  <SelectTrigger id="dimension-unit" aria-label="Dimension unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensionUnitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dimensionFields.map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>{dimensionLabels[field]}</Label>
                  <Input
                      id={field}
                      type="number"
                      min="0"
                      step={getDimensionInputStep(dimensionUnit)}
                      placeholder="0"
                      value={dimensionInputValues[field]}
                      onChange={(e) => handleDimensionChange(field, e.target.value)}
                      className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Weight</Label>
            <div className="mt-1 flex gap-2">
              <Input
                  id="weight"
                  type="number"
                  min="0"
                  step={getWeightInputStep(weightUnit)}
                  placeholder="0"
                  value={weightInputValue}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="min-w-0 flex-1"
              />
              <Select value={weightUnit} onValueChange={(value) => handleWeightUnitChange(value as WeightUnit)}>
                <SelectTrigger className="w-28 shrink-0" aria-label="Weight unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weightUnitOptions.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                  id="fragile"
                  checked={pkg.fragile}
                  onCheckedChange={handleFragileChange}
              />
              <Label htmlFor="fragile">This package contains fragile items</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                  id="signature-required"
                  checked={pkg.signatureRequired}
                  onCheckedChange={handleSignatureRequiredChange}
              />
              <Label htmlFor="signature-required">Require signature on delivery</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onNext} disabled={!canProceed}>
            Continue
          </Button>
        </div>
      </div>
      <Dialog open={showFragileDialog} onOpenChange={setShowFragileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pack It Safe</DialogTitle>
            <DialogDescription>
              We&apos;ll be gentle, but roads aren&apos;t always. Please cushion and secure your item well before sending
              it on its way.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowFragileDialog(false)}>I acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

