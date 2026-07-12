import { useCallback, useState } from "react"

import { api } from "@/lib/api"
import { Vehicle } from "@/types/fleet"
import { AnalyticsResponse } from "@/types/analytics"
import { Expense, ExpenseCreate, FuelLog, FuelLogCreate } from "@/types/fuelExpenses"

function extractError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as {
      message?: string
      response?: {
        status?: number
        data?: {
          detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>
        } | string
      }
    }

    const status = axiosErr.response?.status
    const data = axiosErr.response?.data

    if (typeof data === "string") {
      return status ? `${status}: ${data}` : data
    }

    const detail = typeof data === "object" && data !== null ? data.detail : undefined
    if (typeof detail === "string") {
      return status ? `${status}: ${detail}` : detail
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      const loc = Array.isArray(first.loc) ? first.loc.join(".") : "payload"
      const msg = first.msg ?? fallback
      return status ? `${status}: ${loc} ${msg}` : `${loc} ${msg}`
    }

    if (axiosErr.message) {
      return status ? `${status}: ${axiosErr.message}` : axiosErr.message
    }
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return fallback
}

export function useFuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [operationalCost, setOperationalCost] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFuelExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fuelRes, expenseRes, vehicleRes, analyticsRes] = await Promise.allSettled([
        api.get<FuelLog[]>("/api/fuel-logs"),
        api.get<Expense[]>("/api/expenses"),
        api.get<Vehicle[]>("/api/vehicles"),
        api.get<AnalyticsResponse>("/api/analytics"),
      ])

      const failures: string[] = []

      if (fuelRes.status === "fulfilled") {
        setFuelLogs(fuelRes.value.data)
      } else {
        failures.push(`Fuel logs: ${extractError(fuelRes.reason, "Request failed")}`)
      }

      if (expenseRes.status === "fulfilled") {
        setExpenses(expenseRes.value.data)
      } else {
        failures.push(`Expenses: ${extractError(expenseRes.reason, "Request failed")}`)
      }

      if (vehicleRes.status === "fulfilled") {
        setVehicles(vehicleRes.value.data)
      } else {
        failures.push(`Vehicles: ${extractError(vehicleRes.reason, "Request failed")}`)
      }

      if (analyticsRes.status === "fulfilled") {
        setOperationalCost(analyticsRes.value.data.operational_cost)
      } else {
        failures.push(`Analytics: ${extractError(analyticsRes.reason, "Request failed")}`)
      }

      if (failures.length > 0) {
        setError(`Failed to load fuel and expenses. ${failures.join(" | ")}`)
      }
    } catch (err: unknown) {
      setError(extractError(err, "Failed to load fuel and expenses"))
    } finally {
      setLoading(false)
    }
  }, [])

  const createFuelLog = useCallback(async (
    payload: FuelLogCreate
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post<FuelLog>("/api/fuel-logs", payload)
      setFuelLogs((prev) => [res.data, ...prev])
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to add fuel log") }
    }
  }, [])

  const createExpense = useCallback(async (
    payload: ExpenseCreate
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post<Expense>("/api/expenses", payload)
      setExpenses((prev) => [res.data, ...prev])
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: extractError(err, "Failed to add expense") }
    }
  }, [])

  return {
    fuelLogs,
    expenses,
    vehicles,
    operationalCost,
    loading,
    error,
    fetchFuelExpenses,
    createFuelLog,
    createExpense,
  }
}
