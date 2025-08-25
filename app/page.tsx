"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ColorPicker } from "@/components/color-picker"
import {
  Truck,
  Package,
  Clock,
  Globe,
  Shield,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { VerificationPending } from "@/components/verification-pending"
import { IndividualProfileForm } from "@/components/individual-profile-form"
import { OrganizationProfileForm } from "@/components/organization-profile-form"
import { UserProfile } from "@/components/user-profile"

export default function LandingPage() {
  const { user, isLoading } = useAuth()
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

  // Determine what to show based on user status or signup state
  const renderContent = () => {
    if (showVerification) {
      return (
        <div className="container py-20">
          <VerificationPending
            email={verificationEmail || "your email"}
            onClose={handleCloseVerification}
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
            />
          </div>
        )
      case "pendingProfileCompletion":
        return (
          <div className="container py-20">
            {user.userType === "individualUser" ? <IndividualProfileForm /> : <OrganizationProfileForm />}
          </div>
        )
      case "active":
        return <LandingContent />
      default:
        return <LandingContent />
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
            <Link href="#about" className="text-sm font-medium hover:text-primary">
              About Us
            </Link>
{/*            <Link href="#testimonials" className="text-sm font-medium hover:text-primary">
              Testimonials
            </Link>*/}
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
            <ColorPicker />
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
      <footer className="bg-gradient-to-r from-primary/5 to-secondary/5 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">MapleXpress</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Your trusted partner for all your courier and logistics needs since 2024.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="text-muted-foreground hover:text-primary">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-muted-foreground hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="text-muted-foreground hover:text-primary">
                    Track Package
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground hover:text-primary">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Services</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    Express Delivery
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    Freight Services
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    International Shipping
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    Secure Handling
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary">
                    Scheduled Deliveries
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Newsletter</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to our newsletter for the latest updates and offers.
              </p>
              <div className="flex flex-col gap-2">
                <Input placeholder="Your email address" />
                <Button type="submit" className="w-full">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                By subscribing, you agree to our{" "}
                <Link href="#" className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MapleXpress Courier Services. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link href="#" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="#" className="hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Extract the landing content to a separate component
function LandingContent() {
  const [trackingInput, setTrackingInput] = useState("")
  const router = useRouter()
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
            <Card className="border-none shadow-md">
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
            <Card className="border-none shadow-md">
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
            <Card className="border-none shadow-md">
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
            <Card className="border-none shadow-md">
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
            <Card className="border-none shadow-md">
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

      {/* Why Choose Us Section */}
      <section id="about" className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/placeholder.svg?height=600&width=800"
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say about our services.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="italic text-muted-foreground">
                    "MapleXpress has been our go-to courier service for the past three years. Their reliability and
                    professionalism are unmatched. Highly recommended!"
                  </p>
                  <div className="mt-4">
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">E-commerce Business Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="italic text-muted-foreground">
                    "When we needed urgent international shipping for critical medical supplies, MapleXpress came
                    through with flying colors. Their team worked tirelessly to ensure timely delivery."
                  </p>
                  <div className="mt-4">
                    <p className="font-semibold">Dr. Michael Chen</p>
                    <p className="text-sm text-muted-foreground">Medical Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="italic text-muted-foreground">
                    "The customer service at MapleXpress is exceptional. They're always responsive and go above and
                    beyond to solve any issues. Their tracking system is also very user-friendly."
                  </p>
                  <div className="mt-4">
                    <p className="font-semibold">Emily Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Retail Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                src="/placeholder.svg?height=600&width=800"
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
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Location</h3>
                  <p className="text-muted-foreground">
                    123 Delivery Street
                    <br />
                    Toronto, ON M5V 2K7
                    <br />
                    Canada
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Phone</h3>
                  <p className="text-muted-foreground">
                    Customer Service: (123) 456-7890
                    <br />
                    Shipping Support: (123) 456-7891
                    <br />
                    Toll-Free: 1-800-MAPLE-XP
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Email</h3>
                  <p className="text-muted-foreground">
                    Customer Service: info@maplexpress.com
                    <br />
                    Shipping Inquiries: shipping@maplexpress.com
                    <br />
                    Business Partnerships: partners@maplexpress.com
                  </p>
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
              <Button size="lg" variant="secondary" asChild>
                <Link href="#quote">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

