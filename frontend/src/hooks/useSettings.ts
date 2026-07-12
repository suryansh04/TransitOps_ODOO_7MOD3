import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { OrgSettings, OrgSettingsUpdate } from "@/types/settings"

export function useSettings() {
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<OrgSettings>("/api/settings")
      setSettings(response.data)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load settings"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (data: OrgSettingsUpdate): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      const response = await api.put<OrgSettings>("/api/settings", data)
      setSettings(response.data)
      return { success: true }
    } catch (err: unknown) {
      let message = "Failed to save settings"
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        message = axiosErr.response?.data?.detail ?? message
      }
      setError(message)
      return { success: false, error: message }
    } finally {
      setSaving(false)
    }
  }, [])

  return { settings, loading, saving, error, fetchSettings, updateSettings }
}
