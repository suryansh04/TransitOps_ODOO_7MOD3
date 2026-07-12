# TransitOps Implementation Plan

This document outlines a step-by-step plan to build the TransitOps platform for the hackathon. It strictly follows the rules laid out in `HACKATHON.md`, the database structure in `SCHEMA.md`, and the API definitions in `CONTRACTS.md`. The design will precisely match the provided mockups using only standard `shadcn/ui` components in their default light theme.

## 1. Setup & Initial Configuration
**Goal:** Ensure the foundation is ready for both frontend and backend development.

*   **Backend Setup:**
    *   Verify the FastAPI project structure (`models`, `schemas`, `repositories`, `services`, `controllers`).
    *   Ensure PostgreSQL is connected.
    *   Configure Alembic for migrations.
*   **Frontend Setup:**
    *   Verify the React + TypeScript + Vite project.
    *   Ensure `react-router-dom` is ready.
    *   Ensure `shadcn/ui` is initialized with the default light theme.
    *   Set up Axios in `lib/api.ts` for clean API calls.

## 2. Database Models & Migrations (Backend)
**Goal:** Create the database tables exactly as defined in `SCHEMA.md`.

*   Create SQLAlchemy models in `app/models/` for:
    *   `Users`
    *   `Vehicles`
    *   `Drivers`
    *   `Trips`
    *   `MaintenanceLogs`
    *   `FuelLogs`
    *   `Expenses`
    *   `RolePermissions`
    *   `OrgSettings`
*   Run Alembic to generate and apply migrations (`alembic revision --autogenerate`, `alembic upgrade head`).
*   Create a seed script to populate initial mock data and role permissions.

## 3. API & Business Logic (Backend)
**Goal:** Build the endpoints according to `CONTRACTS.md` and enforce the business rules.

*   **Schemas (Pydantic):** Create strict request/response schemas matching `CONTRACTS.md` to validate all inputs.
*   **Repositories:** Write simple CRUD operations for each model. Keep business logic out of here.
*   **Services (Business Logic):** Implement the core rules:
    *   *Dispatching:* Validate vehicle capacity, ensure vehicle and driver are `available`, and enforce active licenses. Change vehicle/driver status to `on_trip` when a trip is dispatched.
    *   *Completion:* Revert status to `available`, update vehicle odometer, and automatically generate a Fuel Log.
    *   *Maintenance:* Automatically change vehicle status to `in_shop` when active, and restore to `available` when closed.
*   **Controllers (FastAPI):** Expose the endpoints, hook up the services, and enforce Role-Based Access Control (RBAC) checking the user's role against the required permissions.

## 4. Frontend Routing & Layout
**Goal:** Build the skeleton of the application.

*   **Routing:** Define routes in `App.tsx` for `/login`, `/`, `/fleet`, `/drivers`, `/trips`, `/maintenance`, `/fuel-expenses`, `/analytics`, and `/settings`.
*   **Layout Component:** Build the persistent sidebar navigation (Dashboard, Fleet, Drivers, Trips, etc.) and a top bar. Use standard `shadcn` components like `Sidebar` or a simple flex container if not available.
*   **Auth Context:** Create a React Context to store the current user and their JWT token, and protect routes based on login status.

## 5. Frontend Pages & Features (UI Detailed Breakdown)
**Goal:** Implement the UI for each module mapping exactly to the provided mockups, strictly utilizing `shadcn/ui` components (Tables, Cards, Inputs, Buttons, Dialogs, Selects, etc.) in their default light theme.

### 5.1 Layout & Navigation (Common)
*   **Header:** Features a search `Input` on the left, and on the right, user profile `DropdownMenu` (with avatar or initials) and a primary "Dispatch Trip" `Button`.
*   **Sidebar:** Left navigation pane with standard styling containing links (using `react-router-dom`) with an active state highlight for: Dashboard, Fleet, Drivers, Trips, Maintenance, Fuel & Expenses, Analytics, Settings.

### 5.2 Authentication (0. RBAC - Login)
*   **Layout:** Split-screen layout. 
    *   **Left panel:** Dark gray background (e.g., `#1f2937`) featuring a yellow square logo with dots. Text includes "TransitOps" and "Smart Transport Operations Platform". Below is a bulleted list: "One login, four roles:" with yellow dots mapping roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst). Footer left: "TransitOps © 2026 - RBAC Mode".
    *   **Right panel:** The main sign-in form with a white background. Title: "Sign in to your account", Subtitle: "Enter your credentials to continue".
*   **Form Components:** 
    *   `Input` for "EMAIL" (placeholder: `raven@transitops.in`).
    *   `Input` (type password) for "PASSWORD" (placeholder: `********`).
    *   `Select` for "ROLE (RBAC)" showing options like 'Dispatcher'.
    *   `Checkbox` with "Remember me" label, and a "Forgot password?" link.
    *   `Button` for "Sign In" (yellow colored, e.g., `bg-yellow-500`).
*   **Info Text & Errors:** 
    *   Text below form: "Access is scoped by role after login: Fleet Manager -> Fleet, Maintenance | Dispatcher -> Dashboard, Trips | Safety Officer -> Drivers, Compliance | Financial Analyst -> Fuel & Expenses, Analytics".
    *   Error state: Display "Invalid credentials" or "Account locked after 5 failed attempts" in red text or a destructive `Alert`.

### 5.3 Dashboard (1. Dashboard)
*   **Layout & Navigation:** 
    *   Sidebar indicating active state on "Dashboard".
    *   Top Header includes a Search `Input` ("Search..."), user profile ("Raven K."), and a "Dispatch Trip" `Button`.
*   **Filters:** Top row containing three `Select` components ("Vehicle Type: All", "Status: All", "Region: All").
*   **KPI Cards:** A horizontal row of simple `Card` components with large numbers: "ACTIVE VEHICLES 53", "AVAILABLE VEHICLES 42", "VEHICLES IN MAINTENANCE 05", "ACTIVE TRIPS 18", "PENDING TRIPS 09", "DRIVERS ON DUTY 26", and "FLEET UTILIZATION 81%".
*   **Main Content Split:**
    *   **Recent Trips (Left):** A `Table` displaying columns: TRIP, VEHICLE, DRIVER, STATUS, ETA. Status uses colored `Badge` components: Blue ("On Trip", "Dispatched"), Green ("Completed"), Gray ("Draft").
    *   **Vehicle Status (Right):** A visual breakdown using colored bars/progress components: Available (Green), On Trip (Blue), In Shop (Orange), Retired (Red).

### 5.4 Vehicle Registry (2. Vehicle Registry)
*   **Top Bar:** Contains `Select` components for "Type: All" and "Status: All", a search `Input` ("Search reg. no..."), and a yellow "+ Add Vehicle" `Button`.
*   **Data Table:** A `Table` listing vehicles with columns: REG. NO. (UNIQUE), NAME/MODE, TYPE, CAPACITY, ODOMETER, ACQ. COST, STATUS. Statuses use `Badge` components: Green (Available), Blue (On Trip), Orange (In Shop), Red (Retired).
*   **Helper Text:** Red text below the table: "Rule: Registration No. must be unique - Retired/In Shop vehicles are hidden from Trip Dispatcher".

### 5.5 Drivers & Safety Profiles (3. Drivers & Safety Profiles)
*   **Top Bar:** Contains a search `Input` and a yellow "+ Add Driver" `Button`.
*   **Data Table:** A `Table` listing drivers with columns: DRIVER, LICENSE NO, CATEGORY, EXPIRY, CONTACT, TRIP COMPL, SAFETY, STATUS. The Expiry column highlights "EXPIRED" if applicable. Status uses `Badge` components (Green: Available, Orange: Suspended, Blue: On Trip, Gray: Off Duty).
*   **Status Toggles:** Clickable `Badge` components below the table for quick filtering: Available (Green), On Trip (Blue), Off Duty (Gray), Suspended (Orange).
*   **Helper Text:** Red text below toggles: "Rule: Expired license or Suspended status -> blocked from trip assignment".

### 5.6 Trip Dispatcher (4. Trip Dispatcher)
*   **Layout:** Two-column split view (Create Trip vs. Live Board).
*   **Create Trip Form (Left):**
    *   **Stepper:** "TRIP LIFECYCLE" indicator at top (Draft [Green], Dispatched [Blue outline], Completed [Gray], Cancelled [Gray]).
    *   **Inputs:** `Input` for SOURCE, DESTINATION, CARGO WEIGHT (KG), PLANNED DISTANCE (KM).
    *   **Selects:** `Select` for VEHICLE (AVAILABLE ONLY) showing capacity, and DRIVER (AVAILABLE ONLY).
    *   **Validation Alerts:** An `Alert` (destructive) that appears if Cargo Weight > Vehicle Capacity (e.g., "Vehicle Capacity: 500 kg. Cargo Weight: 700 kg. X Capacity exceeded by 200 kg -> dispatch blocked").
    *   **Actions:** `Button` for "Dispatch (Standard)" (disabled styling if error) and `Button` for "Cancel" (gray).
*   **Live Board (Right):** A vertical stack of `Card` components representing trips. Each card shows: Trip ID, Vehicle/Driver, Source -> Destination, Status `Badge` (Blue for Dispatched, Gray for Draft, Red for Cancelled), and ETA/Status text (e.g., "Awaiting driver", "Vehicle sent to shop"). Footer text: "On complete: odometer & fuel log -> expenses -> vehicle & driver available".

### 5.7 Maintenance (5. Maintenance)
*   **Layout:** Two-column view.
*   **Log Service Record (Left):**
    *   Form containing: `Input` for VEHICLE (e.g., VAN-05), `Input` for SERVICE TYP (e.g., Oil Change), `Input` for COST, `Input` for DATE, and `Input`/`Select` for STATUS.
    *   Yellow "Save" `Button`.
    *   Helper text visually indicating transitions with arrows: "Available -> In Shop", "In Shop -> Available". Note: "In Shop vehicles are removed from the dispatch pool".
*   **Service Log Table (Right):** A `Table` listing history with columns: VEHICLE, SERVICE, COST, STATUS (Orange for In Shop, Green for Completed).

### 5.8 Fuel & Expense Management (6. Fuel & Expense Management)
*   **Top Action Bar:** Search `Input`, yellow "+ Log Fuel" `Button`, and "+ Add Expense" `Button`.
*   **Fuel Logs Table:** A `Table` displaying VEHICLE, DATE, LITERS, and FUEL COST.
*   **Other Expenses Table:** A `Table` below displaying TRIP, VEHICLE, TOLL, OTHER, MAINT (LINKED), TOTAL, STATUS (Green `Badge` for Available/Completed).
*   **Total Bar:** Text at the bottom right calculating "TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINT" (e.g., 34,070 in yellow).

### 5.9 Reports & Analytics (7. Reports & Analytics)
*   **KPI Cards:** A top row of `Card` components for metrics: "FUEL EFFICIENCY 8.4 km/l", "FLEET UTILIZATION 81%", "OPERATIONAL COST 34,070", and "VEHICLE ROI 14.2%". Formula text below: "ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost".
*   **Charts:**
    *   **Monthly Revenue (Left):** A blue bar chart (`BarChart` from `recharts`).
    *   **Top Costliest Vehicles (Right):** A horizontal bar chart component showing relative costs (e.g., Red for TRUCK-11, Orange for MINI-03, Gray for VAN-05).

### 5.10 Settings & RBAC (8. Settings & RBAC)
*   **Layout:** Two-column split layout.
*   **General Settings (Left):** Form utilizing `Input` for DEPOT NAME, CURRENCY, and DISTANCE UNIT, with a blue "Save changes" `Button`.
*   **Role-Based Access (RBAC) (Right):** A static `Table` displaying roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) on the Y-axis and modules (FLEET, DRIVERS, TRIPS, FUEL/EXP, ANALYTICS) on the X-axis. Cells use a checkmark `✓`, `view`, or `-` to indicate permissions.

## 6. Testing & Polish
**Goal:** Ensure everything works together smoothly.

*   Test the full trip lifecycle: Draft -> Dispatched -> Completed. Verify that driver and vehicle statuses update correctly on the backend and are reflected on the frontend.
*   Verify RBAC: Ensure a user logged in as a "Dispatcher" cannot edit "Fleet" items, and that the UI hides/disables these actions.
*   Ensure all forms display meaningful inline validation errors from the backend.
*   Confirm the entire UI uses the default light theme without custom CSS overrides for standard components.
