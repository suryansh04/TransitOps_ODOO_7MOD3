# TransitOps — Smart Transport Operations Platform

A centralized, professional-grade platform designed to manage the complete lifecycle of transport operations. From vehicle registration and driver management to live dispatching, maintenance logs, fuel tracking, and business analytics, TransitOps unifies your entire fleet in one powerful dashboard.

## 🚀 Tech Stack

**Frontend:**
- React 18, TypeScript, Vite
- UI Components: shadcn/ui (Tailwind CSS, Radix UI)
- Routing: React Router
- Data Fetching: Axios

**Backend:**
- Framework: FastAPI (Python 3)
- Database: PostgreSQL
- ORM: SQLAlchemy
- Migrations: Alembic
- Auth: JWT (JSON Web Tokens)

---

## 🛠️ Installation & Setup

### 1. Backend Setup

Ensure you have Python 3.9+ and PostgreSQL installed.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure Environment Variables
# Create a .env file in the backend directory with your credentials:
echo "DATABASE_URL=postgresql://user:password@localhost:5432/hackdb" > .env
echo "JWT_SECRET=super-secret-key-change-it-in-production" >> .env

# 5. Set up the Database
# Ensure PostgreSQL is running and your database matches the DATABASE_URL.
alembic upgrade head

# 6. Seed the database with rich test data (deterministic data for consistent testing)
python -m app.seed --reset --rich-data

# 7. Run the FastAPI server
uvicorn app.main:app --reload
```
*The backend will be available at [http://localhost:8000](http://localhost:8000). API documentation is available at `http://localhost:8000/docs`.*

### 2. Frontend Setup

Ensure you have Node.js 18+ installed.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
# Create a .env file in the frontend root:
echo VITE_API_URL=http://localhost:8000 > .env

# 4. Start the development server
npm run dev
```
*The frontend will be available at [http://localhost:5173](http://localhost:5173).*

### 3. Demo Accounts

Log in using any of the seeded RBAC accounts:
- **Fleet Manager**: `fleet@transitops.in` (Pass: `password123`)
- **Dispatcher**: `raven@transitops.in` (Pass: `password123`)
- **Safety Officer**: `safety@transitops.in` (Pass: `password123`)
- **Financial Analyst**: `finance@transitops.in` (Pass: `password123`)

---

## 🗄️ Database Schema Overview

TransitOps uses a strictly typed, normalized relational PostgreSQL database. 

### Core Entities:
- **`users`**: Manages authentication, hashed passwords, and RBAC roles (`fleet_manager`, `dispatcher`, etc.).
- **`vehicles`**: Stores fleet assets (`type`, `capacity`, `odometer`, `status`: available, on_trip, in_shop, retired).
- **`drivers`**: Manages driver profiles, license details, and status.
- **`trips`**: Core operational entity linking a `vehicle` and `driver` to a route (`source`, `destination`, `status`).
- **`maintenance_logs`**: Service records for vehicles (`cost`, `service_type`).
- **`fuel_logs` & `expenses`**: Tracks operational expenditures (`liters`, `cost`, `toll_amount`) linked to specific trips and vehicles.
- **`role_permissions`**: A central matrix mapping roles to module access levels (`none`, `view`, `full`).

---

## 📡 API Architecture

The backend exposes a RESTful API powered by FastAPI, featuring automatic OpenAPI documentation.

### Key Endpoint Groupings:
- **Auth (`/api/auth`)**:
  - `POST /login`: Authenticates user and returns a JWT token.
  - `GET /me`: Returns the current user's profile and resolved RBAC permissions.
- **Fleet Management (`/api/vehicles`, `/api/drivers`)**:
  - `GET`, `POST`, `PUT`, `DELETE` operations for registering and updating vehicles and drivers. Strict validation via Pydantic.
- **Operations (`/api/trips`, `/api/maintenance`, `/api/fuel-logs`, `/api/expenses`)**:
  - Manages the lifecycle of a trip (Draft -> Dispatched -> Completed). Automates state transitions (e.g., dispatching a trip safely sets the driver and vehicle to `on_trip`).
- **Dashboard & Analytics (`/api/dashboard`, `/api/analytics`)**:
  - High-performance aggregation endpoints providing optimized KPIs, fuel efficiency metrics, and financial cost data for charts.

---

## 🔐 Role-Based Access Control (RBAC)

TransitOps enforces strict RBAC at both the API layer (via FastAPI dependencies) and the UI layer (via route guards and conditional rendering).
- **Fleet Manager**: Full write access to Vehicles and Settings.
- **Dispatcher**: Full write access to Trips and Dashboards.
- **Safety Officer**: Full write access to Drivers and compliance data.
- **Financial Analyst**: Full write access to Fuel, Expenses, and Analytics.
