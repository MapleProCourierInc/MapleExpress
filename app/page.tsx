"use client"
import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Package,
  Clock,
  Headphones,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Route,
  Mail,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { VerificationPending } from "@/components/verification-pending"
import { IndividualProfileForm } from "@/components/individual-profile-form"
import { OrganizationProfileForm } from "@/components/organization-profile-form"
import { UserProfile } from "@/components/user-profile"
import { ServiceAvailabilitySection } from "@/components/service-availability-section"
import { isIndividualAccount } from "@/lib/profile-account-type"
import { Footer } from "@/components/shared/footer"
import { usePlatformConfiguration } from "@/components/platform/platform-configuration-provider"
import { useToast } from "@/hooks/use-toast"

type ContactRequestResponse = {
  requestId?: string
  message?: string
}

type ContactRequestProblem = {
  title?: string
  detail?: string
  message?: string
  errors?: Record<string, string> | null
}

const CONTACT_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phoneNumber: "Phone number",
  serviceType: "Service type",
  additionalInformation: "Additional information",
}

function contactRequestErrorDescription(problem: ContactRequestProblem | null) {
  const fieldErrors = Object.entries(problem?.errors || {}).map(
    ([field, message]) => `${CONTACT_FIELD_LABELS[field] || field}: ${message}`,
  )

  return [problem?.detail || problem?.message, ...fieldErrors].filter(Boolean).join(" ")
    || "Please try again later."
}

const HOME_SERVICES: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Same-Day Delivery",
    description: "Time-sensitive documents and parcels picked up and delivered across Greater Moncton on the same day.",
    icon: Clock,
  },
  {
    title: "Scheduled Business Delivery",
    description: "Daily or weekly pickup schedules for businesses with recurring delivery needs.",
    icon: CalendarClock,
  },
  {
    title: "On-Demand Courier",
    description: "Responsive pickup and delivery for documents, parcels, parts, and supplies.",
    icon: Package,
  },
  {
    title: "Last-Mile Delivery",
    description: "Dependable local delivery support for retailers, e-commerce businesses, and their customers.",
    icon: MapPin,
  },
  {
    title: "Multi-Package Business Routes",
    description: "Practical route options for businesses sending multiple packages across the region.",
    icon: Route,
  },
  {
    title: "Local Pickup",
    description: "Convenient parcel pickup from your home or workplace, ready for delivery across our service area.",
    icon: Navigation,
  },
]

const WHY_CHOOSE_US: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Same-Day Means Same-Day",
    description: "Packages are picked up and delivered locally without spending days in a national sorting network.",
    icon: Clock,
  },
  {
    title: "Affordable Local Pricing",
    description: "Straightforward pricing designed around local delivery needs.",
    icon: BadgeDollarSign,
  },
  {
    title: "Real-Time Tracking",
    description: "Follow your parcel from pickup through delivery with clear status updates.",
    icon: Radio,
  },
  {
    title: "Proof of Delivery",
    description: "Receive confirmation when your delivery has been completed.",
    icon: ClipboardCheck,
  },
  {
    title: "Local Customer Support",
    description: "Speak with the MapleXpress team serving the Greater Moncton area.",
    icon: Headphones,
  },
]

export default function LandingPage() {
  const { user, isLoading, me } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  // Email is enough for resending verification now

  // When the page loads, check if we stored a signup email
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maplexpress_signup_email")
      if (saved) {
        setVerificationEmail(saved)
        setShowVerification(true)
      }
    } catch (e) {
      console.error("Failed to read signup email", e)
    }
  }, [])

  // Check user status when user changes
  useEffect(() => {
    if (user) {
      switch (user.userStatus) {
        case "pendingEmailVerification":
          // Extract email from localStorage if available
          const userData = localStorage.getItem("maplexpress_user_data")
          if (userData) {
            try {
              const parsedData = JSON.parse(userData)
              if (parsedData.email) {
                setVerificationEmail(parsedData.email)
              }
            } catch (error) {
              console.error("Error parsing user data:", error)
            }
          }

          setShowVerification(true)
          break

        case "pendingProfileCompletion":
          // The renderContent function will handle showing the appropriate profile form
          setShowVerification(false)
          break

        case "active":
          setShowVerification(false)
          break

        default:
          setShowVerification(false)
      }
    } else {
      setShowVerification(false)
    }
  }, [user])

  const handleSignupSuccess = (email: string) => {
    setIsSignupModalOpen(false)
    setVerificationEmail(email)
    setShowVerification(true)
  }

  const handleCloseVerification = () => {
    setShowVerification(false)
    setVerificationEmail("")
    try {
      localStorage.removeItem("maplexpress_signup_email")
    } catch (e) {
      console.error("Failed to remove signup email", e)
    }
  }

  const handleVerificationConfirmed = () => {
    handleCloseVerification()
    setIsLoginModalOpen(true)
  }

  // Determine what to show based on user status or signup state
  const renderContent = () => {
    if (showVerification) {
      return (
        <div className="container py-20">
          <VerificationPending
            email={verificationEmail || "your email"}
            onClose={handleCloseVerification}
            onConfirmed={handleVerificationConfirmed}
          />
        </div>
      )
    }

    if (!user) {
      return <LandingContent />
    }

    switch (user.userStatus) {
      case "pendingEmailVerification":
        return (
          <div className="container py-20">
            <VerificationPending
              email={verificationEmail || "your email"}
              onClose={handleCloseVerification}
              onConfirmed={handleVerificationConfirmed}
            />
          </div>
        )
      case "pendingProfileCompletion":
        return (
          <div className="container py-20">
            {isIndividualAccount(me?.groups, user.userType) ? <IndividualProfileForm /> : <OrganizationProfileForm />}
          </div>
        )
      case "active":
        return <LandingContent />
      default:
        return <LandingContent />
    }
  }

  return (
    <div id="top" className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="#top" aria-label="Scroll to the top of the homepage" className="flex items-center">
              <img
                src="/3.svg"
                alt="MapleXpress Logo"
                className="h-[175px] w-auto"
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
            <Link href="/ship-now" className="text-sm font-medium hover:text-primary">
              Ship Now
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-primary">
              Services
            </Link>
            <Link
              href="/rates"
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Rates
            </Link>
            <Link href="#availability" className="text-sm font-medium hover:text-primary">
              Availability
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary">
              About Us
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/track" className="text-sm font-medium hover:text-primary hidden md:block">
              Track Package
            </Link>
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <UserProfile />
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsLoginModalOpen(true)}>
                  Login
                </Button>
                <Button
                  className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground"
                  onClick={() => setIsSignupModalOpen(true)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenSignup={() => {
          setIsLoginModalOpen(false)
          setIsSignupModalOpen(true)
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={handleSignupSuccess}
        onOpenLogin={() => {
          setIsSignupModalOpen(false)
          setIsLoginModalOpen(true)
        }}
      />

      {/* Main Content */}
      <main className="flex-1">{renderContent()}</main>
      <Footer />
    </div>
  )
}

// Extract the landing content to a separate component
function LandingContent() {
  const [trackingInput, setTrackingInput] = useState("")
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { config, isLoading } = usePlatformConfiguration()
  const location = config?.contact?.location || null
  const phoneEntries = (config?.contact?.phones || []).filter((entry) => entry.value)
  const emailEntries = (config?.contact?.emails || []).filter((entry) => entry.value)

  const cityRegionLine = location
    ? [
        location.city,
        [location.provinceOrState, location.postalCode].filter(Boolean).join(" "),
      ].filter(Boolean).join(", ")
    : ""
  const locationLines = location
    ? [
        location.locationName,
        location.addressLine1,
        location.addressLine2,
        cityRegionLine,
        location.countryCode === "CA" ? "Canada" : location.countryCode,
      ].filter((line): line is string => Boolean(line))
    : []

  const handleContactRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmittingContact) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const requestBody = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phoneNumber: String(formData.get("phoneNumber") || "").trim(),
      serviceType: String(formData.get("serviceType") || "").trim(),
      additionalInformation: String(formData.get("additionalInformation") || "").trim() || null,
    }

    setIsSubmittingContact(true)

    try {
      const response = await fetch("/api/public/quote-requests", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const payload = await response.json().catch(() => null) as ContactRequestResponse | ContactRequestProblem | null

      if (!response.ok) {
        const problem = payload as ContactRequestProblem | null
        toast({
          variant: "destructive",
          title: "Unable to send message",
          description: contactRequestErrorDescription(problem),
        })
        return
      }

      form.reset()
      toast({
        title: "Message sent",
        description: "Thanks for reaching out. Your message has been sent to the MapleXpress team.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Unable to send message",
        description: "Your message could not be sent. Please try again later.",
      })
    } finally {
      setIsSubmittingContact(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Same-Day Delivery Across <span className="text-primary">Greater Moncton</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[800px] mb-8">
            Affordable local courier service for businesses and individuals. We pick up your parcel and deliver it the
            same day—quickly, safely, and locally.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              asChild
            >
              <Link href="/ship-now">Ship Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10"
              asChild
            >
              <Link href="#get-in-touch">Get in Touch</Link>
            </Button>
            <Button
              size="lg"
              className="border border-brand-maple/60 bg-gradient-to-r from-brand-forest to-brand-forest/90 text-white shadow-lg shadow-brand-forest/20 transition-transform hover:-translate-y-0.5 hover:from-brand-forest/90 hover:to-brand-forest"
              asChild
            >
              <Link href="/business-solutions" className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Solutions
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/10 to-background/5 -z-10" />
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Practical delivery options for everyday parcels and recurring business needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {HOME_SERVICES.map((service) => {
              const Icon = service.icon
              return (
                <Card key={service.title} className="home-surface-card h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <ServiceAvailabilitySection />

      {/* Why Choose Us Section */}
      <section id="about" className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/Why Choose Us Section.png?height=600&width=800"
                alt="Courier service in action"
                width={800}
                height={600}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Local. Fast. Affordable. Secure.
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose MapleXpress?</h2>
              <div className="space-y-5">
                {WHY_CHOOSE_US.map((reason) => {
                  const Icon = reason.icon
                  return (
                    <div key={reason.title} className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1">{reason.title}</h3>
                        <p className="text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section id="track" className="py-20 bg-gradient-to-r from-secondary/10 to-primary/10">
        <div className="container">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Track Your Package</h2>
            <p className="text-muted-foreground mb-8">
              Enter your tracking number to get real-time updates on your shipment's location and estimated delivery
              time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-[600px] mx-auto">
              <Input
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter tracking number"
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (trackingInput.trim()) {
                    router.push(`/track?trackingNumber=${encodeURIComponent(trackingInput.trim())}`)
                  }
                }}
              >
                Track Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section id="get-in-touch" className="scroll-mt-16 py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Tell us what you need delivered or ask us a question. Our team will review your message and get back to
                you as soon as possible.
              </p>
              <form className="space-y-6" onSubmit={handleContactRequestSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Enter your first name"
                      autoComplete="given-name"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                      autoComplete="family-name"
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    minLength={7}
                    maxLength={30}
                    pattern="[0-9+() .\-]{7,30}"
                    title="Enter a valid phone number using numbers, spaces, or + ( ) . -"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="service" className="text-sm font-medium">
                    Service Type
                  </label>
                  <Input
                    id="service"
                    name="serviceType"
                    placeholder="Enter the service you need"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Additional Information
                  </label>
                  <textarea
                    id="message"
                    name="additionalInformation"
                    rows={4}
                    maxLength={4000}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us more about your shipping needs"
                  ></textarea>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingContact}>
                  {isSubmittingContact ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/Request a quote.png?height=600&width=800"
                alt="MapleXpress customer support"
                width={800}
                height={600}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Have questions or need assistance? Our customer service team is here to help.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex h-full flex-col">
                  <div className="mb-5 flex flex-col items-center text-center">
                    <div className="mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Our Location</h3>
                  </div>
                  {locationLines.length ? (
                    <div className="mx-auto w-fit max-w-full space-y-3 text-left text-muted-foreground">
                      <p className="leading-6">
                        {locationLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                      {location?.mapUrl ? (
                        <a href={location.mapUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-primary hover:underline">
                          Open map
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {isLoading ? "Loading location details..." : "Location details are not configured yet."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex h-full flex-col">
                  <div className="mb-5 flex flex-col items-center text-center">
                    <div className="mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Phone</h3>
                  </div>
                  {phoneEntries.length ? (
                    <div className="mx-auto w-fit max-w-full space-y-3 text-left text-muted-foreground">
                      {phoneEntries.map((phone) => (
                        <p key={phone.type} className="leading-6">
                          <span className="block font-medium text-foreground">{phone.displayName || phone.type}</span>
                          <a href={`tel:${phone.value}`} className="hover:text-primary hover:underline">
                            {phone.value}
                          </a>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {isLoading ? "Loading phone details..." : "Phone details are not configured yet."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex h-full flex-col">
                  <div className="mb-5 flex flex-col items-center text-center">
                    <div className="mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Email</h3>
                  </div>
                  {emailEntries.length ? (
                    <div className="mx-auto w-fit max-w-full space-y-3 text-left text-muted-foreground">
                      {emailEntries.map((email) => (
                        <p key={email.type} className="leading-6">
                          <span className="block font-medium text-foreground">{email.displayName || email.type}</span>
                          <a href={`mailto:${email.value}`} className="break-all hover:text-primary hover:underline">
                            {email.value}
                          </a>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {isLoading ? "Loading email details..." : "Email details are not configured yet."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container">
          <div className="text-center max-w-[800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Local Delivery Made Simple</h2>
            <p className="text-primary-foreground/80 mb-8">
              Whether you&apos;re sending one package or dozens every week, MapleXpress makes local delivery simple.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/ship-now">Ship Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
