import React, { useState, useEffect } from "react"
import { Vehicle } from "@/types/fleet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"

export interface AddVehicleDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: Omit<Vehicle, "id" | "created_at" | "updated_at" | "status">) => Promise<{ success: boolean; error?: string }>
}

export function AddVehicleDialog({ open, onClose, onSubmit }: AddVehicleDialogProps) {
    const [registrationNumber, setRegistrationNumber] = useState("")
    const [nameModel, setNameModel] = useState("")
    const [type, setType] = useState("Medium Truck")
    const [region, setRegion] = useState("Gandhinagar")
    const [maxLoadCapacityKg, setMaxLoadCapacityKg] = useState("")
    const [odometerKm, setOdometerKm] = useState("")
    const [acquisitionCost, setAcquisitionCost] = useState("")

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            setRegistrationNumber("")
            setNameModel("")
            setType("Medium Truck")
            setRegion("Gandhinagar")
            setMaxLoadCapacityKg("")
            setOdometerKm("")
            setAcquisitionCost("")
            setErrors({})
            setSubmitError(null)
        }
    }, [open])

    const validate = () => {
        const e: Record<string, string> = {}
        if (!registrationNumber.trim()) e.registrationNumber = "Registration number is required"
        if (!nameModel.trim()) e.nameModel = "Name/Model is required"
        if (!type.trim()) e.type = "Type is required"
        if (!region.trim()) e.region = "Region is required"
        
        const capacity = Number(maxLoadCapacityKg)
        if (!maxLoadCapacityKg || isNaN(capacity) || capacity < 1) e.maxLoadCapacityKg = "Valid capacity (>0) is required"
        
        const odometer = Number(odometerKm)
        if (!odometerKm || isNaN(odometer) || odometer < 0) e.odometerKm = "Valid odometer (>=0) is required"
        
        const cost = Number(acquisitionCost)
        if (!acquisitionCost || isNaN(cost) || cost < 1) e.acquisitionCost = "Valid acquisition cost (>0) is required"
        
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        setSubmitError(null)
        if (!validate()) return
        
        setSubmitting(true)
        const result = await onSubmit({
            registration_number: registrationNumber.trim().toUpperCase(),
            name_model: nameModel.trim(),
            type: type,
            max_load_capacity_kg: Number(maxLoadCapacityKg),
            odometer_km: Number(odometerKm),
            acquisition_cost: Number(acquisitionCost),
            region: region.trim()
        })
        setSubmitting(false)
        
        if (result.success) {
            onClose()
        } else {
            setSubmitError(result.error ?? "Failed to add vehicle")
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>
                        Enter the vehicle details. Registration number must be unique.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Row 1: Reg Num + Name/Model */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-reg" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Registration Number
                            </Label>
                            <Input
                                id="veh-reg"
                                placeholder="e.g. GJ01AB1234"
                                value={registrationNumber}
                                onChange={(e) => { setRegistrationNumber(e.target.value); if (errors.registrationNumber) setErrors(p => ({ ...p, registrationNumber: "" })) }}
                                disabled={submitting}
                            />
                            {errors.registrationNumber && <p className="text-sm text-destructive">{errors.registrationNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-name" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Name/Model
                            </Label>
                            <Input
                                id="veh-name"
                                placeholder="e.g. Tata Signa 4225"
                                value={nameModel}
                                onChange={(e) => { setNameModel(e.target.value); if (errors.nameModel) setErrors(p => ({ ...p, nameModel: "" })) }}
                                disabled={submitting}
                            />
                            {errors.nameModel && <p className="text-sm text-destructive">{errors.nameModel}</p>}
                        </div>
                    </div>
                    
                    {/* Row 2: Type + Region */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-type" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Vehicle Type
                            </Label>
                            <Select
                                value={type}
                                onValueChange={(v) => { setType(v); if (errors.type) setErrors(p => ({ ...p, type: "" })) }}
                                disabled={submitting}
                            >
                                <SelectTrigger id="veh-type">
                                    <SelectValue placeholder="Select type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Van">Van</SelectItem>
                                    <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                                    <SelectItem value="Medium Truck">Medium Truck</SelectItem>
                                    <SelectItem value="Heavy Truck">Heavy Truck</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-region" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Region
                            </Label>
                            <Input
                                id="veh-region"
                                placeholder="e.g. Gandhinagar"
                                value={region}
                                onChange={(e) => { setRegion(e.target.value); if (errors.region) setErrors(p => ({ ...p, region: "" })) }}
                                disabled={submitting}
                            />
                            {errors.region && <p className="text-sm text-destructive">{errors.region}</p>}
                        </div>
                    </div>

                    {/* Row 3: Capacity + Odometer */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-cap" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Capacity (kg)
                            </Label>
                            <Input
                                id="veh-cap"
                                type="number"
                                placeholder="e.g. 5000"
                                value={maxLoadCapacityKg}
                                onChange={(e) => { setMaxLoadCapacityKg(e.target.value); if (errors.maxLoadCapacityKg) setErrors(p => ({ ...p, maxLoadCapacityKg: "" })) }}
                                disabled={submitting}
                            />
                            {errors.maxLoadCapacityKg && <p className="text-sm text-destructive">{errors.maxLoadCapacityKg}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="veh-odo" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Initial Odometer (km)
                            </Label>
                            <Input
                                id="veh-odo"
                                type="number"
                                placeholder="e.g. 15000"
                                value={odometerKm}
                                onChange={(e) => { setOdometerKm(e.target.value); if (errors.odometerKm) setErrors(p => ({ ...p, odometerKm: "" })) }}
                                disabled={submitting}
                            />
                            {errors.odometerKm && <p className="text-sm text-destructive">{errors.odometerKm}</p>}
                        </div>
                    </div>

                    {/* Row 4: Cost */}
                    <div className="space-y-1.5">
                        <Label htmlFor="veh-cost" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            Acquisition Cost
                        </Label>
                        <Input
                            id="veh-cost"
                            type="number"
                            placeholder="e.g. 850000"
                            value={acquisitionCost}
                            onChange={(e) => { setAcquisitionCost(e.target.value); if (errors.acquisitionCost) setErrors(p => ({ ...p, acquisitionCost: "" })) }}
                            disabled={submitting}
                        />
                        {errors.acquisitionCost && <p className="text-sm text-destructive">{errors.acquisitionCost}</p>}
                    </div>

                    {submitError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}
                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="cursor-pointer">
                            {submitting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
                                : "Add Vehicle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
