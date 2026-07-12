import React, { useState } from "react"
import { useFleet } from "@/hooks/useFleet"
import { useAuth } from "@/context/AuthContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Search } from "lucide-react"
import { AddVehicleDialog } from "@/components/forms/AddVehicleDialog"

export default function Fleet() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { vehicles, loading, error, addVehicle } = useFleet({ type: typeFilter, status: statusFilter })

  const filteredVehicles = vehicles.filter(v => 
    v.registration_number.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 hover:bg-green-200"
      case "on_trip": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "in_shop": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      case "retired": return "bg-red-100 text-red-800 hover:bg-red-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatCapacity = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(0)} Ton`
    }
    return `${kg} kg`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <span className="text-muted-foreground mr-2">Type:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Mini Truck">Mini</SelectItem>
              <SelectItem value="Medium Truck">Truck</SelectItem>
              <SelectItem value="Heavy Truck">Heavy Truck</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <span className="text-muted-foreground mr-2">Status:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On Trip</SelectItem>
              <SelectItem value="in_shop">In Shop</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reg. no..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {user?.permissions?.fleet === "full" && (
          <>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
            <AddVehicleDialog 
              open={isAddOpen} 
              onClose={() => setIsAddOpen(false)} 
              onSubmit={addVehicle} 
            />
          </>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">REG. NO. (UNIQUE)</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">NAME/MODEL</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">TYPE</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">CAPACITY</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">ODOMETER</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">ACQ. COST</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.registration_number}</TableCell>
                  <TableCell>{vehicle.name_model}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{formatCapacity(vehicle.max_load_capacity_kg)}</TableCell>
                  <TableCell>{vehicle.odometer_km.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{vehicle.acquisition_cost.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`${getStatusColor(vehicle.status)} w-24 justify-center capitalize font-medium border-transparent`}>
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
