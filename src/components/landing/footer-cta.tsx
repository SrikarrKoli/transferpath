"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CTA_GET_STARTED, PRODUCT_NAME } from "@/lib/brand"

export function FooterCta() {
  return (
    <section className="border-t-2 border-foreground py-14 md:py-20">
      <h2 className="max-w-3xl font-heading text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl">
        Start the plan for your next term.
      </h2>
      <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
        {`${PRODUCT_NAME} pulls deadlines from a shared Texas university database. The score tells you what to do next — not whether you'll get in.`}
      </p>
      <Link
        href="/onboarding"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 inline-flex h-12 gap-2 rounded-none bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90"
        )}
      >
        {CTA_GET_STARTED}
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </section>
  )
}
