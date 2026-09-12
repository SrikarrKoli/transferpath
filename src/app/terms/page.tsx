import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { LandingFooter } from "@/components/landing/landing-footer"
import { PRODUCT_NAME } from "@/lib/brand"

export const metadata = {
  title: "Terms of Use",
}

export default function TermsPage() {
  return (
    <div className="hall-app min-h-screen bg-[color:var(--hall-paper)]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-3xl font-semibold italic text-[color:var(--hall-ink)]">Terms of Use</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: May 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            {PRODUCT_NAME} is a planning tool only. Deadlines, course requirements, GPA targets, and
            checklist items are for organization and do not constitute official advice from any
            college or university.
          </p>
          <p>
            You are responsible for verifying all dates, fees, and admission requirements on your
            target institution&apos;s official website, registrar, and admissions office.
          </p>
          <p>
            By using this service you agree not to misuse the platform, attempt unauthorized access,
            or rely on the app as a substitute for professional counseling or institutional
            communications.
          </p>
          <p className="text-muted-foreground">
            The service is provided &quot;as is&quot; without warranties. We may update these terms as
            the product evolves.
          </p>
        </div>
        <Link href="/" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
      <LandingFooter />
    </div>
  )
}
