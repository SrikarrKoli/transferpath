import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { LandingFooter } from "@/components/landing/landing-footer"
import { PRODUCT_NAME } from "@/lib/brand"

export const metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="hall-app min-h-screen bg-[color:var(--hall-paper)]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-3xl font-semibold italic text-[color:var(--hall-ink)]">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: May 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            {PRODUCT_NAME} helps you plan a community-college-to-university transfer. We store
            account information you provide (name, email, schools, courses, essays, and checklist
            progress) to power your dashboard.
          </p>
          <p>
            We use Supabase for authentication and data storage. We do not sell your personal
            information. Email notifications are sent only if you opt in under Notification
            settings.
          </p>
          <p>
            You can update or delete much of your data from Settings and by contacting support if
            configured. For questions, use the contact option on our help page after sign-in.
          </p>
          <p className="text-muted-foreground">
            This is a simplified policy for an early product version. Consult official sources at
            your target institutions for admissions privacy practices.
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
