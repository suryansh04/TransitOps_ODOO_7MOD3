# TransitOps — Smart Transport Operations Platform

A centralized platform that allows organizations to manage the complete lifecycle of their transport operations—from vehicle registration and driver management to dispatching, maintenance, fuel logging, and analytics. Built for an 8-hour hackathon.

## Documentation Reference
Before writing any code, please ensure you review the core documentation files that govern the architecture and business rules of this project:

- **[`HACKATHON.md`](./HACKATHON.md)**: Rules, architecture layout, and UI constraints (strict `shadcn/ui` usage).
- **[`SCHEMA.MD`](./SCHEMA.MD)**: Database schema, enumerations, relationships, and the central RBAC matrix.
- **[`CONTRACTS.md`](./CONTRACTS.md)**: The strict API contract for all endpoints, including request/response bodies and status codes.
- **[`implementation.md`](./implementation.md)**: Step-by-step roadmap for implementing the backend, frontend, and specific UI component logic.
- **[`RBAC_RULES.md`](./RBAC_RULES.md)**: A quick-reference guide for role responsibilities and module access levels.

## Tech Stack
*   **Frontend:** React, TypeScript, Vite, `shadcn/ui`, Tailwind CSS, `shadcn charts`
*   **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic

## Getting Started

Follow these simple steps to set up the TransitOps platform locally.

### 1. Backend Setup (FastAPI)

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

Create a virtual environment to store Python dependencies:
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Seed the database with initial dummy data (Test Users, Trucks, Drivers, and Trips):
```bash
# Ensure you are inside the backend directory and the venv is activated
python -m app.seed
```

Start the FastAPI backend server:
```bash
uvicorn app.main:app --reload
```
*The backend will now be running at `http://localhost:8000`.*

---

### 2. Frontend Setup (React + Vite)

Open a **new** terminal and navigate to the `frontend` folder:
```bash
cd frontend
```

Install the required Node.js dependencies:
```bash
npm install
```

Create an environment file:
1. Create a file named `.env` in the `frontend` folder.
2. Add the following line so the frontend knows where the backend is:
```env
VITE_API_URL=http://localhost:8000
```

Start the React frontend server:
```bash
npm run dev
```
*The frontend will now be running (usually at `http://localhost:5173`).*

### 3. Log In

You can now open the frontend link in your browser and log in using any of the pre-seeded accounts:
- **Fleet Manager:** `fleet@transitops.in` (Password: `password123`)
- **Dispatcher:** `raven@transitops.in` (Password: `password123`)
- **Safety Officer:** `safety@transitops.in` (Password: `password123`)
