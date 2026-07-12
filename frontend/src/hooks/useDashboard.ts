import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { DashboardData } from "@/types/dashboard"

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async (filters?: { vehicle_type?: string, status?: string, region?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters?.vehicle_type && filters.vehicle_type !== 'All') params.append('vehicle_type', filters.vehicle_type)
      if (filters?.status && filters.status !== 'All') params.append('status', filters.status)
      if (filters?.region && filters.region !== 'All') params.append('region', filters.region)
      
      const response = await api.get<DashboardData>(`/api/dashboard?${params.toString()}`)
      setData(response.data)
    } catch (err: unknown) {
      let message = "Failed to load dashboard data"
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        message = axiosErr.response?.data?.detail ?? message
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchDashboard }
}
