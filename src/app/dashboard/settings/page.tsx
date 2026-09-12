import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient, type SettingsProfileRow, type SettingsAuthInfo } from "@/components/dashboard/settings-client"
import { settingsProfileRemountKey } from "@/lib/settings-profile-remount-key"
import { parseSettingsTab } from "@/lib/settings-tab"
import { ImmersiveBuildingShell } from "@/components/campus-ui/immersive-building-shell"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab = parseSettingsTab(tab)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      `
    *,
    current_university:current_university_id(id, name),
    target_university:target_university_id(id, name)
  `
    )
    .eq("id", user.id)
    .single()

  const identities = user.identities ?? []
  const hasEmailPassword = identities.some((i) => i.provider === "email")
  const oauthProviderIds = identities
    .filter((i) => i.provider !== "email")
    .map((i) => i.provider)

  const authInfo: SettingsAuthInfo = {
    hasEmailPassword,
    oauthProviderIds,
  }

  const row: SettingsProfileRow | null = profile
    ? {
        id: profile.id as string,
        email: profile.email as string,
        full_name: profile.full_name,
        current_university_id: profile.current_university_id,
        target_university_id: profile.target_university_id,
        target_major: profile.target_major,
        field_of_study: profile.field_of_study ?? null,
        expected_transfer_term: profile.expected_transfer_term,
        gpa: profile.gpa,
        credits_completed: profile.credits_completed,
        notify_deadline_reminders:
          (profile as { notify_deadline_reminders?: boolean }).notify_deadline_reminders ?? true,
        notify_product_updates:
          (profile as { notify_product_updates?: boolean }).notify_product_updates ?? false,
        prefer_compact_dashboard:
          (profile as { prefer_compact_dashboard?: boolean }).prefer_compact_dashboard ?? false,
        current_university:
          (profile.current_university as { id: string; name: string } | null) ?? null,
        target_university:
          (profile.target_university as { id: string; name: string } | null) ?? null,
      }
    : null

  return (
    <ImmersiveBuildingShell buildingId="counselor" purpose="settings">
      <SettingsClient
        key={settingsProfileRemountKey(row)}
        authEmail={user.email ?? null}
        profile={row}
        authInfo={authInfo}
        initialTab={initialTab}
      />
    </ImmersiveBuildingShell>
  )
}
