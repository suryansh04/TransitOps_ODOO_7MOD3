import React, { useEffect, useMemo, useState } from "react"

import { AddExpenseDialog } from "@/components/forms/AddExpenseDialog"
import { LogFuelDialog } from "@/components/forms/LogFuelDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFuelExpenses } from "@/hooks/useFuelExpenses"
import { AlertCircle, Loader2 } from "lucide-react"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const FuelExpenses: React.FC = () => {
  const PAGE_SIZE = 8

  const {
    fuelLogs,
    expenses,
    vehicles,
    operationalCost,
    loading,
    error,
    fetchFuelExpenses,
    createFuelLog,
    createExpense,
  } = useFuelExpenses()

  const [fuelDialogOpen, setFuelDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [fuelPage, setFuelPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)

  useEffect(() => {
    fetchFuelExpenses()
  }, [fetchFuelExpenses])

  const vehicleById = useMemo(() => {
    return new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))
  }, [vehicles])

  const sortedFuelLogs = useMemo(() => {
    return [...fuelLogs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
  }, [fuelLogs])

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  }, [expenses])

  const fuelTotalPages = Math.max(1, Math.ceil(sortedFuelLogs.length / PAGE_SIZE))
  const expenseTotalPages = Math.max(1, Math.ceil(sortedExpenses.length / PAGE_SIZE))

  useEffect(() => {
    setFuelPage((current) => Math.min(current, fuelTotalPages))
  }, [fuelTotalPages])

  useEffect(() => {
    setExpensePage((current) => Math.min(current, expenseTotalPages))
  }, [expenseTotalPages])

  const paginatedFuelLogs = useMemo(() => {
    const start = (fuelPage - 1) * PAGE_SIZE
    return sortedFuelLogs.slice(start, start + PAGE_SIZE)
  }, [fuelPage, sortedFuelLogs])

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * PAGE_SIZE
    return sortedExpenses.slice(start, start + PAGE_SIZE)
  }, [expensePage, sortedExpenses])

  const handleFuelSubmit = async (payload: Parameters<typeof createFuelLog>[0]) => {
    const result = await createFuelLog(payload)
    if (result.success) {
      await fetchFuelExpenses()
    }
    return result
  }

  const handleExpenseSubmit = async (payload: Parameters<typeof createExpense>[0]) => {
    const result = await createExpense(payload)
    if (result.success) {
      await fetchFuelExpenses()
    }
    return result
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Fuel Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setFuelDialogOpen(true)} className="cursor-pointer">+ Log Fuel</Button>
              <Button onClick={() => setExpenseDialogOpen(true)} className="cursor-pointer">+ Add Expense</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Loading fuel logs...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No fuel logs found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedFuelLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {vehicleById.get(log.vehicle_id)?.registration_number ?? `Vehicle ${log.vehicle_id}`}
                      </TableCell>
                      <TableCell>{formatDate(log.log_date)}</TableCell>
                      <TableCell>{log.liters} L</TableCell>
                      <TableCell>{formatCurrency(log.cost)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {!loading && sortedFuelLogs.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(fuelPage - 1) * PAGE_SIZE + 1}-{Math.min(fuelPage * PAGE_SIZE, sortedFuelLogs.length)} of {sortedFuelLogs.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFuelPage((p) => Math.max(1, p - 1))}
                  disabled={fuelPage === 1}
                  className="cursor-pointer"
                >
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground">Page {fuelPage} / {fuelTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFuelPage((p) => Math.min(fuelTotalPages, p + 1))}
                  disabled={fuelPage === fuelTotalPages}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
            Other Expenses (Toll / Misc)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Loading expenses...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Toll</TableHead>
                  <TableHead>Other</TableHead>
                  <TableHead>Maint. (Linked)</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-16 text-center text-muted-foreground">No expenses found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.trip_id ? `TR${String(expense.trip_id).padStart(3, "0")}` : "-"}</TableCell>
                      <TableCell className="font-medium">
                        {vehicleById.get(expense.vehicle_id)?.registration_number ?? `Vehicle ${expense.vehicle_id}`}
                      </TableCell>
                      <TableCell>{formatCurrency(expense.toll_amount)}</TableCell>
                      <TableCell>{formatCurrency(expense.other_amount)}</TableCell>
                      <TableCell>{formatCurrency(expense.maintenance_linked_cost)}</TableCell>
                      <TableCell>{formatCurrency(expense.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={expense.trip_id ? "default" : "secondary"}>
                          {expense.trip_id ? "Completed" : "Available"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {!loading && sortedExpenses.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(expensePage - 1) * PAGE_SIZE + 1}-{Math.min(expensePage * PAGE_SIZE, sortedExpenses.length)} of {sortedExpenses.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                  disabled={expensePage === 1}
                  className="cursor-pointer"
                >
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground">Page {expensePage} / {expenseTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                  disabled={expensePage === expenseTotalPages}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Total Operational Cost (Auto) = Fuel + Maint
        </p>
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(operationalCost)}</p>
      </div>

      <LogFuelDialog
        open={fuelDialogOpen}
        onClose={() => setFuelDialogOpen(false)}
        vehicles={vehicles}
        onSubmit={handleFuelSubmit}
      />

      <AddExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        vehicles={vehicles}
        onSubmit={handleExpenseSubmit}
      />
    </div>
  )
}
