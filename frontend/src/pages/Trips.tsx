import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useTrips, useAvailableVehicles, useAvailableDrivers } from "@/hooks/useTrips"
import { Trip, TripComplete } from "@/types/trips"
import { Vehicle } from "@/types/fleet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MapPin,
} from "lucide-react"

// ── Stepper ──────────────────────────────────────────────────────────────────
const LIFECYCLE_STEPS = ["Draft", "Dispatched", "Completed", "Cancelled"] as const

function TripLifecycleStepper({ activeStatus }: { activeStatus: string }) {
  const stepIndex = LIFECYCLE_STEPS.findIndex(
    (s) => s.toLowerCase() === activeStatus
  )

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">
        Trip Lifecycle
      </p>
      <div className="flex items-center gap-0">
        {LIFECYCLE_STEPS.map((step, i) => {
          const isDone = i < stepIndex
          const isActive = i === stepIndex
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground/30 text-muted-foreground",
                  ].join(" ")}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={[
                    "text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step}
                </span>
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-0.5 mb-4 mx-1",
                    i < stepIndex ? "bg-primary" : "bg-muted",
                  ].join(" ")}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function TripStatusBadge({ status }: { status: Trip["status"] }) {
  const map: Record<Trip["status"], { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground border border-border" },
    dispatched: { label: "Dispatched", className: "bg-blue-100 text-blue-700 border border-blue-200" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 border border-green-200" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border border-red-200" },
  }
  const { label, className } = map[status] ?? map.draft
  return (
    <Badge className={`text-xs font-semibold ${className}`} variant="outline">
      {label}
    </Badge>
  )
}

// ── Complete Trip Dialog ───────────────────────────────────────────────────────
interface CompleteTripDialogProps {
  trip: Trip | null
  open: boolean
  onClose: () => void
  onConfirm: (data: TripComplete) => Promise<void>
  submitting: boolean
}

function CompleteTripDialog({ trip, open, onClose, onConfirm, submitting }: CompleteTripDialogProps) {
  const [finalOdometer, setFinalOdometer] = useState("")
  const [actualDistance, setActualDistance] = useState("")
  const [fuelLiters, setFuelLiters] = useState("")
  const [fuelCost, setFuelCost] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setFinalOdometer("")
      setActualDistance("")
      setFuelLiters("")
      setFuelCost("")
      setErrors({})
    }
  }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!finalOdometer || isNaN(Number(finalOdometer)) || Number(finalOdometer) < 0)
      e.finalOdometer = "Final odometer must be a positive number"
    if (!actualDistance || isNaN(Number(actualDistance)) || Number(actualDistance) <= 0)
      e.actualDistance = "Actual distance must be greater than 0"
    if (!fuelLiters || isNaN(Number(fuelLiters)) || Number(fuelLiters) <= 0)
      e.fuelLiters = "Fuel consumed must be greater than 0"
    if (!fuelCost || isNaN(Number(fuelCost)) || Number(fuelCost) < 0)
      e.fuelCost = "Fuel cost must be 0 or greater"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    await onConfirm({
      final_odometer_km: Number(finalOdometer),
      actual_distance_km: Number(actualDistance),
      fuel_consumed_liters: Number(fuelLiters),
      fuel_cost: Number(fuelCost),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Trip — {trip?.trip_code}</DialogTitle>
          <DialogDescription>
            Enter the completion data. This will update the vehicle odometer and create a fuel log automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="final-odometer" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Final Odometer (km)
            </Label>
            <Input
              id="final-odometer"
              type="number"
              min="0"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              placeholder="e.g. 74078"
              disabled={submitting}
            />
            {errors.finalOdometer && <p className="text-sm text-destructive">{errors.finalOdometer}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actual-distance" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Actual Distance (km)
            </Label>
            <Input
              id="actual-distance"
              type="number"
              min="0.01"
              step="0.01"
              value={actualDistance}
              onChange={(e) => setActualDistance(e.target.value)}
              placeholder="e.g. 78"
              disabled={submitting}
            />
            {errors.actualDistance && <p className="text-sm text-destructive">{errors.actualDistance}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuel-liters" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Fuel Consumed (liters)
            </Label>
            <Input
              id="fuel-liters"
              type="number"
              min="0.01"
              step="0.01"
              value={fuelLiters}
              onChange={(e) => setFuelLiters(e.target.value)}
              placeholder="e.g. 9.3"
              disabled={submitting}
            />
            {errors.fuelLiters && <p className="text-sm text-destructive">{errors.fuelLiters}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuel-cost" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Fuel Cost (₹)
            </Label>
            <Input
              id="fuel-cost"
              type="number"
              min="0"
              step="0.01"
              value={fuelCost}
              onChange={(e) => setFuelCost(e.target.value)}
              placeholder="e.g. 850"
              disabled={submitting}
            />
            {errors.fuelCost && <p className="text-sm text-destructive">{errors.fuelCost}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Completing…</> : "Mark Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Dispatch ETA Dialog ───────────────────────────────────────────────────────
interface DispatchDialogProps {
  tripId: number | null
  open: boolean
  onClose: () => void
  onConfirm: (eta: string) => Promise<void>
  submitting: boolean
}

function DispatchEtaDialog({ tripId, open, onClose, onConfirm, submitting }: DispatchDialogProps) {
  const [eta, setEta] = useState("")
  const [etaError, setEtaError] = useState("")

  useEffect(() => {
    if (open) { setEta(""); setEtaError("") }
  }, [open])

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!eta) { setEtaError("ETA is required"); return }
    await onConfirm(new Date(eta).toISOString())
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Dispatch Trip #{tripId}</DialogTitle>
          <DialogDescription>Set the estimated time of arrival before dispatching.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="eta-datetime" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              ETA (Date &amp; Time)
            </Label>
            <Input
              id="eta-datetime"
              type="datetime-local"
              value={eta}
              onChange={(e) => { setEta(e.target.value); setEtaError("") }}
              disabled={submitting}
            />
            {etaError && <p className="text-sm text-destructive">{etaError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Dispatching…</> : "Dispatch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Live Board Card ───────────────────────────────────────────────────────────
interface LiveBoardCardProps {
  trip: Trip
  canWrite: boolean
  onDispatch: (trip: Trip) => void
  onComplete: (trip: Trip) => void
  onCancel: (trip: Trip) => void
  actionLoading: number | null
}

function getTripStatusNote(trip: Trip): string {
  if (trip.status === "draft") return "Awaiting dispatch"
  if (trip.status === "dispatched") {
    if (!trip.eta) return "En route"
    const diff = new Date(trip.eta).getTime() - Date.now()
    if (diff <= 0) return "Arriving soon"
    const mins = Math.round(diff / 60000)
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    const rem = mins % 60
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
  }
  if (trip.status === "completed") return "Delivered"
  if (trip.status === "cancelled") return "Cancelled"
  return ""
}

function LiveBoardCard({ trip, canWrite, onDispatch, onComplete, onCancel, actionLoading }: LiveBoardCardProps) {
  const isLoading = actionLoading === trip.id

  return (
    <Card className="w-full">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm tracking-wide">{trip.trip_code}</span>
              <TripStatusBadge status={trip.status} />
            </div>
            <p className="text-sm text-foreground truncate">
              {trip.source} → {trip.destination}
            </p>
            {canWrite && trip.status === "draft" && (
              <div className="flex gap-2 mt-3">
                <Button
                  id={`dispatch-btn-${trip.id}`}
                  size="sm"
                  onClick={() => onDispatch(trip)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Dispatch"}
                </Button>
              </div>
            )}
            {canWrite && trip.status === "dispatched" && (
              <div className="flex gap-2 mt-3">
                <Button
                  id={`complete-btn-${trip.id}`}
                  size="sm"
                  onClick={() => onComplete(trip)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Complete"}
                </Button>
                <Button
                  id={`cancel-btn-${trip.id}`}
                  size="sm"
                  variant="destructive"
                  onClick={() => onCancel(trip)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
                </Button>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-0.5">
              V:{trip.vehicle_id} / D:{trip.driver_id}
            </p>
            <p className="text-xs text-muted-foreground">{getTripStatusNote(trip)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const Trips: React.FC = () => {
  const { user } = useAuth()
  const canWrite = user?.permissions?.["trips"] === "full"

  const { trips, loading: tripsLoading, error: tripsError, fetchTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } = useTrips()
  const { vehicles, fetchAvailableVehicles } = useAvailableVehicles()
  const { drivers, fetchAvailableDrivers } = useAvailableDrivers()

  // Create trip form state
  const [source, setSource] = useState("")
  const [destination, setDestination] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [cargoWeight, setCargoWeight] = useState("")
  const [plannedDistance, setPlannedDistance] = useState("")
  const [revenueAmount, setRevenueAmount] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Action dialogs
  const [dispatchTarget, setDispatchTarget] = useState<Trip | null>(null)
  const [completeTarget, setCompleteTarget] = useState<Trip | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchTrips()
    if (canWrite) {
      fetchAvailableVehicles()
      fetchAvailableDrivers()
    }
  }, [fetchTrips, fetchAvailableVehicles, fetchAvailableDrivers, canWrite])

  // Capacity check
  const selectedVehicle: Vehicle | undefined = vehicles.find((v) => v.id === Number(vehicleId))
  const capacityExceeded =
    selectedVehicle && cargoWeight && Number(cargoWeight) > selectedVehicle.max_load_capacity_kg

  const validateCreate = (): boolean => {
    const e: Record<string, string> = {}
    if (!source.trim()) e.source = "Source is required"
    if (!destination.trim()) e.destination = "Destination is required"
    if (!vehicleId) e.vehicleId = "Vehicle is required"
    if (!driverId) e.driverId = "Driver is required"
    if (!cargoWeight || isNaN(Number(cargoWeight)) || Number(cargoWeight) <= 0)
      e.cargoWeight = "Cargo weight must be greater than 0"
    if (!plannedDistance || isNaN(Number(plannedDistance)) || Number(plannedDistance) <= 0)
      e.plannedDistance = "Planned distance must be greater than 0"
    if (!revenueAmount || isNaN(Number(revenueAmount)) || Number(revenueAmount) < 0)
      e.revenueAmount = "Revenue amount must be 0 or greater"
    if (capacityExceeded)
      e.cargoWeight = `Cargo weight exceeds vehicle capacity of ${selectedVehicle!.max_load_capacity_kg} kg`
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!validateCreate()) return

    setCreating(true)
    const result = await createTrip({
      source: source.trim(),
      destination: destination.trim(),
      vehicle_id: Number(vehicleId),
      driver_id: Number(driverId),
      cargo_weight_kg: Number(cargoWeight),
      planned_distance_km: Number(plannedDistance),
      revenue_amount: Number(revenueAmount),
    })
    setCreating(false)

    if (result.success) {
      setSource(""); setDestination(""); setVehicleId(""); setDriverId("")
      setCargoWeight(""); setPlannedDistance(""); setRevenueAmount("")
      setFormErrors({})
      setActionSuccess("Trip created successfully.")
      setTimeout(() => setActionSuccess(null), 3000)
    } else {
      setCreateError(result.error ?? "Failed to create trip")
    }
  }

  const handleDispatchConfirm = async (eta: string) => {
    if (!dispatchTarget) return
    setActionLoading(dispatchTarget.id)
    const result = await dispatchTrip(dispatchTarget.id, { eta })
    setActionLoading(null)
    setDispatchTarget(null)
    if (!result.success) setActionError(result.error ?? "Failed to dispatch")
    else { setActionSuccess("Trip dispatched."); setTimeout(() => setActionSuccess(null), 3000) }
    fetchAvailableVehicles(); fetchAvailableDrivers()
  }

  const handleCompleteConfirm = async (data: TripComplete) => {
    if (!completeTarget) return
    setActionLoading(completeTarget.id)
    const result = await completeTrip(completeTarget.id, data)
    setActionLoading(null)
    setCompleteTarget(null)
    if (!result.success) setActionError(result.error ?? "Failed to complete")
    else { setActionSuccess("Trip marked complete."); setTimeout(() => setActionSuccess(null), 3000) }
    fetchAvailableVehicles(); fetchAvailableDrivers()
  }

  const handleCancelTrip = async (trip: Trip) => {
    setActionError(null)
    setActionLoading(trip.id)
    const result = await cancelTrip(trip.id)
    setActionLoading(null)
    if (!result.success) setActionError(result.error ?? "Failed to cancel")
    else { setActionSuccess("Trip cancelled."); setTimeout(() => setActionSuccess(null), 3000) }
    fetchAvailableVehicles(); fetchAvailableDrivers()
  }

  const liveTrips = [...trips].sort((a, b) => {
    const order: Record<Trip["status"], number> = { dispatched: 0, draft: 1, completed: 2, cancelled: 3 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trip Dispatcher</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {canWrite
            ? "Create and manage trips. Dispatch, complete, or cancel trips from the Live Board."
            : "View-only access. Only Dispatchers can create or modify trips."}
        </p>
      </div>

      <Separator />

      {/* Global feedback banners */}
      {actionSuccess && (
        <Alert className="border-green-300 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{actionSuccess}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left: Create Trip form ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Create Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Lifecycle stepper — shows "draft" while form is idle */}
            <TripLifecycleStepper activeStatus="draft" />

            {!canWrite ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Only Dispatchers can create trips.</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleCreateTrip} className="space-y-4" noValidate>
                {/* Source */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-source" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Source
                  </Label>
                  <Input
                    id="trip-source"
                    placeholder="Gandhinagar Depot"
                    value={source}
                    onChange={(e) => { setSource(e.target.value); if (formErrors.source) setFormErrors(p => ({ ...p, source: "" })) }}
                    disabled={creating}
                  />
                  {formErrors.source && <p className="text-sm text-destructive">{formErrors.source}</p>}
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-destination" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Destination
                  </Label>
                  <Input
                    id="trip-destination"
                    placeholder="Ahmedabad Hub"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); if (formErrors.destination) setFormErrors(p => ({ ...p, destination: "" })) }}
                    disabled={creating}
                  />
                  {formErrors.destination && <p className="text-sm text-destructive">{formErrors.destination}</p>}
                </div>

                {/* Vehicle */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-vehicle" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Vehicle (Available Only)
                  </Label>
                  <Select
                    value={vehicleId}
                    onValueChange={(v) => { setVehicleId(v); if (formErrors.vehicleId) setFormErrors(p => ({ ...p, vehicleId: "" })) }}
                    disabled={creating}
                  >
                    <SelectTrigger id="trip-vehicle">
                      <SelectValue placeholder="Select vehicle…" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>No available vehicles</SelectItem>
                      ) : (
                        vehicles.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name_model} — {v.max_load_capacity_kg} kg capacity
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.vehicleId && <p className="text-sm text-destructive">{formErrors.vehicleId}</p>}
                </div>

                {/* Driver */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-driver" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Driver (Available Only)
                  </Label>
                  <Select
                    value={driverId}
                    onValueChange={(v) => { setDriverId(v); if (formErrors.driverId) setFormErrors(p => ({ ...p, driverId: "" })) }}
                    disabled={creating}
                  >
                    <SelectTrigger id="trip-driver">
                      <SelectValue placeholder="Select driver…" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <SelectItem value="none" disabled>No available drivers</SelectItem>
                      ) : (
                        drivers.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name} — {d.license_category}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.driverId && <p className="text-sm text-destructive">{formErrors.driverId}</p>}
                </div>

                {/* Cargo Weight */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-cargo" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Cargo Weight (kg)
                  </Label>
                  <Input
                    id="trip-cargo"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 450"
                    value={cargoWeight}
                    onChange={(e) => { setCargoWeight(e.target.value); if (formErrors.cargoWeight) setFormErrors(p => ({ ...p, cargoWeight: "" })) }}
                    disabled={creating}
                  />
                  {formErrors.cargoWeight && <p className="text-sm text-destructive">{formErrors.cargoWeight}</p>}
                </div>

                {/* Capacity exceeded alert */}
                {capacityExceeded && selectedVehicle && (
                  <Alert variant="destructive" className="py-3">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs leading-relaxed">
                      <span className="block">Vehicle Capacity: {selectedVehicle.max_load_capacity_kg} kg</span>
                      <span className="block">Cargo Weight: {cargoWeight} kg</span>
                      <span className="block font-semibold mt-0.5">
                        ✕ Capacity exceeded by {(Number(cargoWeight) - selectedVehicle.max_load_capacity_kg).toFixed(1)} kg — dispatch blocked
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Planned Distance */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-distance" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Planned Distance (km)
                  </Label>
                  <Input
                    id="trip-distance"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 78"
                    value={plannedDistance}
                    onChange={(e) => { setPlannedDistance(e.target.value); if (formErrors.plannedDistance) setFormErrors(p => ({ ...p, plannedDistance: "" })) }}
                    disabled={creating}
                  />
                  {formErrors.plannedDistance && <p className="text-sm text-destructive">{formErrors.plannedDistance}</p>}
                </div>

                {/* Revenue */}
                <div className="space-y-1.5">
                  <Label htmlFor="trip-revenue" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Revenue Amount (₹)
                  </Label>
                  <Input
                    id="trip-revenue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 3500"
                    value={revenueAmount}
                    onChange={(e) => { setRevenueAmount(e.target.value); if (formErrors.revenueAmount) setFormErrors(p => ({ ...p, revenueAmount: "" })) }}
                    disabled={creating}
                  />
                  {formErrors.revenueAmount && <p className="text-sm text-destructive">{formErrors.revenueAmount}</p>}
                </div>

                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    id="create-trip-submit-btn"
                    type="submit"
                    disabled={creating || !!capacityExceeded}
                    className="cursor-pointer"
                  >
                    {creating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                    ) : (
                      "Create Trip (Draft)"
                    )}
                  </Button>
                  <Button
                    id="create-trip-clear-btn"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSource(""); setDestination(""); setVehicleId(""); setDriverId("")
                      setCargoWeight(""); setPlannedDistance(""); setRevenueAmount("")
                      setFormErrors({}); setCreateError(null)
                    }}
                    disabled={creating}
                    className="cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Live Board ── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
                Live Board
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {tripsLoading ? (
              <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading trips…</span>
              </div>
            ) : tripsError ? (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tripsError}</AlertDescription>
                </Alert>
              </div>
            ) : liveTrips.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                <MapPin className="h-8 w-8 opacity-30" />
                <p className="text-sm">No trips yet. Create one to get started.</p>
              </div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="flex flex-col gap-3 p-4">
                  {liveTrips.map((trip) => (
                    <LiveBoardCard
                      key={trip.id}
                      trip={trip}
                      canWrite={canWrite}
                      onDispatch={(t) => { setActionError(null); setDispatchTarget(t) }}
                      onComplete={(t) => { setActionError(null); setCompleteTarget(t) }}
                      onCancel={handleCancelTrip}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="px-5 py-3 border-t">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver Available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <DispatchEtaDialog
        tripId={dispatchTarget?.id ?? null}
        open={!!dispatchTarget}
        onClose={() => setDispatchTarget(null)}
        onConfirm={handleDispatchConfirm}
        submitting={actionLoading === dispatchTarget?.id}
      />
      <CompleteTripDialog
        trip={completeTarget}
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleCompleteConfirm}
        submitting={actionLoading === completeTarget?.id}
      />
    </div>
  )
}
