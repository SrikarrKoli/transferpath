"use client"

import Link from "next/link"
import { PRODUCT_NAME } from "@/lib/brand"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {PRODUCT_NAME}.
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <Link href="#plan" className="text-sm text-muted-foreground hover:text-foreground">
            The plan
          </Link>
          <Link href="#deadlines" className="text-sm text-muted-foreground hover:text-foreground">
            Deadlines
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="border border-foreground bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Get started
          </Link>
        </div>
        <Link
          href="/onboarding"
          className="border border-foreground bg-foreground px-3 py-1.5 text-sm font-medium text-background md:hidden"
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}
