import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle, HelpCircle, MessageCircle } from "lucide-react"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getPublicFaqs } from "@/lib/public-platform-configuration-service"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | MapleXpress",
  description: "Answers to common questions about MapleXpress local pickup and delivery services.",
}

export default async function FrequentlyAskedQuestionsPage() {
  const { data: faqs, error } = await getPublicFaqs()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-wine-soft via-background to-brand-maple-soft" />
          <div className="container text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <HelpCircle className="h-7 w-7" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Helpful Information</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Frequently Asked Questions</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Quick answers about service coverage, booking, pricing, tracking, and business deliveries.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="container">
            <Card className="mx-auto max-w-4xl overflow-hidden rounded-3xl border-border/80 shadow-lg">
              <CardContent className="p-6 md:p-8">
                {error ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold">FAQs are temporarily unavailable</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      We could not load the latest answers right now. Please try again shortly or contact our team below.
                    </p>
                  </div>
                ) : faqs?.length ? (
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq) => (
                      <AccordionItem key={faq.faqId} value={faq.faqId} className="last:border-b-0">
                        <AccordionTrigger className="text-left text-base font-semibold hover:no-underline md:text-lg">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="whitespace-pre-line pr-8 text-base leading-7 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="py-10 text-center">
                    <h2 className="text-lg font-semibold">No FAQs have been published yet</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Our team can still help with any questions you have.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center justify-between gap-4 rounded-2xl border bg-brand-forest-soft/60 px-6 py-5 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-forest text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Still have a question?</p>
                  <p className="text-sm text-muted-foreground">Send our team a message and we will help.</p>
                </div>
              </div>
              <Button asChild>
                <Link href="/#get-in-touch">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
