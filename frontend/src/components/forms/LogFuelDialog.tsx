import React, { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Vehicle } from "@/types/fleet"
import { FuelLogCreate } from "@/types/fuelExpenses"
import { AlertCircle, Loader2 } from "lucide-react"

export interface LogFuelDialogProps {
  open: boolean
  onClose: () => void
  vehicles: Vehicle[]
  onSubmit: (data: FuelLogCreate) => Promise<{ success: boolean; error?: string }>
}

export function LogFuelDialog({ open, onClose, vehicles, onSubmit }: LogFuelDialogProps) {
  const [vehicleId, setVehicleId] = useState("")
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [liters, setLiters] = useState("")
  const [cost, setCost] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setVehicleId("")
      setLogDate(new Date().toISOString().slice(0, 10))
      setLiters("")
      setCost("")
      setErrors({})
      setSubmitError(null)
    }
  }, [open])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!vehicleId) nextErrors.vehicleId = "Vehicle is required"
    if (!logDate) nextErrors.logDate = "Date is required"
    if (!liters || Number(liters) <= 0) nextErrors.liters = "Liters must be greater than 0"
    if (!cost || Number(cost) < 0) nextErrors.cost = "Cost must be 0 or greater"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit({
      vehicle_id: Number(vehicleId),
      log_date: logDate,
      liters: Number(liters),
      cost: Number(cost),
    })
    setSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      setSubmitError(result.error ?? "Failed to add fuel log")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Fuel</DialogTitle>
          <DialogDescription>Add a manual fuel log entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fuel-vehicle" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Vehicle
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId} disabled={submitting}>
              <SelectTrigger id="fuel-vehicle">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.registration_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fuel-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Date
            </Label>
            <Input
              id="fuel-date"
              type="date"
              value={logDate}
              onChange={(event) => setLogDate(event.target.value)}
              disabled={submitting}
            />
            {errors.logDate && <p className="text-sm text-destructive">{errors.logDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fuel-liters" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Liters
              </Label>
              <Input
                id="fuel-liters"
                type="number"
                min="0"
                step="0.01"
                value={liters}
                onChange={(event) => setLiters(event.target.value)}
                placeholder="42"
                disabled={submitting}
              />
              {errors.liters && <p className="text-sm text-destructive">{errors.liters}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuel-cost" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Fuel Cost
              </Label>
              <Input
                id="fuel-cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="3150"
                disabled={submitting}
              />
              {errors.cost && <p className="text-sm text-destructive">{errors.cost}</p>}
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
