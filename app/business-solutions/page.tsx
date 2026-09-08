import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Headphones,
  PackageCheck,
  Plug,
  ReceiptText,
  Route,
  Truck,
} from "lucide-react"
import { BusinessLeadForm } from "@/components/business/business-lead-form"
import { Footer } from "@/components/shared/footer"
import { Header } from "@/components/shared/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "MapleXpress for Business | Local Business Delivery",
  description:
    "Recurring deliveries, scheduled pickups, multi-stop routes, and practical local courier solutions for Greater Moncton businesses.",
}

const BUSINESS_ESSENTIALS = [
  "Scheduled pickups that fit your workday",
  "Multiple stops handled in one coordinated route",
  "Volume pricing based on your delivery needs",
  "Monthly invoicing options for approved accounts",
  "Delivery records and proof of completion",
]

const CAPABILITIES = [
  {
    title: "Recurring Deliveries",
    description: "Set up dependable delivery patterns for the work your business sends every day or every week.",
    icon: CalendarClock,
  },
  {
    title: "Same-Day Service",
    description: "Move time-sensitive documents, parts, and parcels across Greater Moncton without waiting for a national network.",
    icon: Clock,
  },
  {
    title: "Scheduled Pickups",
    description: "Choose regular pickup windows so your team knows when outgoing deliveries will leave.",
    icon: Truck,
  },
  {
    title: "Multi-Stop Routes",
    description: "Combine several local stops into a practical route instead of arranging each delivery separately.",
    icon: Route,
  },
  {
    title: "Volume Discounts",
    description: "Talk with us about pricing options shaped around repeat volume, route density, and delivery frequency.",
    icon: BadgeDollarSign,
  },
  {
    title: "Proof of Delivery",
    description: "Keep a clear record that each delivery was completed, without chasing your staff or customer for an update.",
    icon: ClipboardCheck,
  },
  {
    title: "Monthly Billing",
    description: "Approved business accounts can discuss consolidated invoicing instead of paying shipment by shipment.",
    icon: ReceiptText,
  },
  {
    title: "Dedicated Account Support",
    description: "Work with a local team that understands your delivery pattern and can help when plans change.",
    icon: Headphones,
  },
  {
    title: "API & Integrations",
    description: "System integrations are part of our future business roadmap for teams that want to automate delivery requests.",
    icon: Plug,
    planned: true,
  },
]

const BUSINESS_TYPES = [
  "Auto parts shops",
  "Law firms",
  "Pharmacies",
  "Retailers",
  "Florists",
  "Restaurants & bakeries (where suitable)",
  "Medical & dental offices",
  "Accounting offices",
  "E-commerce sellers",
  "Construction suppliers",
  "Property managers",
  "Printing companies",
]

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Tell us how your week works",
    description: "Share your typical volume, pickup location, delivery area, timing, and package types.",
  },
  {
    number: "02",
    title: "We shape a practical plan",
    description: "We review recurring schedules, multi-stop opportunities, and the service approach that fits your operation.",
  },
  {
    number: "03",
    title: "Your team gets time back",
    description: "MapleXpress handles the local delivery work while your employees stay focused on their actual roles.",
  },
]

export default function BusinessSolutionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b py-16 md:py-24 lg:py-28">
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-forest-soft via-background to-brand-maple-soft" />
          <div className="absolute -right-32 -top-40 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-brand-forest/10 blur-3xl" />

          <div className="container grid items-center gap-12 lg:grid-cols-[1.08fr,0.92fr] lg:gap-16">
            <div>
              <Badge variant="outline" className="border-primary/30 bg-background/80 px-3 py-1 text-primary">
                MapleXpress for Business
              </Badge>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Local delivery that works like part of your operation
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                Stop sending employees across town to deliver documents, parts, and packages. MapleXpress can handle
                your local deliveries while your team focuses on your business.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="#business-enquiry">
                    Discuss Your Delivery Needs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/ship-now">Ship a Package Now</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-foreground/80">
                {['Scheduled pickups', 'Multiple stops', 'Business pricing'].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-forest" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border-primary/15 bg-background/90 shadow-2xl shadow-primary/10 backdrop-blur">
              <div className="bg-brand-forest px-6 py-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">A simpler delivery day</p>
                <h2 className="mt-2 text-2xl font-bold">Keep your people where they add the most value.</h2>
              </div>
              <CardContent className="space-y-0 p-6">
                {[
                  ["Your team prepares the delivery", "Documents, parts, supplies, parcels, or customer orders."],
                  ["MapleXpress handles the route", "Pickup, local transport, multiple stops, and completion."],
                  ["You keep a clear record", "Track progress and confirm that the delivery was completed."],
                ].map(([title, description], index) => (
                  <div key={title} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < 2 ? <span className="absolute left-5 top-10 h-[calc(100%-1.5rem)] w-px bg-border" /> : null}
                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="pt-1">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container grid gap-12 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Built for Local Businesses</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Delivery should support your work—not interrupt it.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                A delivery across town can quietly consume an employee’s afternoon. Repeat that several times a week
                and it becomes a real operating cost. We help businesses move local items without pulling their own
                people away from customers, projects, or the front desk.
              </p>
            </div>
            <div className="rounded-3xl border bg-muted/30 p-6 shadow-sm md:p-8">
              <h3 className="text-lg font-bold">What a business delivery plan can include</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {BUSINESS_ESSENTIALS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-forest-soft text-brand-forest">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/25 py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Business Delivery Capabilities</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Flexible enough for the way your business actually operates</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Start with the services you need now. As your delivery volume changes, we can discuss a setup that
                remains straightforward for your team.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((capability) => {
                const Icon = capability.icon
                return (
                  <Card key={capability.title} className="group h-full border-border/80 bg-background transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        {capability.planned ? <Badge variant="secondary">Planned</Badge> : null}
                      </div>
                      <CardTitle className="pt-3 text-xl">{capability.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-7 text-muted-foreground">{capability.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-brand-forest py-20 text-white md:py-24">
          <div className="container grid gap-10 lg:grid-cols-[0.75fr,1.25fr] lg:items-start">
            <div>
              <Building2 className="h-9 w-9 text-white/80" />
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">A practical fit for many local teams</h2>
              <p className="mt-4 leading-7 text-white/75">
                If your business regularly moves items between offices, suppliers, stores, job sites, or customers,
                we’d like to understand your route.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUSINESS_TYPES.map((businessType) => (
                <div key={businessType} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
                  {businessType}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <PackageCheck className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">From delivery problem to working plan</h2>
              <p className="mt-4 text-lg text-muted-foreground">A conversation is enough to get started.</p>
            </div>
            <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
              {PROCESS_STEPS.map((step) => (
                <div key={step.number} className="relative rounded-2xl border bg-background p-6">
                  <span className="text-4xl font-black text-primary/15">{step.number}</span>
                  <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="business-enquiry" className="scroll-mt-16 border-t bg-gradient-to-br from-brand-maple-soft via-background to-brand-forest-soft py-20 md:py-24">
          <div className="container grid gap-12 lg:grid-cols-[0.8fr,1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Let’s Talk Business Delivery</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Show us what needs to move.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Tell us about a typical delivery week. We’ll review the details and follow up about a practical service
                approach for your business.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "No commitment required",
                  "Built around your actual routes and volume",
                  "Reviewed by the local MapleXpress team",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-brand-forest" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <Card className="border-primary/15 bg-background shadow-xl">
              <CardHeader className="border-b bg-muted/25">
                <CardTitle className="text-2xl">Business Delivery Enquiry</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  All fields are required unless they are marked optional.
                </p>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <BusinessLeadForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
