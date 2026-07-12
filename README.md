<div align="center">
  <img src="frontend/src/assets/logo.png" alt="TransitOps Logo" width="120" />
  <h1>TransitOps</h1>
  <p><strong>Smart Transport Operations Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791.svg)](https://www.postgresql.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
  [![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000.svg)](https://ui.shadcn.com/)
</div>

<br />

TransitOps is a centralized, professional-grade platform designed to manage the complete lifecycle of transport operations. From vehicle registration and driver management to live dispatching, maintenance logs, fuel tracking, and business analytics, TransitOps unifies your entire fleet into one powerful dashboard. 

## ✨ Key Features

- 🚛 **Fleet & Driver Management:** Complete registry for vehicles and drivers with real-time status tracking.
- 🗺️ **Live Trip Dispatching:** Seamless lifecycle management from Draft → Dispatched → Completed.
- ⚙️ **Automated Workflows:** Dispatching automatically marks drivers and vehicles as `on_trip`. Completion calculates ROI and creates fuel logs.
- 📊 **Rich Analytics:** High-performance aggregation providing fuel efficiency, fleet utilization, and operational costs.
- 🛡️ **Role-Based Access Control (RBAC):** Strict permissions matrix isolating functionality by role (Dispatcher, Fleet Manager, Safety Officer, Financial Analyst).

---

## 🏗️ Architecture

The platform follows a modern decoupled architecture:

```mermaid
graph TD
    Client[React/Vite Frontend] -->|REST API + JWT| API[FastAPI Backend]
    API -->|SQLAlchemy ORM| DB[(PostgreSQL)]
    
    subgraph Frontend [Frontend Architecture]
        Auth[Auth Context]
        Components[shadcn/ui Components]
        Pages[Dashboard, Fleet, Trips, etc.]
    end
    
    subgraph Backend [Backend Architecture]
        Controllers[API Routers]
        Services[Business Logic & RBAC]
        Models[Pydantic & SQLAlchemy Models]
    end
```

---

## 🛠️ Installation & Setup

### 1. Backend Configuration (FastAPI)

Ensure you have **Python 3.9+** and **PostgreSQL** installed.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure Environment Variables
# Create a .env file with your database credentials:
echo "DATABASE_URL=postgresql://user:password@localhost:5432/hackdb" > .env
echo "JWT_SECRET=super-secret-key-change-it-in-production" >> .env

# 5. Set up the Database Schema
alembic upgrade head

# 6. Seed the Database (Populates test users, vehicles, and trips)
python -m app.seed --reset --rich-data

# 7. Start the Server
uvicorn app.main:app --reload
```
*API runs at [http://localhost:8000](http://localhost:8000). Swagger UI: `http://localhost:8000/docs`.*

### 2. Frontend Configuration (React + Vite)

Ensure you have **Node.js 18+** installed.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
echo "VITE_API_URL=http://localhost:8000" > .env

# 4. Start the Application
npm run dev
```
*Frontend runs at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Demo Accounts

Use these pre-seeded accounts to explore the RBAC capabilities (Password for all: `password123`):

| Role | Email | Module Access |
|------|-------|---------------|
| **Fleet Manager** | `fleet@transitops.in` | Full access to Fleet & Settings |
| **Dispatcher** | `raven@transitops.in` | Full access to Trips & Dashboards |
| **Safety Officer** | `safety@transitops.in` | Full access to Drivers |
| **Financial Analyst** | `finance@transitops.in` | Full access to Fuel, Expenses & Analytics |

---

## 🗄️ Database Schema

The system uses a strictly typed, normalized relational model:

- `users`: Authentication, hashed passwords, and roles.
- `vehicles`: Fleet assets (`capacity`, `odometer`, `status`: available/on_trip/in_shop/retired).
- `drivers`: Driver profiles, licenses, and safety scores.
- `trips`: The core operational entity linking a vehicle and driver to a route.
- `maintenance_logs`: Service records and costs.
- `fuel_logs` & `expenses`: Tracks operational expenditures linked to trips/vehicles.
- `role_permissions`: A central matrix mapping roles to module access levels.

---

## 📡 API Endpoints

The RESTful API is structured into modular routers:

- **Auth** (`/api/auth`): `/login`, `/me`
- **Fleet** (`/api/vehicles`, `/api/drivers`): CRUD with strict Pydantic validation.
- **Operations** (`/api/trips`, `/api/maintenance`, `/api/fuel-logs`, `/api/expenses`): Manages the state machine of active transport operations.
- **Analytics** (`/api/dashboard`, `/api/analytics`): Highly optimized aggregation pipelines for frontend charts.

---
<div align="center">
  <i>Built for modern transport management.</i>
</div>
