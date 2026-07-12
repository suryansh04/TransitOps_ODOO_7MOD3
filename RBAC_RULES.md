# Role-Based Access Control (RBAC) Rules

This document outlines the strict permissions associated with each role in the TransitOps platform. This is to be used as a quick reference by all developers and AI agents.

## Roles & Responsibilities

1. **Fleet Manager:** Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency.
2. **Dispatcher:** Creates trips, assigns vehicles and drivers, and monitors active deliveries. *(Note: Sometimes referred to as "Driver" in earlier specs).*
3. **Safety Officer:** Ensures driver compliance, tracks license validity, and monitors safety scores.
4. **Financial Analyst:** Reviews operational expenses, fuel consumption, maintenance costs, and profitability.

## Permission Matrix

The application uses three access levels that dictate what a user can do within each module:
*   `full` (✓): Can view, create, edit, and delete (or change status).
*   `view`: Can only read data (GET requests).
*   `none` (-): No access to the module.

| Role | Fleet / Maintenance | Drivers | Trips | Fuel / Expenses | Analytics | Settings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fleet Manager** | `full` (✓) | `full` (✓) | `none` (-) | `none` (-) | `full` (✓) | `full` (✓) |
| **Dispatcher** | `view` | `none` (-) | `full` (✓) | `none` (-) | `none` (-) | `view` |
| **Safety Officer** | `none` (-) | `full` (✓) | `view` | `none` (-) | `none` (-) | `view` |
| **Financial Analyst**| `view` | `none` (-) | `none` (-) | `full` (✓) | `full` (✓) | `view` |

*Note: The Settings module is editable exclusively by the Fleet Manager (`full`). Other roles are granted `view` access to see global configurations like Depot Name and Currency.*
