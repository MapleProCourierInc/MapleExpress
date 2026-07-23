"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Truck,
  Package,
  Clock,
  Globe,
  Shield,
  MapPin,
  Phone,
  Mail,
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
      return <LandingContent onOpenSignup={() => setIsSignupModalOpen(true)} />
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
        return <LandingContent onOpenSignup={() => setIsSignupModalOpen(true)} />
      default:
        return <LandingContent onOpenSignup={() => setIsSignupModalOpen(true)} />
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <img
                src="/3.svg"
                alt="MapleXpress Logo"
                className="h-[175px] w-auto"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
            <Link href="/ship-now" className="text-sm font-medium hover:text-primary">
              Ship Now
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-primary">
              Services
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
{/*            <Button
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              asChild
            >
              <Link href="#quote">Get a Quote</Link>
            </Button>*/}
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
function LandingContent({ onOpenSignup }: { onOpenSignup: () => void }) {
  const [trackingInput, setTrackingInput] = useState("")
  const router = useRouter()
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

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Fast, Reliable Delivery <span className="text-primary">When You Need It</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[800px] mb-8">
            Your trusted partner for all your courier and logistics needs. We deliver packages with care, speed, and
            reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              asChild
            >
              <Link href="#quote">Get a Quote</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10"
              asChild
            >
              <Link href="/ship-now">Ship Now</Link>
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
              We offer a comprehensive range of courier and logistics services to meet all your delivery needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Express Delivery</h3>
                  <p className="text-muted-foreground">
                    Same-day and next-day delivery options for urgent packages and documents.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Freight Services</h3>
                  <p className="text-muted-foreground">
                    Reliable transportation for larger shipments and palletized goods.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Secure Handling</h3>
                  <p className="text-muted-foreground">
                    Special care for valuable, fragile, or sensitive items with insurance options.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-[800px] mx-auto">
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Scheduled Deliveries</h3>
                  <p className="text-muted-foreground">
                    Regular pickup and delivery schedules for businesses with recurring needs.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="home-surface-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 mb-4">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Last Mile Delivery</h3>
                  <p className="text-muted-foreground">
                    Efficient final-stage delivery to ensure packages reach their destination on time.
                  </p>
                </div>
              </CardContent>
            </Card>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose MapleXpress?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Timely Delivery</h3>
                    <p className="text-muted-foreground">
                      We understand the importance of time in logistics. Our commitment to punctuality ensures your
                      packages arrive when promised.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Secure Handling</h3>
                    <p className="text-muted-foreground">
                      Your packages are treated with the utmost care. We implement strict security measures to ensure
                      safe delivery.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Global Network</h3>
                    <p className="text-muted-foreground">
                      With partners worldwide, we can deliver your packages to virtually any destination with efficiency
                      and reliability.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Customized Solutions</h3>
                    <p className="text-muted-foreground">
                      We tailor our services to meet your specific requirements, whether you're an individual or a large
                      corporation.
                    </p>
                  </div>
                </div>
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

      {/* Quote Request Section */}
      <section id="quote" className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Request a Quote</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form to get a customized quote for your shipping needs. Our team will get back to you
                within 24 hours.
              </p>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input id="phone" placeholder="Enter your phone number" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="service" className="text-sm font-medium">
                    Service Type
                  </label>
                  <select
                    id="service"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a service</option>
                    <option value="express">Express Delivery</option>
                    <option value="freight">Freight Services</option>
                    <option value="international">International Shipping</option>
                    <option value="secure">Secure Handling</option>
                    <option value="scheduled">Scheduled Deliveries</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Additional Information
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us more about your shipping needs"
                  ></textarea>
                </div>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </form>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/Request a quote.png?height=600&width=800"
                alt="Customer service representative"
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Ship with Confidence?</h2>
            <p className="text-primary-foreground/80 mb-8">
              Join thousands of satisfied customers who trust MapleXpress for their shipping needs. Experience the
              difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={onOpenSignup}>
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="#quote">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
