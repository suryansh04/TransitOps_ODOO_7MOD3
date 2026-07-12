import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { Vehicle } from "@/types/fleet"

export const useFleet = (filters: { type?: string, status?: string }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type && filters.type !== "All") params.append("type", filters.type)
      if (filters.status && filters.status !== "All") params.append("status", filters.status)
      
      const response = await api.get(`/api/vehicles?${params.toString()}`)
      setVehicles(response.data)
      setError(null)
    } catch (err: any) {
      console.error("Failed to fetch vehicles", err)
      setError(err.response?.data?.detail || "Failed to fetch vehicles")
    } finally {
      setLoading(false)
    }
  }, [filters.type, filters.status])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const addVehicle = async (data: Omit<Vehicle, "id" | "created_at" | "updated_at" | "status">) => {
    try {
      await api.post("/api/vehicles", data)
      fetchVehicles()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || "Unknown error" }
    }
  }

  return { vehicles, loading, error, addVehicle, refetch: fetchVehicles }
}
