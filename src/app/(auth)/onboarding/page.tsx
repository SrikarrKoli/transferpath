import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"
import { OnboardingClient } from "./onboarding-client"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (profile) {
      redirect("/dashboard?from=onboarding")
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--campus-cream)] px-4 py-6 sm:px-8">
      <ImmersiveBuildingShell buildingId="counselor" purpose="onboarding">
        <OnboardingClient
          existingSession={user ? { id: user.id, email: user.email ?? "" } : null}
          embedded
        />
      </ImmersiveBuildingShell>
    </div>
  )
}
