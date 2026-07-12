export interface FuelLog {
  id: number
  vehicle_id: number
  trip_id: number | null
  log_date: string
  liters: number
  cost: number
  created_at: string
}

export interface FuelLogCreate {
  vehicle_id: number
  trip_id?: number | null
  log_date: string
  liters: number
  cost: number
}

export interface Expense {
  id: number
  trip_id: number | null
  vehicle_id: number
  toll_amount: number
  other_amount: number
  maintenance_linked_cost: number
  total_amount: number
  expense_date: string
  created_at: string
}

export interface ExpenseCreate {
  trip_id?: number | null
  vehicle_id: number
  toll_amount?: number
  other_amount?: number
  expense_date: string
}
