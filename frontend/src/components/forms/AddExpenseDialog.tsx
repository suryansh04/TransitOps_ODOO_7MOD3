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
import { ExpenseCreate } from "@/types/fuelExpenses"
import { AlertCircle, Loader2 } from "lucide-react"

export interface AddExpenseDialogProps {
  open: boolean
  onClose: () => void
  vehicles: Vehicle[]
  onSubmit: (data: ExpenseCreate) => Promise<{ success: boolean; error?: string }>
}

export function AddExpenseDialog({ open, onClose, vehicles, onSubmit }: AddExpenseDialogProps) {
  const [vehicleId, setVehicleId] = useState("")
  const [tripId, setTripId] = useState("")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [tollAmount, setTollAmount] = useState("0")
  const [otherAmount, setOtherAmount] = useState("0")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setVehicleId("")
      setTripId("")
      setExpenseDate(new Date().toISOString().slice(0, 10))
      setTollAmount("0")
      setOtherAmount("0")
      setErrors({})
      setSubmitError(null)
    }
  }, [open])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!vehicleId) nextErrors.vehicleId = "Vehicle is required"
    if (!expenseDate) nextErrors.expenseDate = "Date is required"
    if (Number(tollAmount) < 0) nextErrors.tollAmount = "Toll amount must be 0 or greater"
    if (Number(otherAmount) < 0) nextErrors.otherAmount = "Other amount must be 0 or greater"
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
      trip_id: tripId ? Number(tripId) : null,
      toll_amount: Number(tollAmount),
      other_amount: Number(otherAmount),
      expense_date: expenseDate,
    })
    setSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      setSubmitError(result.error ?? "Failed to add expense")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Add toll and miscellaneous expense details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="expense-vehicle" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Vehicle
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId} disabled={submitting}>
              <SelectTrigger id="expense-vehicle">
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
            <Label htmlFor="expense-trip" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Trip ID (optional)
            </Label>
            <Input
              id="expense-trip"
              type="number"
              min="1"
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              placeholder="e.g. 12"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Date
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
              disabled={submitting}
            />
            {errors.expenseDate && <p className="text-sm text-destructive">{errors.expenseDate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense-toll" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Toll
              </Label>
              <Input
                id="expense-toll"
                type="number"
                min="0"
                step="0.01"
                value={tollAmount}
                onChange={(event) => setTollAmount(event.target.value)}
                disabled={submitting}
              />
              {errors.tollAmount && <p className="text-sm text-destructive">{errors.tollAmount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-other" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Other
              </Label>
              <Input
                id="expense-other"
                type="number"
                min="0"
                step="0.01"
                value={otherAmount}
                onChange={(event) => setOtherAmount(event.target.value)}
                disabled={submitting}
              />
              {errors.otherAmount && <p className="text-sm text-destructive">{errors.otherAmount}</p>}
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
