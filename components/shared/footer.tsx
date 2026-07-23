"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LegalDocumentLink } from "@/components/platform/legal-document-link"
import { usePlatformConfiguration } from "@/components/platform/platform-configuration-provider"
import type { PublicSocialMediaPlatform } from "@/types/platform-configuration"

const SOCIAL_ICONS: Record<PublicSocialMediaPlatform, LucideIcon> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  X: Twitter,
  YOUTUBE: Youtube,
  TIKTOK: Music2,
  WHATSAPP: MessageCircle,
  INDEED: BriefcaseBusiness,
}

export function Footer() {
  const { config } = usePlatformConfiguration()
  const socialProfiles = [...(config?.socialMediaProfiles || [])]
    .filter((profile) => profile.profileUrl)
    .sort((left, right) => Number(left.displayOrder || 0) - Number(right.displayOrder || 0))
  const indeedProfile = socialProfiles.find((profile) => profile.platform === "INDEED")

  return (
    <footer className="bg-gradient-to-r from-primary/5 to-secondary/5 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/leaf.svg" alt="MapleXpress leaf" className="h-9 w-9" />
              <span className="text-xl font-bold">MapleXpress</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Your trusted partner for all your courier and logistics needs since 2024.
            </p>
            {socialProfiles.length ? (
              <div className="flex flex-wrap gap-4">
                {socialProfiles.map((profile) => {
                  const Icon = SOCIAL_ICONS[profile.platform] || MessageCircle
                  return (
                    <a
                      key={profile.platform}
                      href={profile.profileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{profile.displayName || profile.platform}</span>
                    </a>
                  )
                })}
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              {indeedProfile?.profileUrl ? (
                <li>
                  <a href={indeedProfile.profileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    Careers
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/track" className="text-muted-foreground hover:text-primary">
                  Track Package
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-muted-foreground hover:text-primary">
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
            <p className="text-muted-foreground mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
            <div className="flex flex-col gap-2">
              <Input placeholder="Your email address" />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              By subscribing, you agree to our{" "}
              <LegalDocumentLink documentType="PRIVACY_POLICY" className="font-normal text-muted-foreground underline underline-offset-2 hover:text-primary">
                Privacy Policy
              </LegalDocumentLink>
              .
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MapleXpress Courier Services. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <LegalDocumentLink documentType="PRIVACY_POLICY" className="font-normal text-muted-foreground hover:underline">
              Privacy Policy
            </LegalDocumentLink>
            <LegalDocumentLink documentType="TERMS_AND_CONDITIONS" className="font-normal text-muted-foreground hover:underline">
              Terms of Service
            </LegalDocumentLink>
            <LegalDocumentLink documentType="COOKIE_POLICY" className="font-normal text-muted-foreground hover:underline">
              Cookie Policy
            </LegalDocumentLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

