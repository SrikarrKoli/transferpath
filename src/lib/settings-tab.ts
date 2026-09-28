export const SETTINGS_TABS = [
  "profile",
  "transfer",
  "notifications",
  "security",
  "preferences",
  "help",
] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]

export function isSettingsTab(value: string | undefined): value is SettingsTab {
  return value != null && (SETTINGS_TABS as readonly string[]).includes(value)
}

export function parseSettingsTab(value: string | undefined): SettingsTab {
  return value === "path" || value === "profile" ? "transfer" : isSettingsTab(value) ? value : "transfer"
}

export function settingsPath(tab?: SettingsTab, hash?: string): string {
  const fragment = hash ? `#${hash}` : ""
  if (tab && tab !== "transfer") return `/dashboard/settings?tab=${tab}${fragment}`
  if (fragment) return `/dashboard/settings${fragment}`
  return "/dashboard/settings"
}
