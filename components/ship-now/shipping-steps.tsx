import { Check, Package, MapPin, Truck, ClipboardList, CreditCard } from "lucide-react"

interface ShippingStepsProps {
    currentStep: number
}

export function ShippingSteps({ currentStep }: ShippingStepsProps) {
    const steps = [
        { name: "Package Details", icon: Package },
        { name: "Pickup Address", icon: MapPin },
        { name: "Delivery Address", icon: Truck },
        { name: "Review", icon: ClipboardList },
        { name: "Payment", icon: CreditCard },
    ]

    return (
        <div className="w-full mb-8">
            <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center relative">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300
                ${
                                currentStep > index
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : currentStep === index
                                        ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                                        : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {currentStep > index ? <Check className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                        </div>
                        <span
                            className={`text-sm mt-2 font-medium hidden sm:block transition-all duration-300
                ${currentStep >= index ? "text-primary" : "text-muted-foreground"}`}
                        >
              {step.name}
            </span>
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-6 left-12 w-[calc(100%-3rem)] h-[2px] transition-all duration-500
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

