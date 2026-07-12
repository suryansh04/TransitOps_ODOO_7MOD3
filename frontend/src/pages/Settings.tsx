import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/hooks/useSettings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import { RbacPermissionRow } from "@/types/settings"

// Static RBAC permission table — sourced from SCHEMA.MD seed data
const RBAC_ROWS: RbacPermissionRow[] = [
  {
    role: "fleet_manager",
    label: "Fleet Manager",
    fleet: "full",
    drivers: "full",
    trips: "none",
    fuel_expenses: "none",
    analytics: "full",
    settings: "full",
  },
  {
    role: "dispatcher",
    label: "Dispatcher",
    fleet: "view",
    drivers: "none",
    trips: "full",
    fuel_expenses: "none",
    analytics: "none",
    settings: "view",
  },
  {
    role: "safety_officer",
    label: "Safety Officer",
    fleet: "none",
    drivers: "full",
    trips: "view",
    fuel_expenses: "none",
    analytics: "none",
    settings: "view",
  },
  {
    role: "financial_analyst",
    label: "Financial Analyst",
    fleet: "view",
    drivers: "none",
    trips: "none",
    fuel_expenses: "full",
    analytics: "full",
    settings: "view",
  },
]

const MODULES: { key: keyof Omit<RbacPermissionRow, "role" | "label">; label: string }[] = [
  { key: "fleet", label: "Fleet / Maint." },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "fuel_expenses", label: "Fuel / Exp." },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
]

function AccessBadge({ level }: { level: string }) {
  if (level === "full") {
    return (
      <Badge variant="default" className="text-xs font-semibold">
        ✓ Full
      </Badge>
    )
  }
  if (level === "view") {
    return (
      <Badge variant="secondary" className="text-xs font-semibold">
        View
      </Badge>
    )
  }
  return <span className="text-muted-foreground text-sm">—</span>
}

export const Settings: React.FC = () => {
  const { user } = useAuth()
  const { settings, loading, saving, error, fetchSettings, updateSettings } = useSettings()

  const isFleetManager = user?.role === "fleet_manager"

  const [depotName, setDepotName] = useState("")
  const [currency, setCurrency] = useState("")
  const [distanceUnit, setDistanceUnit] = useState("")

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Populate form fields once settings load
  useEffect(() => {
    if (settings) {
      setDepotName(settings.depot_name)
      setCurrency(settings.currency)
      setDistanceUnit(settings.distance_unit)
    }
  }, [settings])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!depotName.trim()) errors.depotName = "Depot name is required"
    if (!currency.trim()) errors.currency = "Currency is required"
    if (!distanceUnit.trim()) errors.distanceUnit = "Distance unit is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setSaveError(null)

    if (!validate()) return

    const result = await updateSettings({
      depot_name: depotName.trim(),
      currency: currency.trim(),
      distance_unit: distanceUnit.trim(),
    })

    if (result.success) {
      setSuccessMsg("Settings saved successfully.")
    } else {
      setSaveError(result.error ?? "Failed to save settings.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings &amp; RBAC</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage depot configuration and view role-based access permissions.
        </p>
      </div>

      <Separator />

      {/* Read-only banner for non-fleet-manager roles */}
      {!isFleetManager && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            You have <strong>view-only</strong> access to settings. Only the Fleet Manager can make changes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left column: General Settings ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              General
            </CardTitle>
            <CardDescription>
              Organisation-wide configuration for the TransitOps depot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading settings…</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSave} className="space-y-5" noValidate>
                {/* Depot Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="depot-name" className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                    Depot Name
                  </Label>
                  <Input
                    id="depot-name"
                    value={depotName}
                    onChange={(e) => {
                      setDepotName(e.target.value)
                      if (formErrors.depotName) setFormErrors((p) => ({ ...p, depotName: "" }))
                    }}
                    placeholder="Gandhinagar Depot GJ"
                    disabled={!isFleetManager || saving}
                    aria-describedby={formErrors.depotName ? "depot-name-error" : undefined}
                  />
                  {formErrors.depotName && (
                    <p id="depot-name-error" className="text-sm text-destructive">
                      {formErrors.depotName}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                    Currency
                  </Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value)
                      if (formErrors.currency) setFormErrors((p) => ({ ...p, currency: "" }))
                    }}
                    placeholder="INR (Rs.)"
                    disabled={!isFleetManager || saving}
                    aria-describedby={formErrors.currency ? "currency-error" : undefined}
                  />
                  {formErrors.currency && (
                    <p id="currency-error" className="text-sm text-destructive">
                      {formErrors.currency}
                    </p>
                  )}
                </div>

                {/* Distance Unit */}
                <div className="space-y-1.5">
                  <Label htmlFor="distance-unit" className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                    Distance Unit
                  </Label>
                  <Input
                    id="distance-unit"
                    value={distanceUnit}
                    onChange={(e) => {
                      setDistanceUnit(e.target.value)
                      if (formErrors.distanceUnit) setFormErrors((p) => ({ ...p, distanceUnit: "" }))
                    }}
                    placeholder="Kilometers"
                    disabled={!isFleetManager || saving}
                    aria-describedby={formErrors.distanceUnit ? "distance-unit-error" : undefined}
                  />
                  {formErrors.distanceUnit && (
                    <p id="distance-unit-error" className="text-sm text-destructive">
                      {formErrors.distanceUnit}
                    </p>
                  )}
                </div>

                {/* Feedback messages */}
                {successMsg && (
                  <Alert className="border-green-300 bg-green-50 text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>{successMsg}</AlertDescription>
                  </Alert>
                )}
                {saveError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}

                {/* Save button — only visible to fleet manager */}
                {isFleetManager && (
                  <Button
                    id="settings-save-btn"
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── Right column: RBAC Table ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Role-Based Access (RBAC)
            </CardTitle>
            <CardDescription>
              Read-only permission matrix. Access levels: <strong>Full (✓)</strong>, <strong>View</strong>, or <strong>None (—)</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Role</TableHead>
                  {MODULES.map((mod) => (
                    <TableHead key={mod.key} className="font-semibold text-xs uppercase tracking-wide text-center">
                      {mod.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {RBAC_ROWS.map((row) => (
                  <TableRow
                    key={row.role}
                    className={user?.role === row.role ? "bg-muted/50" : undefined}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.label}
                      {user?.role === row.role && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    {MODULES.map((mod) => (
                      <TableCell key={mod.key} className="text-center">
                        <AccessBadge level={row[mod.key]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
