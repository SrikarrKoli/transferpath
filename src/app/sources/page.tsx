import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { LandingFooter } from "@/components/landing/landing-footer"
import { SourcesClient } from "@/components/sources/sources-client"
import { buildSourcesData } from "@/lib/build-sources-data"
import { PRODUCT_NAME } from "@/lib/brand"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Sources",
  description: `Where ${PRODUCT_NAME} gets transfer deadline data, what we hold, and what we do not.`,
}

export default async function SourcesPage() {
  const supabase = await createClient()
  const data = await buildSourcesData(supabase)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl font-semibold text-foreground">Sources</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A public account of what {PRODUCT_NAME} knows, how it knows it, and how much of the
            picture is missing — stated as a number before anything else on the page.
          </p>
        </div>

        <div className="mt-10">
          <SourcesClient data={data} />
        </div>

        <Link
          href="/"
          className="mt-12 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Back to home
        </Link>
      </main>
      <LandingFooter />
    </div>
  )
}
