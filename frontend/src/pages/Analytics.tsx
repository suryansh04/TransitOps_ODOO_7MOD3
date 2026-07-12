import React, { useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalytics } from "@/hooks/useAnalytics"
import { AlertCircle } from "lucide-react"

const costliestBarColors = [
  "var(--color-status-retired)",
  "var(--color-status-in-shop)",
  "var(--color-status-on-trip)",
]

const monthlyRevenueConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-status-on-trip)",
  },
}

const costliestVehiclesConfig: ChartConfig = {
  total_cost: {
    label: "Total Cost",
    color: "var(--color-status-retired)",
  },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value}%`
}

function formatFuelEfficiency(value: number) {
  return `${value} km/l`
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    </div>
  )
}

export const Analytics: React.FC = () => {
  const { analytics, loading, error, fetchAnalytics } = useAnalytics()

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading && !analytics) {
    return <AnalyticsSkeleton />
  }

  if (error && !analytics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Fuel Efficiency"
          value={formatFuelEfficiency(analytics.fuel_efficiency_km_per_l)}
        />
        <KpiCard
          label="Fleet Utilization"
          value={formatPercent(analytics.fleet_utilization_percent)}
        />
        <KpiCard
          label="Operational Cost"
          value={formatCurrency(analytics.operational_cost)}
        />
        <KpiCard
          label="Vehicle ROI"
          value={formatPercent(analytics.vehicle_roi_percent)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={monthlyRevenueConfig}
              className="h-[260px] w-full"
            >
              <BarChart accessibilityLayer data={analytics.monthly_revenue}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
              Top Costliest Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={costliestVehiclesConfig}
              className="h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={analytics.top_costliest_vehicles}
                layout="vertical"
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="registration_number"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={82}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="total_cost"
                  fill="var(--color-total_cost)"
                  radius={[0, 6, 6, 0]}
                >
                  {analytics.top_costliest_vehicles.map((vehicle, index) => (
                    <Cell
                      key={vehicle.vehicle_id}
                      fill={costliestBarColors[index] ?? "var(--color-status-on-trip)"}
                    />
                  ))}
                  <LabelList
                    dataKey="total_cost"
                    position="right"
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value) : String(value ?? "")
                    }
                    className="fill-foreground text-xs"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
