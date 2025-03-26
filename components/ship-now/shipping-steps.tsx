import { Check, Package, MapPin, Truck, ClipboardList } from "lucide-react"

interface ShippingStepsProps {
  currentStep: number
}

export function ShippingSteps({ currentStep }: ShippingStepsProps) {
  const steps = [
    { name: "Package Details", icon: Package },
    { name: "Pickup Address", icon: MapPin },
    { name: "Delivery Address", icon: Truck },
    { name: "Review", icon: ClipboardList },
  ]

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 
                ${
                  currentStep > index
                    ? "bg-primary text-primary-foreground"
                    : currentStep === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
            >
              {currentStep > index ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <span
              className={`text-sm mt-2 font-medium hidden sm:block
                ${currentStep >= index ? "text-primary" : "text-muted-foreground"}`}
            >
              {step.name}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`absolute top-5 left-10 w-[calc(100%-2.5rem)] h-[2px]
                  ${
                    currentStep > index
                      ? "bg-primary"
                      : index === currentStep
                        ? "bg-gradient-to-r from-primary to-muted"
                        : "bg-muted"
                  }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

