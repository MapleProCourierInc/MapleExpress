import { FileQuestion } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function Quotes() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review custom shipping quotes and respond when they are ready.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
            <FileQuestion className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">Custom quotes are coming soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your custom quote requests will appear here. Once a quote is prepared, you will be able to review its
            details and accept or decline it from this section.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
