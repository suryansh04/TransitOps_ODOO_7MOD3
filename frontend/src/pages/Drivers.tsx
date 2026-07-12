import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useDrivers, DriverCreate } from "@/hooks/useDrivers"
import { Driver } from "@/types/fleet"
import { AddDriverDialog } from "@/components/forms/AddDriverDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    UserPlus,
    Users,
} from "lucide-react"
// ── Status badge ──────────────────────────────────────────────────────────────
type DriverStatus = Driver["status"]
const STATUS_LABEL: Record<DriverStatus, string> = {
    available: "Available",
    on_trip:   "On Trip",
    off_duty:  "Off Duty",
    suspended: "Suspended",
}
function DriverStatusBadge({ status }: { status: DriverStatus }) {
    const dotMap: Record<DriverStatus, string> = {
        available: "bg-green-500",
        on_trip:   "bg-blue-500",
        off_duty:  "bg-gray-400",
        suspended: "bg-orange-500",
    }
    return (
        <Badge variant="outline" className="text-xs font-medium gap-1.5 px-2.5 py-0.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotMap[status]}`} />
            {STATUS_LABEL[status]}
        </Badge>
    )
}
// ── Safety score badge ────────────────────────────────────────────────────────
function SafetyBadge({ score }: { score: number }) {
    const pct = Math.round(score)
    let dotColor = "bg-green-500"
    if (pct < 75) dotColor = "bg-red-500"
    else if (pct < 90) dotColor = "bg-orange-500"
    
    return (
        <Badge variant="outline" className="text-xs font-medium tabular-nums gap-1.5 px-2.5 py-0.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
            {pct}%
        </Badge>
    )
}
// ── License expiry cell ───────────────────────────────────────────────────────
function ExpiryCell({ dateStr }: { dateStr: string }) {
    const expiry = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isExpired = expiry < today
    const formatted =
        expiry.toLocaleDateString("en-IN", { month: "2-digit", year: "numeric" })
    return (
        <span className={isExpired ? "text-destructive font-medium" : "text-foreground"}>
            {formatted}
            {isExpired && (
                <Badge variant="destructive" className="ml-2 text-[10px] font-bold px-1.5 py-0">
                    EXPIRED
                </Badge>
            )}
        </span>
    )
}
// ── Add Driver dialog has been extracted to @/components/forms/AddDriverDialog ──
// ── Status toggle dialog (per-row) ────────────────────────────────────────────
interface StatusDialogProps {
    driver: Driver | null
    open: boolean
    onClose: () => void
    onConfirm: (id: number, status: "available" | "off_duty" | "suspended") => Promise<void>
    submitting: boolean
}
function StatusDialog({ driver, open, onClose, onConfirm, submitting }: StatusDialogProps) {
    const [selected, setSelected] = useState<"available" | "off_duty" | "suspended">("available")
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        if (open && driver) {
            const cur = driver.status
            setSelected(cur === "on_trip" ? "available" : (cur as "available" | "off_duty" | "suspended"))
            setError(null)
        }
    }, [open, driver])
    const handleConfirm = async () => {
        if (!driver) return
        if (selected === driver.status) { onClose(); return }
        await onConfirm(driver.id, selected)
    }
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Change Status</DialogTitle>
                    <DialogDescription>
                        {driver?.name} — select a new status. "On Trip" cannot be set manually.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 my-2">
                    {(["available", "off_duty", "suspended"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSelected(s)}
                            className={[
                                "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left",
                                selected === s
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border bg-background text-foreground hover:bg-muted",
                            ].join(" ")}
                        >
                            <span className={[
                                "w-1.5 h-4 rounded-sm shrink-0",
                                selected === s ? "bg-primary" : "bg-border",
                            ].join(" ")} />
                            {STATUS_LABEL[s]}
                        </button>
                    ))}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={submitting} className="cursor-pointer">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
// ── Status filter pill ────────────────────────────────────────────────────────
const FILTER_OPTIONS: { value: DriverStatus | "all"; label: string; dotColor?: string }[] = [
    { value: "all",       label: "All"                                          },
    { value: "available", label: "Available", dotColor: "bg-green-500"           },
    { value: "on_trip",   label: "On Trip",   dotColor: "bg-blue-500"            },
    { value: "off_duty",  label: "Off Duty",  dotColor: "bg-gray-400"            },
    { value: "suspended", label: "Suspended", dotColor: "bg-orange-500"          },
]
// ── Main page ─────────────────────────────────────────────────────────────────
export const Drivers: React.FC = () => {
    const { user } = useAuth()
    const canWrite = user?.permissions?.["drivers"] === "full"
    const { drivers, loading, error, fetchDrivers, addDriver, updateDriverStatus } = useDrivers()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all")
    const [addOpen, setAddOpen] = useState(false)
    const [statusTarget, setStatusTarget] = useState<Driver | null>(null)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    useEffect(() => { fetchDrivers() }, [fetchDrivers])
    const filtered = useMemo(() => {
        let list = drivers
        if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(
                (d) =>
                    d.name.toLowerCase().includes(q) ||
                    d.license_number.toLowerCase().includes(q) ||
                    d.license_category.toLowerCase().includes(q) ||
                    d.contact_number.includes(q)
            )
        }
        return list
    }, [drivers, statusFilter, search])
    const handleAddDriver = async (data: DriverCreate) => {
        const result = await addDriver(data)
        if (result.success) {
            setActionSuccess("Driver added successfully.")
            setTimeout(() => setActionSuccess(null), 3000)
        }
        return result
    }
    const handleStatusChange = async (
        id: number,
        status: "available" | "off_duty" | "suspended"
    ) => {
        setStatusUpdating(true)
        setActionError(null)
        const result = await updateDriverStatus(id, status)
        setStatusUpdating(false)
        setStatusTarget(null)
        if (!result.success) {
            setActionError(result.error ?? "Failed to update status")
        } else {
            setActionSuccess("Driver status updated.")
            setTimeout(() => setActionSuccess(null), 3000)
        }
    }
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Drivers &amp; Safety Profiles</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {canWrite
                            ? "Manage driver profiles, license validity, and safety scores."
                            : "View driver profiles and safety information."}
                    </p>
                </div>
                {canWrite && (
                    <Button
                        id="add-driver-btn"
                        onClick={() => setAddOpen(true)}
                        className="cursor-pointer gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        + Add Driver
                    </Button>
                )}
            </div>
            <Separator />
            {/* Feedback banners */}
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
            {/* Search + filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    id="drivers-search"
                    placeholder="Search by name, license no, or contact…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            {/* Drivers table */}
            {loading ? (
                <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading drivers…</span>
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Driver</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">License No</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Category</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Expiry</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide">Contact</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Trip Compl.</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Safety</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Status</TableHead>
                                {canWrite && (
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canWrite ? 9 : 8} className="py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 opacity-30" />
                                            <span className="text-sm">No drivers found.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((driver) => {
                                    const isBlocked =
                                        driver.status === "suspended" ||
                                        new Date(driver.license_expiry_date) < new Date()
                                    return (
                                        <TableRow key={driver.id}>
                                            <TableCell className="font-medium">
                                                <span className={isBlocked ? "text-destructive" : undefined}>
                                                    {driver.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{driver.license_number}</TableCell>
                                            <TableCell>{driver.license_category}</TableCell>
                                            <TableCell>
                                                <ExpiryCell dateStr={driver.license_expiry_date} />
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {driver.contact_number.slice(0, 5)}xxxxx
                                            </TableCell>
                                            <TableCell className="text-center text-sm font-medium">
                                                {driver.trips_completed}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SafetyBadge score={driver.safety_score} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DriverStatusBadge status={driver.status} />
                                            </TableCell>
                                            {canWrite && (
                                                <TableCell className="text-center">
                                                    <Button
                                                        id={`change-status-btn-${driver.id}`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs cursor-pointer"
                                                        disabled={driver.status === "on_trip"}
                                                        onClick={() => { setActionError(null); setStatusTarget(driver) }}
                                                    >
                                                        {driver.status === "on_trip" ? "On Trip" : "Change Status"}
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            {/* Status filter toggles */}
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                    Filter by Status
                </p>
                <div className="flex flex-wrap gap-6">
                    {FILTER_OPTIONS.map((opt) => {
                        const count = opt.value === "all" 
                            ? drivers.length 
                            : drivers.filter((d) => d.status === opt.value).length;
                            
                        return (
                            <button
                                key={opt.value}
                                id={`filter-${opt.value}`}
                                onClick={() => setStatusFilter(opt.value)}
                                className={[
                                    "flex items-center gap-2 text-sm transition-colors cursor-pointer",
                                    statusFilter === opt.value ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                                ].join(" ")}
                            >
                                {opt.dotColor && (
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotColor}`} />
                                )}
                                <span>{opt.label} ({count})</span>
                            </button>
                        )
                    })}
                </div>
            </div>
            {/* Business rule notice */}
            <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Rule: Expired license or Suspended status → blocked from trip assignment</span>
            </div>
            {/* Dialogs */}
            <AddDriverDialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                onSubmit={handleAddDriver}
            />
            <StatusDialog
                driver={statusTarget}
                open={!!statusTarget}
                onClose={() => setStatusTarget(null)}
                onConfirm={handleStatusChange}
                submitting={statusUpdating}
            />
        </div>
    )
}
