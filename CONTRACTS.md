# TransitOps — API Contracts

**Base path:** `/api` (no version prefix)
**Auth:** JWT Bearer token in `Authorization: Bearer <token>` header, unless marked 🔓 Public.

## Legend
- **Status:** 🔲 Planned · 🟡 Implemented · ✅ Tested
- **Auth:** 🔒 Required · 🔓 Public
- **Owner:** TBD for all endpoints — team fills in as work is claimed.

All field names below match `SCHEMA.MD` exactly. All error responses follow FastAPI's default
shape: `{"detail": "<message>"}` — typically 400/401/403/404/422, plus 423 for the login
lockout case — per hackathon.md's frontend rule of surfacing the backend's exact `detail`
message.

---

## Auth

### `POST /api/auth/login`
**Status:** 🔲 · **Auth:** 🔓 Public · **Owner:** TBD

**Request**
```json
{
  "email": "raven@transitops.in",
  "password": "string",
  "role": "dispatcher"
}
```

**Response 200**
```json
{
  "access_token": "jwt-string",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Raven K.",
    "email": "raven@transitops.in",
    "role": "dispatcher"
  }
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Invalid credentials |
| 401 | `role` in request doesn't match the account's actual role |
| 423 | Account locked (5 failed attempts) — includes `locked_until` in `detail` |

**Notes:** Failed attempt increments `users.failed_login_attempts`; 5th failure sets
`users.locked_until`. Successful login resets `failed_login_attempts` to 0.

---

### `GET /api/auth/me`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200**
```json
{
  "id": 1,
  "name": "Raven K.",
  "email": "raven@transitops.in",
  "role": "dispatcher",
  "permissions": {
    "fleet": "view",
    "drivers": "none",
    "trips": "full",
    "fuel_expenses": "none",
    "analytics": "none"
  }
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Missing/invalid/expired token |

**Notes:** `permissions` is looked up from `role_permissions` for the user's `role`. Frontend
uses this to show/hide sidebar modules and disable write actions.

---

## Vehicles

### `GET /api/vehicles`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Query params:** `type`, `status`, `region` (all optional filters)

**Response 200**
```json
[
  {
    "id": 1,
    "registration_number": "GJ01AB4521",
    "name_model": "VAN-05",
    "type": "Van",
    "max_load_capacity_kg": 500,
    "odometer_km": 74000,
    "acquisition_cost": 620000,
    "status": "available",
    "region": "Gandhinagar",
    "created_at": "2026-07-01T10:00:00Z",
    "updated_at": "2026-07-01T10:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `fleet` (currently: `safety_officer`) |

---

### `GET /api/vehicles/{id}`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200:** single vehicle object (same shape as above).

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role has `none` access to `fleet` (currently: `safety_officer`) |
| 404 | Vehicle not found |

---

### `POST /api/vehicles`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Request**
```json
{
  "registration_number": "GJ01AB4521",
  "name_model": "VAN-05",
  "type": "Van",
  "max_load_capacity_kg": 500,
  "odometer_km": 0,
  "acquisition_cost": 620000,
  "region": "Gandhinagar"
}
```

**Response 201:** created vehicle object, `status` defaults to `"available"`.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fleet` |
| 422 | `registration_number` already exists |
| 422 | Missing/invalid required field |

---

### `PUT /api/vehicles/{id}`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Request:** any subset of vehicle fields (partial update), including `status`.

**Response 200:** updated vehicle object.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fleet` |
| 404 | Vehicle not found |
| 422 | Setting `status` directly to `on_trip`/`in_shop` is rejected — those are only set via trip/maintenance endpoints, not a direct PATCH |

---

### `DELETE /api/vehicles/{id}`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Response 204:** no content.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fleet` |
| 404 | Vehicle not found |
| 422 | Vehicle has trips/maintenance/fuel/expense history — use status `retired` instead of deleting |

---

## Drivers

### `GET /api/drivers`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200**
```json
[
  {
    "id": 1,
    "name": "Alex",
    "license_number": "DL-88213",
    "license_category": "LMV",
    "license_expiry_date": "2028-12-01",
    "contact_number": "9876500000",
    "safety_score": 96,
    "trips_assigned": 25,
    "trips_completed": 24,
    "status": "available",
    "created_at": "2026-07-01T10:00:00Z",
    "updated_at": "2026-07-01T10:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `drivers` (currently: `dispatcher`, `financial_analyst`) |

**Notes:** frontend computes `trip_compl_percent = trips_completed / trips_assigned * 100`.

---

### `GET /api/drivers/{id}`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200:** single driver object.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role has `none` access to `drivers` (currently: `dispatcher`, `financial_analyst`) |
| 404 | Driver not found |

---

### `POST /api/drivers`
**Status:** 🔲 · **Auth:** 🔒 (Safety Officer only) · **Owner:** TBD

**Request**
```json
{
  "name": "Alex",
  "license_number": "DL-88213",
  "license_category": "LMV",
  "license_expiry_date": "2028-12-01",
  "contact_number": "9876500000"
}
```

**Response 201:** created driver object. `status` defaults to `"available"`, `safety_score`
defaults to 100, `trips_assigned`/`trips_completed` default to 0.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `drivers` |
| 422 | `license_number` already exists |
| 422 | Missing/invalid required field |

---

### `PUT /api/drivers/{id}`
**Status:** 🔲 · **Auth:** 🔒 (Safety Officer only) · **Owner:** TBD

**Request:** any subset of driver fields (partial update), including `status`.

**Response 200:** updated driver object.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `drivers` |
| 404 | Driver not found |
| 422 | Setting `status` directly to `on_trip` is rejected — only set via trip endpoints |

---

### `DELETE /api/drivers/{id}`
**Status:** 🔲 · **Auth:** 🔒 (Safety Officer only) · **Owner:** TBD

**Response 204:** no content.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `drivers` |
| 404 | Driver not found |
| 422 | Driver has trip history — cannot delete, set status instead |

---

## Trips

### `GET /api/trips`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Query params:** `status` (optional filter)

**Response 200**
```json
[
  {
    "id": 1,
    "trip_code": "TR001",
    "source": "Gandhinagar Depot",
    "destination": "Ahmedabad Hub",
    "vehicle_id": 1,
    "driver_id": 1,
    "cargo_weight_kg": 450,
    "planned_distance_km": 78,
    "actual_distance_km": null,
    "final_odometer_km": null,
    "fuel_consumed_liters": null,
    "revenue_amount": 3500,
    "status": "dispatched",
    "eta": "2026-07-12T15:45:00Z",
    "dispatched_at": "2026-07-12T14:00:00Z",
    "completed_at": null,
    "cancelled_at": null,
    "created_by": 1,
    "created_at": "2026-07-12T13:50:00Z",
    "updated_at": "2026-07-12T14:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `trips` (currently: `fleet_manager`, `financial_analyst`) |

---

### `GET /api/trips/{id}`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200:** single trip object.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role has `none` access to `trips` (currently: `fleet_manager`, `financial_analyst`) |
| 404 | Trip not found |

---

### `POST /api/trips`
**Status:** 🔲 · **Auth:** 🔒 (Dispatcher only) · **Owner:** TBD

**Request**
```json
{
  "source": "Gandhinagar Depot",
  "destination": "Ahmedabad Hub",
  "vehicle_id": 1,
  "driver_id": 1,
  "cargo_weight_kg": 450,
  "planned_distance_km": 78,
  "revenue_amount": 3500
}
```

**Response 201:** created trip object, `status` = `"draft"`, `trip_code` auto-generated.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `trips` |
| 422 | `vehicle_id` or `driver_id` not found |
| 422 | Missing/invalid required field |

**Notes:** creating a trip in `draft` status does **not** yet check capacity, availability, or
license validity — those checks happen at dispatch time (see below), since a draft is just a
plan and its vehicle/driver may not be finalized yet.

---

### `POST /api/trips/{id}/dispatch`
**Status:** 🔲 · **Auth:** 🔒 (Dispatcher only) · **Owner:** TBD

**Request**
```json
{
  "eta": "2026-07-12T15:45:00Z"
}
```

**Response 200:** trip object with `status` = `"dispatched"`, `dispatched_at` set. Also flips
`vehicles.status` and `drivers.status` to `on_trip`, and increments `drivers.trips_assigned`.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `trips` |
| 404 | Trip not found |
| 422 | Trip is not in `draft` status |
| 422 | `cargo_weight_kg` exceeds vehicle's `max_load_capacity_kg` |
| 422 | Vehicle status is not `available` |
| 422 | Driver status is not `available` (including `suspended`) |
| 422 | Driver's `license_expiry_date` has passed |

---

### `POST /api/trips/{id}/complete`
**Status:** 🔲 · **Auth:** 🔒 (Dispatcher only) · **Owner:** TBD

**Request**
```json
{
  "final_odometer_km": 74078,
  "actual_distance_km": 78,
  "fuel_consumed_liters": 9.3,
  "fuel_cost": 850
}
```

**Response 200:** trip object with `status` = `"completed"`, `completed_at` set. Side effects:
- `vehicles.status` → `available`, `vehicles.odometer_km` → `final_odometer_km`
- `drivers.status` → `available`, `drivers.trips_completed` incremented
- New `fuel_logs` row auto-created (`vehicle_id`, `trip_id`, `liters`, `cost`, `log_date` = today)

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `trips` |
| 404 | Trip not found |
| 422 | Trip is not in `dispatched` status |
| 422 | Missing/invalid required field |

---

### `POST /api/trips/{id}/cancel`
**Status:** 🔲 · **Auth:** 🔒 (Dispatcher only) · **Owner:** TBD

**Request:** none (empty body)

**Response 200:** trip object with `status` = `"cancelled"`, `cancelled_at` set. Reverts
`vehicles.status` and `drivers.status` to `available`.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `trips` |
| 404 | Trip not found |
| 422 | Trip is not in `dispatched` status (only dispatched trips can be cancelled) |

---

## Maintenance

### `GET /api/maintenance`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Query params:** `vehicle_id`, `status` (optional filters)

**Response 200**
```json
[
  {
    "id": 1,
    "vehicle_id": 1,
    "service_type": "Oil Change",
    "cost": 2500,
    "service_date": "2026-07-07",
    "status": "active",
    "closed_at": null,
    "created_at": "2026-07-07T09:00:00Z",
    "updated_at": "2026-07-07T09:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `fleet` (currently: `safety_officer`) — maintenance is treated as part of the `fleet` module |

---

### `POST /api/maintenance`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Request**
```json
{
  "vehicle_id": 1,
  "service_type": "Oil Change",
  "cost": 2500,
  "service_date": "2026-07-07"
}
```

**Response 201:** created record, `status` defaults to `"active"`. Side effect:
`vehicles.status` → `in_shop`.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fleet` |
| 422 | `vehicle_id` not found |
| 422 | Vehicle already has an `active` maintenance record open |

---

### `PUT /api/maintenance/{id}`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Request**
```json
{
  "status": "completed"
}
```

**Response 200:** updated record, `closed_at` set when `status` → `"completed"`. Side effect:
`vehicles.status` → `available`, **unless** vehicle's current status is `retired` (stays
`retired`).

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fleet` |
| 404 | Maintenance record not found |
| 422 | Record already `completed` |

---

## Fuel Logs

### `GET /api/fuel-logs`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Query params:** `vehicle_id`, `trip_id` (optional filters)

**Response 200**
```json
[
  {
    "id": 1,
    "vehicle_id": 1,
    "trip_id": null,
    "log_date": "2026-07-05",
    "liters": 42,
    "cost": 3150,
    "created_at": "2026-07-05T08:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `fuel_expenses` (currently: `fleet_manager`, `dispatcher`, `safety_officer` — only `financial_analyst` has access) |

---

### `POST /api/fuel-logs`
**Status:** 🔲 · **Auth:** 🔒 (Financial Analyst only) · **Owner:** TBD

**Request**
```json
{
  "vehicle_id": 1,
  "trip_id": null,
  "log_date": "2026-07-05",
  "liters": 42,
  "cost": 3150
}
```

**Response 201:** created fuel log.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fuel_expenses` |
| 422 | `vehicle_id` not found |

**Notes:** this endpoint is for manual fuel logs unrelated to a trip completion (e.g. a fill-up
between trips). Trip-linked fuel logs are created automatically by `POST
/api/trips/{id}/complete`, not through this endpoint.

---

## Expenses

### `GET /api/expenses`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Query params:** `vehicle_id`, `trip_id` (optional filters)

**Response 200**
```json
[
  {
    "id": 1,
    "trip_id": 1,
    "vehicle_id": 1,
    "toll_amount": 120,
    "other_amount": 0,
    "maintenance_linked_cost": 0,
    "total_amount": 120,
    "expense_date": "2026-07-12",
    "created_at": "2026-07-12T14:00:00Z"
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Caller's role has `none` access to `fuel_expenses` (currently: `fleet_manager`, `dispatcher`, `safety_officer` — only `financial_analyst` has access) |

**Notes:** `total_amount` is computed (`toll_amount + other_amount + maintenance_linked_cost`),
not stored — included in the response for frontend convenience only.

---

### `POST /api/expenses`
**Status:** 🔲 · **Auth:** 🔒 (Financial Analyst only) · **Owner:** TBD

**Request**
```json
{
  "trip_id": 1,
  "vehicle_id": 1,
  "toll_amount": 120,
  "other_amount": 0,
  "expense_date": "2026-07-12"
}
```

**Response 201:** created expense record. `maintenance_linked_cost` is not accepted from the
client — the backend populates it by looking up any `maintenance_logs` tied to the same
`vehicle_id` for the given `expense_date`, if applicable.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `fuel_expenses` |
| 422 | `vehicle_id` not found |

---

## Dashboard & Analytics

### `GET /api/dashboard`
**Status:** ✅ Tested · **Auth:** 🔒 · **Owner:** Antigravity

**Query params:** `vehicle_type`, `status`, `region` (optional filters)

**Response 200**
```json
{
  "active_vehicles": 53,
  "available_vehicles": 42,
  "vehicles_in_maintenance": 5,
  "active_trips": 18,
  "pending_trips": 9,
  "drivers_on_duty": 26,
  "fleet_utilization_percent": 81,
  "recent_trips": [
    {
      "trip_code": "TR001",
      "vehicle_registration_number": "GJ01AB4521",
      "vehicle_name_model": "Ashok Leyland Ecomet",
      "vehicle_type": "Medium Truck",
      "driver_name": "Alex",
      "status": "dispatched",
      "eta": "45 min"
    }
  ],
  "vehicle_status_breakdown": {
    "available": 42,
    "on_trip": 6,
    "in_shop": 5,
    "retired": 0
  }
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |

---

### `GET /api/analytics`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager, Financial Analyst only) · **Owner:** TBD

**Query params:** `from_date`, `to_date` (optional date range filter)

**Response 200**
```json
{
  "fuel_efficiency_km_per_l": 8.4,
  "fleet_utilization_percent": 81,
  "operational_cost": 34070,
  "vehicle_roi_percent": 14.2,
  "monthly_revenue": [
    { "month": "2026-01", "revenue": 45000 },
    { "month": "2026-02", "revenue": 52000 }
  ],
  "top_costliest_vehicles": [
    { "vehicle_id": 2, "registration_number": "TRUCK-11", "total_cost": 42500 },
    { "vehicle_id": 3, "registration_number": "MINI-03", "total_cost": 18200 },
    { "vehicle_id": 1, "registration_number": "VAN-05", "total_cost": 5300 }
  ]
}
```

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `view`/`full` access to `analytics` |

**Notes:** `operational_cost` = Σ `fuel_logs.cost` + Σ `maintenance_logs.cost` only (excludes
tolls/other expenses, per the PS's Operational Cost formula). `vehicle_roi_percent` uses
`revenue_amount` from `trips` — see SCHEMA.MD notes on this field.

---

## Settings

### `GET /api/settings`
**Status:** 🔲 · **Auth:** 🔒 · **Owner:** TBD

**Response 200**
```json
{
  "depot_name": "Gandhinagar Depot GJ",
  "currency": "INR",
  "distance_unit": "Kilometers"
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |

---

### `PUT /api/settings`
**Status:** 🔲 · **Auth:** 🔒 (Fleet Manager only) · **Owner:** TBD

**Request:** any subset of `depot_name`, `currency`, `distance_unit`.

**Response 200:** updated settings object.

**Errors**
| Status | Condition |
|---|---|
| 403 | Caller's role lacks `full` access to `settings` (Only Fleet Manager allowed) |
| 422 | Invalid field value |

---

## Changelog

Every deviation from this contract during implementation must be logged here, not
silently implemented.

| Date | Endpoint | Change | Changed By |
|---|---|---|---|
| 2026-07-12 | `GET /api/dashboard` | Corrected mock JSON: changed vehicle_registration_number from name_model to actual registration string, and changed trip status from `on_trip` to `dispatched` to align with DB schema. | Antigravity |
| 2026-07-12 | `GET /api/dashboard` | Added `vehicle_name_model` to payload for better UI readability; Updated vehicle filtering to dynamically search both `type` and `name_model` using OR condition. | Antigravity |
| 2026-07-12 | `GET /api/dashboard` | Added `vehicle_type` to payload to format the frontend dashboard table accurately. | Antigravity |