"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Package,
  Truck,
  Clock,
  MapPin,
  ChevronRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock4,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  Settings,
  LogOut,
  Home,
  Inbox,
  FileText,
  CreditCard,
  HelpCircle,
} from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddressManagement } from "@/components/dashboard/address-management"
import { UserSettings } from "@/components/dashboard/user-settings"

// Mock data for shipments
const recentShipments = [
  {
    id: "1001",
    trackingNumber: "MX1001234",
    status: "in-transit",
    statusText: "In Transit",
    origin: "Toronto, ON",
    destination: "Vancouver, BC",
    estimatedDelivery: "2025-03-28",
    service: "Express",
    progress: 65,
  },
  {
    id: "1002",
    trackingNumber: "MX1001235",
    status: "pending",
    statusText: "Pending Pickup",
    origin: "Montreal, QC",
    destination: "Calgary, AB",
    estimatedDelivery: "2025-03-30",
    service: "Standard",
    progress: 15,
  },
  {
    id: "1003",
    trackingNumber: "MX1001236",
    status: "delivered",
    statusText: "Delivered",
    origin: "Halifax, NS",
    destination: "Ottawa, ON",
    estimatedDelivery: "2025-03-25",
    service: "Express",
    progress: 100,
    deliveredDate: "2025-03-25",
  },
]

// Mock data for analytics
const analyticsData = {
  totalShipments: 15,
  activeShipments: 3,
  deliveredShipments: 12,
  pendingShipments: 2,
  totalSpent: 1245.75,
  monthlyChange: 12.5,
}

// Define the possible sections
type SectionType = "dashboard" | "shipments" | "quotes" | "addresses" | "messages" | "billing" | "help" | "settings"

export default function Dashboard() {
  const { user, isLoading, individualProfile, organizationProfile, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState<SectionType>("dashboard")

  // Redirect if not authenticated or handle incomplete profile
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/")
      } else if (user.userStatus === "pendingEmailVerification") {
        // Redirect to home page where verification UI will be shown
        router.push("/")
      } else if (user.userStatus === "pendingProfileCompletion") {
        // Redirect to home page where profile completion UI will be shown
        router.push("/")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  // Determine display name based on profile data
  let displayName = ""
  let userTypeDisplay = ""

  if (individualProfile) {
    displayName = `${individualProfile.firstName} ${individualProfile.lastName}`
    userTypeDisplay = "Individual"
  } else if (organizationProfile) {
    displayName = organizationProfile.name
    userTypeDisplay = "Business"
  } else {
    // Fallback to user ID if no profile is available
    displayName = `User ${user.userId.split("_")[1]}`
    userTypeDisplay = user.userType === "individualUser" ? "Individual" : "Business"
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Filter shipments based on search query
  const filteredShipments = recentShipments.filter(
    (shipment) =>
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in-transit":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in-transit":
        return <Clock4 className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Render the main content based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboardContent()
      case "addresses":
        return (
          <AddressManagement userId={user.userId} userType={user.userType} />
        )
      case "settings":
        return <UserSettings userId={user.userId} userType={user.userType} />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </div>
          </div>
        )
    }
  }

  // Render dashboard content
  const renderDashboardContent = () => {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {displayName.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your shipments today.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="rounded-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="shipments" className="rounded-md">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-md">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                      <p className="text-3xl font-bold mt-1">{analyticsData.totalShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                      <p className="text-3xl font-bold mt-1">{analyticsData.activeShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                      <p className="text-3xl font-bold mt-1">{analyticsData.deliveredShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-3xl font-bold mt-1">${analyticsData.totalSpent.toFixed(2)}</p>
                      <div className="flex items-center mt-1">
                        <span
                          className={`text-xs flex items-center ${analyticsData.monthlyChange > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {analyticsData.monthlyChange > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(analyticsData.monthlyChange)}% from last month
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-secondary/10">
                      <CreditCard className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Shipments */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Shipments</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection("shipments")}
                    className="flex items-center"
                  >
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Your most recent shipment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <div key={shipment.id} className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-full bg-muted">{getStatusIcon(shipment.status)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">#{shipment.trackingNumber}</h3>
                              <Badge className={getStatusColor(shipment.status)}>{shipment.statusText}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {shipment.origin} to {shipment.destination}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {shipment.status === "delivered"
                                  ? `Delivered on ${format(new Date(shipment.deliveredDate!), "MMM d, yyyy")}`
                                  : `Est. delivery: ${format(new Date(shipment.estimatedDelivery), "MMM d, yyyy")}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <div className="text-sm font-medium">{shipment.service}</div>
                          <div className="w-full md:w-32">
                            <Progress value={shipment.progress} className="h-2" />
                          </div>
                          <Button variant="outline" size="sm">
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="flex flex-col h-auto py-4 gap-2">
                    <Package className="h-5 w-5" />
                    <span>New Shipment</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-auto py-4 gap-2">
                    <FileText className="h-5 w-5" />
                    <span>Get Quote</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 gap-2"
                    onClick={() => setActiveSection("addresses")}
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Manage Addresses</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-auto py-4 gap-2">
                    <HelpCircle className="h-5 w-5" />
                    <span>Get Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>All Shipments</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search shipments..."
                      className="pl-8 w-full md:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment) => (
                      <div key={shipment.id} className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-muted">{getStatusIcon(shipment.status)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">#{shipment.trackingNumber}</h3>
                                <Badge className={getStatusColor(shipment.status)}>{shipment.statusText}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {shipment.origin} to {shipment.destination}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {shipment.status === "delivered"
                                    ? `Delivered on ${format(new Date(shipment.deliveredDate!), "MMM d, yyyy")}`
                                    : `Est. delivery: ${format(new Date(shipment.estimatedDelivery), "MMM d, yyyy")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <div className="text-sm font-medium">{shipment.service}</div>
                            <div className="w-full md:w-32">
                              <Progress value={shipment.progress} className="h-2" />
                            </div>
                            <Button variant="outline" size="sm">
                              Track
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No shipments found</h3>
                      <p className="text-muted-foreground mt-1">
                        {searchQuery
                          ? `No shipments match your search for "${searchQuery}"`
                          : "You don't have any shipments yet"}
                      </p>
                      {!searchQuery && <Button className="mt-4">Create New Shipment</Button>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Status</CardTitle>
                  <CardDescription>Distribution of your shipments by status</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-64">
                    <div className="w-full max-w-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Delivered</span>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.deliveredShipments}</span>
                      </div>
                      <Progress
                        value={(analyticsData.deliveredShipments / analyticsData.totalShipments) * 100}
                        className="h-2 mb-4"
                      />

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">In Transit</span>
                        </div>
                        <span className="text-sm font-medium">
                          {analyticsData.activeShipments - analyticsData.pendingShipments}
                        </span>
                      </div>
                      <Progress
                        value={
                          ((analyticsData.activeShipments - analyticsData.pendingShipments) /
                            analyticsData.totalShipments) *
                          100
                        }
                        className="h-2 mb-4"
                      />

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">Pending</span>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.pendingShipments}</span>
                      </div>
                      <Progress
                        value={(analyticsData.pendingShipments / analyticsData.totalShipments) * 100}
                        className="h-2 mb-4"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Activity</CardTitle>
                  <CardDescription>Your shipping activity over the past months</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-64">
                    <div className="w-full">
                      <div className="flex items-end justify-between h-40 gap-2">
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/20 w-12 rounded-t-md" style={{ height: "30%" }}></div>
                          <span className="text-xs mt-2">Jan</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/20 w-12 rounded-t-md" style={{ height: "45%" }}></div>
                          <span className="text-xs mt-2">Feb</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/20 w-12 rounded-t-md" style={{ height: "60%" }}></div>
                          <span className="text-xs mt-2">Mar</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-primary w-12 rounded-t-md" style={{ height: "80%" }}></div>
                          <span className="text-xs mt-2">Apr</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-primary/20 w-12 rounded-t-md" style={{ height: "50%" }}></div>
                          <span className="text-xs mt-2">May</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Trends</CardTitle>
                <CardDescription>Analysis of your shipping patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                    <div className="p-3 rounded-full bg-blue-100 mb-4">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium">Most Active Day</h3>
                    <p className="text-3xl font-bold mt-2">Tuesday</p>
                    <p className="text-sm text-muted-foreground mt-1">Based on your shipping history</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                    <div className="p-3 rounded-full bg-green-100 mb-4">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">Top Destination</h3>
                    <p className="text-3xl font-bold mt-2">Vancouver</p>
                    <p className="text-sm text-muted-foreground mt-1">35% of your shipments</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                    <div className="p-3 rounded-full bg-amber-100 mb-4">
                      <Calendar className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium">Avg. Delivery Time</h3>
                    <p className="text-3xl font-bold mt-2">2.3 days</p>
                    <p className="text-sm text-muted-foreground mt-1">For express shipments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar and Header */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col bg-white border-r">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">MapleXpress</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-2">
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "dashboard" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("dashboard")}
              >
                <Home className={`h-5 w-5 ${activeSection === "dashboard" ? "text-primary" : ""}`} />
                Dashboard
              </div>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "shipments" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("shipments")}
              >
                <Package className="h-5 w-5" />
                Shipments
              </div>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "quotes" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("quotes")}
              >
                <FileText className="h-5 w-5" />
                Quotes
              </div>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "addresses" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("addresses")}
              >
                <MapPin className="h-5 w-5" />
                Addresses
              </div>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "messages" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("messages")}
              >
                <Inbox className="h-5 w-5" />
                Messages
                <Badge className="ml-auto bg-primary text-primary-foreground">3</Badge>
              </div>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "billing" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveSection("billing")}
              >
                <CreditCard className="h-5 w-5" />
                Billing
              </div>
            </nav>
            <div className="mt-6 px-3">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground">Support</h3>
              <nav className="mt-2 space-y-1">
                <div
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "help" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setActiveSection("help")}
                >
                  <HelpCircle className="h-5 w-5" />
                  Help Center
                </div>
                <div
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${activeSection === "settings" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setActiveSection("settings")}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </div>
              </nav>
            </div>
          </div>
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground">{userTypeDisplay}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveSection("settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b bg-white">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center md:hidden">
                <div onClick={() => setActiveSection("dashboard")} className="cursor-pointer">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-4 md:ml-auto">
                <div className="relative hidden md:block">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-64 pl-8 bg-muted/50 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    3
                  </span>
                </Button>
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setActiveSection("dashboard")} className="cursor-pointer">
                        <Home className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveSection("shipments")} className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Shipments</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveSection("addresses")} className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Addresses</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveSection("settings")} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">{renderMainContent()}</main>
        </div>
      </div>
    </div>
  )
}

