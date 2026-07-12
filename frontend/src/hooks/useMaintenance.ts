import { useCallback, useState } from "react"

import { api } from "@/lib/api"
import { Vehicle } from "@/types/fleet"
import { MaintenanceCreate, MaintenanceRecord, MaintenanceUpdate } from "@/types/maintenance"

function extractError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } }
    return axiosErr.response?.data?.detail ?? fallback
  }
  return fallback
}

export function useMaintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMaintenance = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [maintenanceRes, vehiclesRes] = await Promise.all([
        api.get<MaintenanceRecord[]>("/api/maintenance"),
        api.get<Vehicle[]>("/api/vehicles"),
      ])
      setRecords(maintenanceRes.data)
      setVehicles(vehiclesRes.data)
    } catch (err: unknown) {
      setError(extractError(err, "Failed to load maintenance data"))
    } finally {
      setLoading(false)
    }
  }, [])

  const createMaintenance = useCallback(async (
    data: MaintenanceCreate
  ): Promise<{ success: boolean; record?: MaintenanceRecord; error?: string }> => {
    try {
      const res = await api.post<MaintenanceRecord>("/api/maintenance", data)
      setRecords((prev) => [res.data, ...prev])
      return { success: true, record: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to create maintenance record") }
    }
  }, [])

  const completeMaintenance = useCallback(async (
    id: number,
    data: MaintenanceUpdate
  ): Promise<{ success: boolean; record?: MaintenanceRecord; error?: string }> => {
    try {
      const res = await api.put<MaintenanceRecord>(`/api/maintenance/${id}`, data)
      setRecords((prev) => prev.map((record) => (record.id === id ? res.data : record)))
      return { success: true, record: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to update maintenance record") }
    }
  }, [])

  return {
    records,
    vehicles,
    loading,
    error,
    fetchMaintenance,
    createMaintenance,
    completeMaintenance,
  }
}
