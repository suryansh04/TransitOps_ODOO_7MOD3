# Hackathon Project Context

## Reference Documents — read these before writing any backend or frontend code

This repo has two source-of-truth documents at the root. AI tools and contributors must read
the relevant one before generating code that touches the database or the API — do not invent
field names, endpoint paths, status values, or role restrictions from memory or by guessing.

- **`SCHEMA.MD`** — the full database schema. Defines every table, column, type, constraint,
  enum/status value, FK relationship, the RBAC permission matrix, and which business rule is
  enforced where. Read this before writing any SQLAlchemy model (`models/`), Alembic
  migration, repository (`repositories/`), or Pydantic schema (`schemas/`). Every
  model/schema field name must match this file exactly — no renaming, no inventing extra
  fields, no dropping fields you think are unnecessary.

- **`CONTRACTS.MD`** — the full API contract. Defines every endpoint's method, path, auth
  requirement, role restriction, request/response JSON shape, and error conditions. Read this
  before writing any controller/route (`controllers/`), or any frontend API call in
  `lib/api.ts` / a hook in `hooks/`. Frontend TypeScript types in `types/` must match the
  response shapes here exactly (hand-written, not OpenAPI-generated, but still
  contract-accurate per the existing rule below).

**Rule for both files:** if what you're building needs to differ from what's written in
`SCHEMA.MD` or `CONTRACTS.MD`, update the relevant file to match what you actually built and
log it in `CONTRACTS.MD`'s Changelog table — don't silently implement something different from
the contract and move on.

**Status markers in `CONTRACTS.MD`** (🔲 Planned · 🟡 Implemented · ✅ Tested) must be updated by
whoever implements an endpoint, so the team always knows what's actually built vs. still
planned. Same goes for the `Owner` column — claim an endpoint by putting your name in before
you start it, so two people don't build the same one.

---

## Stack

- Frontend: React + TypeScript + shadcn/ui + Vite
- Backend: FastAPI + PostgreSQL + SQLAlchemy + Alembic

## Architecture (Backend) — Repository-Service-Controller

Flow: controller → service → repository → database

- `models/` — SQLAlchemy ORM models only, fields must match `SCHEMA.MD` exactly
- `schemas/` — Pydantic request/response DTOs, never expose models directly, shapes must
  match `CONTRACTS.MD` exactly
- `repositories/` — DB access ONLY, no business logic, no validation
- `services/` — business logic, calls repositories, raises domain errors, enforces the
  business rules and RBAC access levels defined in `SCHEMA.MD` / `CONTRACTS.MD`
- `controllers/` — FastAPI routers, thin — just request/response + calling services
- Never let a controller query the DB directly
- Never put business logic in a repository

## Architecture (Frontend)

- `components/ui/` — shadcn-generated, don't hand-edit
- `components/shared/` — our own reusable components
- `pages/` — one file per route
- `hooks/` — custom hooks wrapping API calls (useItems, useUsers, etc.)
- `lib/api.ts` — single place for axios config, no inline fetch() in components, use axios for API calls
- `types/` — TS interfaces mirroring backend Pydantic schemas (write by hand, keep simple,
  fields/shapes must match `CONTRACTS.MD`)
- Routing via `react-router-dom`, routes defined in one place (e.g. `App.tsx`) — keep the frontend simple, don't overcomplicate structure/state management for a hackathon timeline

## Component Usage (Frontend) — STRICT: shadcn only, no custom AI-generated UI

- Default theme is **strictly shadcn's default light theme** — white background, default shadcn colors/spacing/radius. **ABSOLUTELY NO CUSTOM COLORS** (no custom oranges, yellows, gradients, etc.). Everything must use default tailwind utility colors aligned with shadcn (e.g., bg-white, bg-muted, text-foreground).
- Every visible UI element (buttons, inputs, cards, dialogs, dropdowns, tables, forms,
  toasts, avatars, badges, etc.) must be built using an actual installed shadcn
  component (`npx shadcn@latest add <component>`) — not a hand-styled `<div>`/`<button>`
  built with raw Tailwind classes to "look like" a shadcn component
- **STRICT IMPORT RULE**: All `import` statements in any file (React, Python, etc.) MUST be placed strictly at the very top of the file along with the other imports. Do not scatter imports throughout the file or place them just above component definitions.
- The `lucide-react` icon library must be used for all icons. Do not use standard emojis or raw SVGs unless an icon doesn't exist.
- **AI coding tools/agents are NOT allowed to invent their own UI design** (custom
  gradients, custom card layouts, custom color schemes, custom shadows/animations)
  when asked to build a page or form — they must compose the page purely out of
  installed shadcn components in their default appearance
- **Charts & Data Visualization:** For the Reports & Analytics page and any other graphs, you MUST use the official shadcn `chart` component (`npx shadcn@latest add chart`). Do not install `recharts` manually or use other charting libraries like Chart.js.
- If a needed component isn't installed, install it — don't recreate it by hand,
  and don't restyle it away from the shadcn default look
- Only exception: layout/spacing (flex/grid, margin, padding, page structure) can use
  plain Tailwind — visual styling of individual components (colors, borders, shadows,
  gradients, radius) must come from shadcn defaults, not custom classes
- If an AI tool generates a page with custom-styled elements instead of shadcn
  components, reject the output and re-prompt it to rebuild using only shadcn
  components in their default light theme
- Keep hand-edits to generated `components/ui/` files to a minimum — if a shadcn
  component needs real customization, prefer wrapping it in `components/shared/`
  over editing the generated file directly, and even then don't override the
  default light theme
- If a button, icon, or any interactive element has functionality, it MUST have a pointer cursor on hover (use the `cursor-pointer` class if not already provided by the component).

## API Contracts — source of truth

- Every endpoint must be defined in `CONTRACTS.MD` BEFORE implementation starts
- Backend schemas (`schemas/`) and frontend types (`types/`) must exactly match the
  request/response shape already defined in `CONTRACTS.MD` — field names, types, and
  structure come from the contract, not invented independently while coding
- If AI tools generate a schema/type that doesn't match `CONTRACTS.MD`, either fix the
  code to match the contract, or update the contract + notify the team (per the rule
  above) — don't let code and contract silently diverge
- Format: method + path, request shape, response shape, error cases, role/auth restriction
- Frontend can build against the contract before backend implementation is done
- If the actual implementation needs to differ from `CONTRACTS.MD` (e.g. a field name
  or response shape changes), the person making the change must:
  1. Update `CONTRACTS.MD` to match what was actually built
  2. Log it in `CONTRACTS.MD`'s Changelog table
  3. Tell the team (group chat) exactly what changed, e.g. "changed `item.qty` to
     `item.quantity` in GET /items response"
- Never let `CONTRACTS.MD` silently go stale — it should always reflect the real API

## RBAC — source of truth

- The permission matrix (which of the 4 roles gets `none`/`view`/`full` access to each
  module) lives in `SCHEMA.MD`'s `role_permissions` table and is mirrored per-endpoint in
  `CONTRACTS.MD`
- Every endpoint's service-layer logic must enforce the access level shown for it in
  `CONTRACTS.MD` — GET endpoints must reject roles with `none` access to that module, not
  just check "is logged in"
- If a permission requirement isn't specified for something you're building (check
  `CONTRACTS.MD` for a ⚠️ **Unresolved** flag), ask the team before guessing a restriction

## Validation (Backend)

- All input validation happens via Pydantic validators in `schemas/`, not in controllers
- Every schema field with constraints (non-empty, positive number, valid email, etc.) needs an explicit `field_validator`
- No endpoint should accept unvalidated raw dicts

## Validation (Frontend)

- Validate user input on the frontend BEFORE sending it to the API — don't rely on the
  backend's 400 response as the only feedback
- Every form field with constraints (required, min/max length, number range, email
  format, etc.) must show an inline error message next to that field, not just a
  generic "something went wrong" toast
- Error messages must be meaningful and specific to what's wrong, e.g.:
  - Good: "Quantity must be 0 or greater"
  - Good: "Name is required"
  - Bad: "Invalid input"
  - Bad: "Error"
- When the backend returns a `400`/`422` with `{ "detail": "message" }`, surface that
  exact message to the user (don't swallow it or replace it with a generic one) —
  this keeps frontend and backend errors consistent for the user
- Disable the submit button (or show a loading state) while a request is in-flight to
  prevent duplicate submissions

## Data

- No static/mock JSON in the final submission — must query real Postgres
- Static JSON is fine ONLY for early prototyping, must be replaced before submission
- Use `backend/app/seed.py` to seed identical fake test data on every machine — run `python -m app.seed` after setup. Seed data should reflect the tables/fields in `SCHEMA.MD`, including the `role_permissions` seed rows
- Alembic migrations required for every schema change — no manual DB edits, no `Base.metadata.create_all`

## Alembic Flow

### If you CREATE or CHANGE a model (new table, new column, etc.)

1. Update `SCHEMA.MD` first if the change isn't already reflected there
2. Edit/add your model in `app/models/`
3. Make sure it's imported in `app/models/__init__.py` (Alembic won't see it otherwise)
4. Generate the migration:
   ```
   alembic revision --autogenerate -m "short description, e.g. add item table"
   ```
5. Open the new file in `alembic/versions/` and sanity-check it — confirm it has the
   table/column you expect, nothing unexpected got dropped
6. Apply it to your own local DB:
   ```
   alembic upgrade head
   ```
7. Confirm it worked (`psql -U postgres -d hackdb` then `\dt` or `\d tablename`)
8. Commit BOTH the model change and the new migration file in `alembic/versions/`
   together in the same commit
9. Push

### If you PULL new code from GitHub

1. `git pull`
2. Check if anything changed under `alembic/versions/` — if yes, run:
   ```
   alembic upgrade head
   ```
3. That's it — your local DB now matches the new models, no data loss, no manual SQL

### Rules

- Never edit the DB schema manually (no manual `ALTER TABLE` in psql) — always go through a migration
- Never skip step 5 (checking the generated file) — autogenerate can occasionally miss renames or get confused
- If `alembic upgrade head` errors out for you locally and not for others, don't panic-edit the DB —
  ask in the group chat first, usually it's a missed `git pull` or a model not imported in `__init__.py`

## Testing Endpoints Before Integration

- Test every new endpoint in `/docs` (Swagger UI) before telling frontend it's ready
- A controller is not "done" until it's been hit at least once outside unit code
- Update the endpoint's status marker in `CONTRACTS.MD` (🔲 → 🟡 → ✅) as you go

## Conventions

- Naming: snake_case (Python), camelCase (TS), PascalCase (React components/types)
- Every new feature = model → schema → repository → service → controller (backend) or type → hook → component → page (frontend)
- All new endpoints get a Pydantic response_model, no raw dict returns
- Env vars via `.env` + `config.py`, never hardcoded
- Consistent error shape across all endpoints: `{ "detail": "message" }` (FastAPI default) — don't invent custom error formats per route

## Git

- Every person commits under their own name/email (`git config user.name` / `user.email` set correctly on each machine)
- Commit messages: `feat:`, `fix:`, `refactor:`, `chore:` prefixes
- Merge to `main` via PR, not direct push — even if self-approved, keeps history clean and attributable
- Small, frequent commits > one giant commit at the end
- Pull `main` before starting a new feature to avoid large conflicts later

## Do NOT

- Don't use static/mock JSON in final submission
- Don't add new folders outside this structure without team agreement
- Don't install new packages without updating `requirements.txt` / `package.json`
- Don't push directly to `main`
- Don't leave endpoints unvalidated or untested before merging
- Don't let `CONTRACTS.MD` or `SCHEMA.MD` go out of sync with the real API/database
- Don't let a form submit without frontend validation and a meaningful error message
- Don't hand-build a UI element from scratch when a shadcn component already covers it — install it instead
- Don't let an AI tool invent custom UI design (dark themes, gradients, custom-styled elements) — shadcn components in default light theme only, no exceptions without full team agreement
- Don't invent a field name, endpoint path, or role restriction that isn't in `SCHEMA.MD` / `CONTRACTS.MD` — update those files first, then code to match