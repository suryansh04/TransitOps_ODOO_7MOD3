import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { Trip, TripCreate, TripDispatch, TripComplete } from "@/types/trips"
import { Vehicle } from "@/types/fleet"
import { Driver } from "@/types/fleet"

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<Trip[]>("/api/trips")
      setTrips(res.data)
    } catch (err: unknown) {
      setError(extractError(err, "Failed to load trips"))
    } finally {
      setLoading(false)
    }
  }, [])

  const createTrip = useCallback(async (data: TripCreate): Promise<{ success: boolean; trip?: Trip; error?: string }> => {
    try {
      const res = await api.post<Trip>("/api/trips", data)
      setTrips((prev) => [...prev, res.data])
      return { success: true, trip: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to create trip") }
    }
  }, [])

  const dispatchTrip = useCallback(async (id: number, data: TripDispatch): Promise<{ success: boolean; trip?: Trip; error?: string }> => {
    try {
      const res = await api.post<Trip>(`/api/trips/${id}/dispatch`, data)
      setTrips((prev) => prev.map((t) => (t.id === id ? res.data : t)))
      return { success: true, trip: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to dispatch trip") }
    }
  }, [])

  const completeTrip = useCallback(async (id: number, data: TripComplete): Promise<{ success: boolean; trip?: Trip; error?: string }> => {
    try {
      const res = await api.post<Trip>(`/api/trips/${id}/complete`, data)
      setTrips((prev) => prev.map((t) => (t.id === id ? res.data : t)))
      return { success: true, trip: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to complete trip") }
    }
  }, [])

  const cancelTrip = useCallback(async (id: number): Promise<{ success: boolean; trip?: Trip; error?: string }> => {
    try {
      const res = await api.post<Trip>(`/api/trips/${id}/cancel`)
      setTrips((prev) => prev.map((t) => (t.id === id ? res.data : t)))
      return { success: true, trip: res.data }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to cancel trip") }
    }
  }, [])

  return { trips, loading, error, fetchTrips, createTrip, dispatchTrip, completeTrip, cancelTrip }
}

export function useAvailableVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAvailableVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<Vehicle[]>("/api/vehicles", { params: { status: "available" } })
      setVehicles(res.data)
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { vehicles, loading, fetchAvailableVehicles }
}

export function useAvailableDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAvailableDrivers = useCallback(async () => {
    setLoading(true)
    try {
      // Uses the trips-scoped endpoint so Dispatchers (who have 'none' on the drivers module)
      // can still populate the driver dropdown. Returns minimal driver info only.
      const res = await api.get<Driver[]>("/api/trips/available-drivers")
      setDrivers(res.data)
    } catch {
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { drivers, loading, fetchAvailableDrivers }
}

function extractError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } }
    return axiosErr.response?.data?.detail ?? fallback
  }
  return fallback
}
