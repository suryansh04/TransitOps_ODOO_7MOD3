import { useEffect, useState } from "react"
import { useDashboard } from "@/hooks/useDashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const { data, loading, error, fetchDashboard } = useDashboard()
  const [vehicleType, setVehicleType] = useState("All")
  const [status, setStatus] = useState("All")
  const [region, setRegion] = useState("All")

  useEffect(() => {
    fetchDashboard({ vehicle_type: vehicleType, status, region })
  }, [fetchDashboard, vehicleType, status, region])

   const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on_trip":
      case "dispatched":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    return status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }

  const filters = [
    { value: vehicleType, onChange: setVehicleType, placeholder: "Vehicle Type", options: ["van", "truck", "minivan"], format: formatStatus },
    { value: status, onChange: setStatus, placeholder: "Status", options: ["available", "on_trip", "in_shop", "retired"], format: formatStatus },
    { value: region, onChange: setRegion, placeholder: "Region", options: ["Gandhinagar", "Ahmedabad"] },
  ]

  const kpis = data ? [
    { title: "Active Vehicles", value: data.active_vehicles.toString().padStart(2, '0') },
    { title: "Available Vehicles", value: data.available_vehicles.toString().padStart(2, '0') },
    { title: "Vehicles In Maintenance", value: data.vehicles_in_maintenance.toString().padStart(2, '0') },
    { title: "Active Trips", value: data.active_trips.toString().padStart(2, '0') },
    { title: "Pending Trips", value: data.pending_trips.toString().padStart(2, '0') },
    { title: "Drivers On Duty", value: data.drivers_on_duty.toString().padStart(2, '0') },
    { title: "Fleet Utilization", value: `${data.fleet_utilization_percent}%` },
  ] : []

  const vehicleStatuses = data ? [
    { key: "available", label: "Available", color: "bg-green-500", count: data.vehicle_status_breakdown.available },
    { key: "on_trip", label: "On Trip", color: "bg-blue-500", count: data.vehicle_status_breakdown.on_trip },
    { key: "in_shop", label: "In Shop", color: "bg-orange-500", count: data.vehicle_status_breakdown.in_shop },
    { key: "retired", label: "Retired", color: "bg-red-500", count: data.vehicle_status_breakdown.retired },
  ] : []

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground mr-1">Filters:</span>
        {filters.map((f, i) => (
          <div key={i}>
            <Select value={f.value} onValueChange={f.onChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={f.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{f.placeholder}: All</SelectItem>
                {f.options.map(opt => (
                  <SelectItem key={opt} value={opt}>
                    {f.format ? f.format(opt) : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {loading && !data && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {kpis.map((kpi, idx) => (
              <Card key={idx} className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TRIP</TableHead>
                      <TableHead>VEHICLE</TableHead>
                      <TableHead>DRIVER</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>ETA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_trips.map((trip) => (
                      <TableRow key={trip.trip_code}>
                        <TableCell className="font-medium">{trip.trip_code}</TableCell>
                        <TableCell title={trip.vehicle_name_model}>
                          {trip.vehicle_name_model.length > 15 
                            ? trip.vehicle_name_model.substring(0, 15) + "..." 
                            : trip.vehicle_name_model} / {trip.vehicle_type}
                        </TableCell>
                        <TableCell>{trip.driver_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${getStatusColor(trip.status)} border-transparent hover:${getStatusColor(trip.status)}`}>
                            {formatStatus(trip.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{trip.eta}</TableCell>
                      </TableRow>
                    ))}
                    {data.recent_trips.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No recent trips found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="col-span-3 shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const total = vehicleStatuses.reduce((acc, curr) => acc + curr.count, 0);
                    if (total === 0) return <div className="text-sm text-muted-foreground">No vehicles found.</div>;

                    return (
                      <>
                        <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
                          {vehicleStatuses.map(s => (
                            <div key={s.key} className={s.color} style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          {vehicleStatuses.map(s => (
                            <div key={s.key} className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${s.color}`} />
                              <div className="text-sm font-medium">{s.label} ({s.count})</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
