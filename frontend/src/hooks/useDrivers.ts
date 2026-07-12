import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { Driver } from "@/types/fleet"
export interface DriverCreate {
    name: string
    license_number: string
    license_category: string
    license_expiry_date: string
    contact_number: string
}
export interface DriverStatusUpdate {
    status: "available" | "off_duty" | "suspended"
}
function extractError(err: unknown, fallback: string): string {
    if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        return axiosErr.response?.data?.detail ?? fallback
    }
    return fallback
}
export function useDrivers() {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchDrivers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get<Driver[]>("/api/drivers")
            setDrivers(res.data)
        } catch (err: unknown) {
            setError(extractError(err, "Failed to load drivers"))
        } finally {
            setLoading(false)
        }
    }, [])
    const addDriver = useCallback(async (
        data: DriverCreate
    ): Promise<{ success: boolean; driver?: Driver; error?: string }> => {
        try {
            const res = await api.post<Driver>("/api/drivers", data)
            setDrivers((prev) => [...prev, res.data])
            return { success: true, driver: res.data }
        } catch (err: unknown) {
            return { success: false, error: extractError(err, "Failed to add driver") }
        }
    }, [])
    const updateDriverStatus = useCallback(async (
        id: number,
        status: DriverStatusUpdate["status"]
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await api.put<Driver>(`/api/drivers/${id}`, { status })
            setDrivers((prev) => prev.map((d) => (d.id === id ? res.data : d)))
            return { success: true }
        } catch (err: unknown) {
            return { success: false, error: extractError(err, "Failed to update status") }
        }
    }, [])
    return { drivers, loading, error, fetchDrivers, addDriver, updateDriverStatus }
}

