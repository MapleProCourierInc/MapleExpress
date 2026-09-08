import { Footer } from "@/components/shared/footer"
import { Header } from "@/components/shared/header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FrequentlyAskedQuestionsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-20">
          <div className="container flex flex-col items-center">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="mt-6 h-4 w-44" />
            <Skeleton className="mt-4 h-12 w-full max-w-xl" />
            <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
          </div>
        </section>
        <section className="pb-20">
          <div className="container">
            <Card className="mx-auto max-w-4xl rounded-3xl">
              <CardContent className="space-y-5 p-6 md:p-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
