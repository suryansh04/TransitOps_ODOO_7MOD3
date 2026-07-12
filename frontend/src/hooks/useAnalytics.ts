import { useCallback, useState } from "react"

import { api } from "@/lib/api"
import { AnalyticsResponse } from "@/types/analytics"

interface AnalyticsQuery {
  from_date?: string
  to_date?: string
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (params?: AnalyticsQuery) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<AnalyticsResponse>("/api/analytics", {
        params,
      })
      setAnalytics(response.data)
      return response.data
    } catch (err: unknown) {
      let message = "Failed to load analytics"
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        message = axiosErr.response?.data?.detail ?? message
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { analytics, loading, error, fetchAnalytics }
}
