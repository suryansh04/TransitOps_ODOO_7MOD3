import React, { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { useMaintenance } from "@/hooks/useMaintenance"
import { Vehicle } from "@/types/fleet"
import { AlertCircle, Loader2 } from "lucide-react"

function formatCurrency(cost: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cost)
}

function StatusBadge({ status }: { status: "active" | "completed" }) {
  if (status === "completed") {
    return <Badge variant="default">Completed</Badge>
  }
  return <Badge variant="secondary">In Shop</Badge>
}

export const Maintenance: React.FC = () => {
  const { user } = useAuth()
  const canWrite = user?.permissions?.fleet === "full"
  const {
    records,
    vehicles,
    loading,
    error,
    fetchMaintenance,
    createMaintenance,
    completeMaintenance,
  } = useMaintenance()

  const [vehicleId, setVehicleId] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [cost, setCost] = useState("")
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10))

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchMaintenance()
  }, [fetchMaintenance])

  const vehicleById = useMemo(() => {
    return new Map<number, Vehicle>(vehicles.map((vehicle) => [vehicle.id, vehicle]))
  }, [vehicles])

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime()
      const bTime = new Date(b.updated_at).getTime()
      return bTime - aTime
    })
  }, [records])

  const activeVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.status !== "retired")
  }, [vehicles])

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    if (!vehicleId) nextErrors.vehicleId = "Vehicle is required"
    if (!serviceType.trim()) nextErrors.serviceType = "Service type is required"
    if (!cost.trim()) nextErrors.cost = "Cost is required"
    if (cost && Number(cost) <= 0) nextErrors.cost = "Cost must be greater than 0"
    if (!serviceDate) nextErrors.serviceDate = "Date is required"

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setVehicleId("")
    setServiceType("")
    setCost("")
    setServiceDate(new Date().toISOString().slice(0, 10))
    setFormErrors({})
    setSubmitError(null)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    if (!validateForm()) return

    setSaving(true)
    const result = await createMaintenance({
      vehicle_id: Number(vehicleId),
      service_type: serviceType.trim(),
      cost: Number(cost),
      service_date: serviceDate,
    })
    setSaving(false)

    if (!result.success) {
      setSubmitError(result.error ?? "Failed to save maintenance record")
      return
    }

    resetForm()
    await fetchMaintenance()
  }

  const handleMarkCompleted = async (recordId: number) => {
    setUpdatingId(recordId)
    const result = await completeMaintenance(recordId, { status: "completed" })
    setUpdatingId(null)
    if (!result.success) {
      setSubmitError(result.error ?? "Failed to update status")
      return
    }
    await fetchMaintenance()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Log Service Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="maintenance-vehicle" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Vehicle
                </Label>
                <Select value={vehicleId} onValueChange={setVehicleId} disabled={!canWrite || saving || loading}>
                  <SelectTrigger id="maintenance-vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                        {vehicle.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.vehicleId && <p className="text-sm text-destructive">{formErrors.vehicleId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-service-type" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Service Type
                </Label>
                <Input
                  id="maintenance-service-type"
                  value={serviceType}
                  onChange={(event) => setServiceType(event.target.value)}
                  placeholder="Oil Change"
                  disabled={!canWrite || saving || loading}
                />
                {formErrors.serviceType && <p className="text-sm text-destructive">{formErrors.serviceType}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-cost" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Cost
                </Label>
                <Input
                  id="maintenance-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  placeholder="2500"
                  disabled={!canWrite || saving || loading}
                />
                {formErrors.cost && <p className="text-sm text-destructive">{formErrors.cost}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Date
                </Label>
                <Input
                  id="maintenance-date"
                  type="date"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                  disabled={!canWrite || saving || loading}
                />
                {formErrors.serviceDate && <p className="text-sm text-destructive">{formErrors.serviceDate}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-status" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Status
                </Label>
                <Input id="maintenance-status" value="Active" disabled />
              </div>

              {canWrite && (
                <Button type="submit" disabled={saving || loading} className="w-full cursor-pointer">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Service Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2 text-sm">Loading records...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    {canWrite && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canWrite ? 5 : 4} className="h-20 text-center text-muted-foreground">
                        No maintenance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {vehicleById.get(record.vehicle_id)?.registration_number ?? `Vehicle ${record.vehicle_id}`}
                        </TableCell>
                        <TableCell>{record.service_type}</TableCell>
                        <TableCell>{formatCurrency(record.cost)}</TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                        {canWrite && (
                          <TableCell className="text-right">
                            {record.status === "active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => handleMarkCompleted(record.id)}
                                disabled={updatingId === record.id}
                              >
                                {updatingId === record.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Mark Completed"
                                )}
                              </Button>
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
