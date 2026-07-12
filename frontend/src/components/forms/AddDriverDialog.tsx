import React, { useState, useEffect } from "react"
import { DriverCreate } from "@/hooks/useDrivers"
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

export interface AddDriverDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: DriverCreate) => Promise<{ success: boolean; error?: string }>
}

export function AddDriverDialog({ open, onClose, onSubmit }: AddDriverDialogProps) {
    const [name, setName] = useState("")
    const [licenseNumber, setLicenseNumber] = useState("")
    const [licenseCategory, setLicenseCategory] = useState("")
    const [licenseExpiry, setLicenseExpiry] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            setName(""); setLicenseNumber(""); setLicenseCategory("")
            setLicenseExpiry(""); setContactNumber("")
            setErrors({}); setSubmitError(null)
        }
    }, [open])

    const validate = () => {
        const e: Record<string, string> = {}
        if (!name.trim()) e.name = "Name is required"
        if (!licenseNumber.trim()) e.licenseNumber = "License number is required"
        if (!licenseCategory.trim()) e.licenseCategory = "Category is required"
        if (!licenseExpiry) e.licenseExpiry = "Expiry date is required"
        if (!contactNumber.trim()) e.contactNumber = "Contact number is required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        setSubmitError(null)
        if (!validate()) return
        setSubmitting(true)
        const result = await onSubmit({
            name: name.trim(),
            license_number: licenseNumber.trim(),
            license_category: licenseCategory.trim(),
            license_expiry_date: licenseExpiry,
            contact_number: contactNumber.trim(),
        })
        setSubmitting(false)
        if (result.success) {
            onClose()
        } else {
            setSubmitError(result.error ?? "Failed to add driver")
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                    <DialogDescription>
                        Enter the driver's details. License number must be unique.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Row 1: Name + License Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="drv-name" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                Full Name
                            </Label>
                            <Input
                                id="drv-name"
                                placeholder="e.g. Alex Kumar"
                                value={name}
                                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })) }}
                                disabled={submitting}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="drv-lic-no" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                License Number
                            </Label>
                            <Input
                                id="drv-lic-no"
                                placeholder="e.g. DL-88213"
                                value={licenseNumber}
                                onChange={(e) => { setLicenseNumber(e.target.value); if (errors.licenseNumber) setErrors(p => ({ ...p, licenseNumber: "" })) }}
                                disabled={submitting}
                            />
                            {errors.licenseNumber && <p className="text-sm text-destructive">{errors.licenseNumber}</p>}
                        </div>
                    </div>
                    {/* Row 2: Category + Expiry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="drv-lic-cat" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                License Category
                            </Label>
                            <Select
                                value={licenseCategory}
                                onValueChange={(v) => { setLicenseCategory(v); if (errors.licenseCategory) setErrors(p => ({ ...p, licenseCategory: "" })) }}
                                disabled={submitting}
                            >
                                <SelectTrigger id="drv-lic-cat">
                                    <SelectValue placeholder="Select category…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LMV">LMV — Light Motor Vehicle</SelectItem>
                                    <SelectItem value="HMV">HMV — Heavy Motor Vehicle</SelectItem>
                                    <SelectItem value="HGMV">HGMV — Heavy Goods Motor Vehicle</SelectItem>
                                    <SelectItem value="TRANS">TRANS — Transport Vehicle</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.licenseCategory && <p className="text-sm text-destructive">{errors.licenseCategory}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="drv-expiry" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                License Expiry Date
                            </Label>
                            <Input
                                id="drv-expiry"
                                type="date"
                                value={licenseExpiry}
                                onChange={(e) => { setLicenseExpiry(e.target.value); if (errors.licenseExpiry) setErrors(p => ({ ...p, licenseExpiry: "" })) }}
                                disabled={submitting}
                            />
                            {errors.licenseExpiry && <p className="text-sm text-destructive">{errors.licenseExpiry}</p>}
                        </div>
                    </div>
                    {/* Row 3: Contact (full width) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="drv-contact" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            Contact Number
                        </Label>
                        <Input
                            id="drv-contact"
                            placeholder="e.g. 9876500000"
                            value={contactNumber}
                            onChange={(e) => { setContactNumber(e.target.value); if (errors.contactNumber) setErrors(p => ({ ...p, contactNumber: "" })) }}
                            disabled={submitting}
                        />
                        {errors.contactNumber && <p className="text-sm text-destructive">{errors.contactNumber}</p>}
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
                                : "Add Driver"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
