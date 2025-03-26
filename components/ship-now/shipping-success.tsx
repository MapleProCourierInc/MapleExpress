"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface ShippingSuccessProps {
  orderNumber: string
}

export function ShippingSuccess({ orderNumber }: ShippingSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="mb-6 text-primary">
        <CheckCircle className="h-20 w-20" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Order Submitted Successfully!</h1>
      <p className="text-xl mb-2">Thank you for choosing MapleXpress</p>
      <p className="text-muted-foreground mb-8">Your order has been received and is being processed.</p>

      <div className="bg-muted p-4 rounded-lg mb-8">
        <p className="text-sm text-muted-foreground">Order Number</p>
        <p className="text-xl font-bold">{orderNumber}</p>
      </div>

      <p className="text-muted-foreground mb-8 max-w-md">
        You will receive a confirmation email shortly with your order details and tracking information.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="#track">Track Your Package</Link>
        </Button>
      </div>
    </motion.div>
  )
}

