# TransitOps — Database Schema

## Enum / status values reference

| Field | Allowed values |
|---|---|
| `users.role` | `fleet_manager`, `dispatcher`, `safety_officer`, `financial_analyst` |
| `vehicles.status` | `available`, `on_trip`, `in_shop`, `retired` |
| `drivers.status` | `available`, `on_trip`, `off_duty`, `suspended` |
| `trips.status` | `draft`, `dispatched`, `completed`, `cancelled` |
| `maintenance_logs.status` | `active` (= vehicle In Shop), `completed` |
| `role_permissions.access_level` | `none`, `view`, `full` |

All status/role columns are `VARCHAR` + a `CHECK` constraint, not native Postgres `ENUM` types.

---

## Tables

### 1. `users`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL / UUID | PK |
| name | VARCHAR(120) | NOT NULL |
| email | VARCHAR(160) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(30) | NOT NULL, CHECK IN (see enum table) |
| is_active | BOOLEAN | DEFAULT true |
| failed_login_attempts | INTEGER | DEFAULT 0 |
| locked_until | TIMESTAMP | NULL |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### 2. `vehicles`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| registration_number | VARCHAR(30) | UNIQUE, NOT NULL |
| name_model | VARCHAR(80) | NOT NULL |
| type | VARCHAR(30) | NOT NULL |
| max_load_capacity_kg | NUMERIC(10,2) | NOT NULL |
| odometer_km | NUMERIC(12,2) | DEFAULT 0 |
| acquisition_cost | NUMERIC(14,2) | NOT NULL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'available', CHECK IN (see enum table) |
| region | VARCHAR(60) | NULL |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### 3. `drivers`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(120) | NOT NULL |
| license_number | VARCHAR(40) | UNIQUE, NOT NULL |
| license_category | VARCHAR(20) | NOT NULL |
| license_expiry_date | DATE | NOT NULL |
| contact_number | VARCHAR(20) | NOT NULL |
| safety_score | NUMERIC(5,2) | DEFAULT 100 |
| trips_assigned | INTEGER | DEFAULT 0 |
| trips_completed | INTEGER | DEFAULT 0 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'available', CHECK IN (see enum table) |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

`trip_compl.%` (shown on the Drivers screen) = `trips_completed / trips_assigned * 100`,
computed at query time from the two stored counters above. `trips_assigned` increments on
trip dispatch, `trips_completed` increments on trip completion — updated in the service layer
alongside the existing status transitions, not via a separate query.

### 4. `trips`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| trip_code | VARCHAR(20) | UNIQUE, NOT NULL |
| source | VARCHAR(120) | NOT NULL |
| destination | VARCHAR(120) | NOT NULL |
| vehicle_id | INTEGER | FK → vehicles.id, NOT NULL |
| driver_id | INTEGER | FK → drivers.id, NOT NULL |
| cargo_weight_kg | NUMERIC(10,2) | NOT NULL |
| planned_distance_km | NUMERIC(10,2) | NOT NULL |
| actual_distance_km | NUMERIC(10,2) | NULL |
| final_odometer_km | NUMERIC(12,2) | NULL |
| fuel_consumed_liters | NUMERIC(10,2) | NULL |
| revenue_amount | NUMERIC(14,2) | NULL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft', CHECK IN (see enum table) |
| eta | TIMESTAMP | NULL |
| dispatched_at | TIMESTAMP | NULL |
| completed_at | TIMESTAMP | NULL |
| cancelled_at | TIMESTAMP | NULL |
| created_by | INTEGER | FK → users.id |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### 5. `maintenance_logs`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| vehicle_id | INTEGER | FK → vehicles.id, NOT NULL |
| service_type | VARCHAR(80) | NOT NULL |
| cost | NUMERIC(12,2) | NOT NULL |
| service_date | DATE | NOT NULL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active', CHECK IN (see enum table) |
| closed_at | TIMESTAMP | NULL |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### 6. `fuel_logs`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| vehicle_id | INTEGER | FK → vehicles.id, NOT NULL |
| trip_id | INTEGER | FK → trips.id, NULL |
| log_date | DATE | NOT NULL |
| liters | NUMERIC(10,2) | NOT NULL |
| cost | NUMERIC(12,2) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

### 7. `expenses`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| trip_id | INTEGER | FK → trips.id, NULL |
| vehicle_id | INTEGER | FK → vehicles.id, NOT NULL |
| toll_amount | NUMERIC(12,2) | DEFAULT 0 |
| other_amount | NUMERIC(12,2) | DEFAULT 0 |
| maintenance_linked_cost | NUMERIC(12,2) | DEFAULT 0 |
| expense_date | DATE | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

`total_amount` = `toll_amount + other_amount + maintenance_linked_cost`, computed at query
time (or as a `GENERATED ALWAYS AS` column), not stored separately.

### 8. `role_permissions`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| role | VARCHAR(30) | NOT NULL |
| module | VARCHAR(30) | NOT NULL |
| access_level | VARCHAR(10) | NOT NULL, DEFAULT 'none', CHECK IN ('none','view','full') |

UNIQUE (role, module).

Seed data:

| role | fleet | drivers | trips | fuel_expenses | analytics | settings |
|---|---|---|---|---|---|---|
| fleet_manager | full | full | none | none | full | full |
| dispatcher | view | none | full | none | none | view |
| safety_officer | none | full | view | none | none | view |
| financial_analyst | view | none | none | full | full | view |

### 9. `org_settings`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK (single row, id=1) |
| depot_name | VARCHAR(120) | NOT NULL |
| currency | VARCHAR(10) | DEFAULT 'INR' |
| distance_unit | VARCHAR(20) | DEFAULT 'Kilometers' |
| updated_at | TIMESTAMP | DEFAULT now() |

---

## Relationships (ERD summary)

```
users ──< trips (created_by)

vehicles ──< trips
drivers  ──< trips

vehicles ──< maintenance_logs
vehicles ──< fuel_logs ──> trips (nullable)
vehicles ──< expenses  ──> trips (nullable)

role_permissions (role, module) — reference table
org_settings — singleton
```

---

## Business rules → enforcement

| # | Rule | Enforced by |
|---|---|---|
| 1 | Registration number unique | `vehicles.registration_number UNIQUE` |
| 2 | Retired/In Shop hidden from dispatch | Service layer: dispatch dropdown queries `WHERE status = 'available'` |
| 3 | Expired license/Suspended can't be assigned | Service layer check at dispatch time |
| 4 | No double-booking | Service layer check (`vehicle.status`/`driver.status == available`) |
| 5 | Cargo weight ≤ capacity | Service layer check at dispatch time |
| 6 | Dispatch → both On Trip | Service layer, trip status transition |
| 7 | Complete → both Available | Service layer, trip status transition |
| 8 | Cancel dispatched → both Available | Service layer, trip status transition |
| 9 | Active maintenance → vehicle In Shop | Service layer, maintenance create |
| 10 | Close maintenance → Available (unless retired) | Service layer, maintenance update, with retired-status guard |