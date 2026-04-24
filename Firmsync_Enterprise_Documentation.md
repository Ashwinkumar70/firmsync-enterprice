# FirmSync Enterprise: Full Project Documentation

## 1. PROJECT OVERVIEW

### Project Title
**FirmSync Enterprise**

### Objective of the Project
The primary objective of FirmSync Enterprise is to provide a unified, multi-tenant Workforce Management System (WMS) that streamlines organizational operations. It centralizes human resources, project management, and cross-departmental workflows into a single, high-performance platform, enabling digital transformation for modern enterprises.

### Problem Statement
Modern organizations often rely on disjointed tools for disparate tasks—using separate platforms for leave management, project tracking, employee requests, and performance monitoring. This "siloed" approach leads to data duplication, increased administrative overhead, lack of real-time visibility for management, and a fragmented user experience for employees.

### Solution Provided by this Project
FirmSync Enterprise solves these challenges by offering a centralized "Source of Truth." The system utilizes a multi-tenant architecture that allows multiple companies to operate securely on a single platform. It provides role-specific portals (Admin, HR, Manager, Employee) with automated workflow engines that handle everything from leave approvals to project submissions, ensuring that all data is synchronized and actionable in real-time.

### Key Features
*   **Multi-Tenancy:** Secure data isolation for different companies using a single database instance.
*   **Role-Based Access Control (RBAC):** Dedicated interfaces and permissions for four distinct organizational tiers.
*   **Automated Workflow Engine:** A generic state-machine for processing internal requests with multi-stage approvals.
*   **Advanced Resource Management:** Integrated tracking of leave, projects, support tickets, and employee skills.
*   **Modern Analytics:** Real-time data visualization for managers and HR to monitor team health and performance.

---

## 2. SYSTEM ARCHITECTURE

### Overall Architecture
FirmSync Enterprise follows a decoupled **Single Page Application (SPA)** architecture combined with **Backend-as-a-Service (BaaS)**.

*   **Frontend Layer:** A high-performance React application that handles all user interactions and state management.
*   **Backend Layer:** Powered by Supabase, which provides a managed Go-based API layer, Authentication, and Storage.
*   **Database Layer:** A PostgreSQL relational database that serves as the persistent storage engine.

### Technologies Used
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Development** | Vite | Ultra-fast build tool and development server for modern web projects. |
| **Frontend** | React 19 | The core library for building the declarative and component-based user interface. |
| **Logic** | TypeScript | Provides static typing to ensure code reliability and catch errors during development. |
| **Database** | PostgreSQL | The relational database engine used for complex data modeling and multi-tenancy. |
| **Backend/Auth** | Supabase | Manages user authentication, database APIs, and Row Level Security (RLS). |
| **Routing** | React Router | Handles navigation between dynamic portals and handles role-based route guards. |
| **Styling** | Vanilla CSS | Custom design system utilizing CSS variables for "Glassmorphism" and high-end aesthetics. |
| **State/Forms** | Zod + Hook Form | Robust schema-based validation and efficient form state management. |

### Architecture Diagram Explanation (Text Format)
The system operates in a request-response cycle where the **React Frontend** sends authenticated requests (using JWT tokens) to the **Supabase API Gateway**. 

1.  **Client-Side:** The user interacts with the UI. The frontend checks local state and permissions.
2.  **API Layer:** Requests hit the Supabase PostgREST layer.
3.  **Database Security:** Before any SQL runs, the **PostgreSQL Row Level Security (RLS)** engine intercepts the request to verify the user's `company_id` and `role`. 
4.  **Persistence:** If authorized, Postgres executes the operation and returns JSON data to the frontend for reactive rendering.

---

## 3. TECHNOLOGIES & TOOLS USED

### Frontend
*   **Framework:** React 19 (Functional Components with Hooks).
*   **Icons:** Lucide-React for a consistent and modern iconography set.
*   **Charts:** Recharts for generating interactive performance and analytics dashboards.
*   **Utilities:** `date-fns` for complex date manipulations (especially for leave management).

### Backend
*   **Language:** Go (Supabase internal) / SQL (Custom triggers and functions).
*   **Framework:** Supabase (PostgREST, GoTrue).
*   **Storage:** Supabase Storage (for project file uploads and avatars).

### Database
*   **Type:** Relational (PostgreSQL).
*   **Key Logic:** PL/pgSQL triggers for automatic user profile synchronization and timestamp management.

---

## 4. MODULES / FEATURES EXPLANATION

### Authentication Module
The authentication system is multi-faceted. It supports standard email/password login but routes users to specific sub-login portals (Admin, Employee, etc.). It also features a "Company Registration" flow where a new Admin can register their organization and receive a unique "Join Code" for employees.

### Admin Module
Designed for organization-level configuration.
*   **Department Management:** Creation and assignment of departments.
*   **User Lifecycle:** Managing invitations, role changes, and account statuses.
*   **Workflow Configuration:** Setting up global rules for how requests should be routed.
*   **System Monitor:** A high-level view of organizational data and platform notifications.

### Manager Module
Focuses on team output and approvals.
*   **Team Analytics:** Visual breakdowns of project progress and team availability.
*   **Workflow Review:** Approving purchase requests, technical workflows, and team tasks.
*   **Leave Approvals:** First-level approval for department-specific leave requests.
*   **Project Feedback:** Monitoring employee submissions and providing structured critiques.

### HR Module
Focuses on people and compliance.
*   **Employee Records:** Comprehensive centralized database of employee profiles and hire dates.
*   **Leave Auditing:** Final review of leave requests to ensure compliance with company policy.
*   **Career Development:** Tracking employee skills, badges (achievements), and career goals.
*   **Payroll (Stub):** Managing base salary records and employee compensation overview.

### Employee Module
Designed for personal productivity and self-service.
*   **Personal Dashboard:** Overview of upcoming tasks, leave balance, and notifications.
*   **Request Submission:** Portal to apply for leaves, submit projects, and open support tickets.
*   **Talent Profile:** Managing personal skills, tracking career objectives, and viewing earned badges.

---

## 5. DATABASE DESIGN

FirmSync Enterprise uses a highly normalized relational schema designed for multi-tenancy. Every table (except global roles) contains a `company_id` to ensure strict data isolation.

### Table List and Descriptions

| Table Name | Purpose | Key Fields |
| :--- | :--- | :--- |
| **companies** | Stores tenant/organization data. | `id`, `name`, `join_code` |
| **roles** | Defines system permissions (Admin, HR, etc.). | `id`, `name`, `permissions` (JSONB) |
| **users** | Extended profile data linked to Supabase Auth. | `id`, `company_id`, `full_name`, `role`, `dept_id` |
| **departments** | Organizational units within a company. | `id`, `company_id`, `name`, `manager_id` |
| **workflows** | Central entity for all request-based flows. | `id`, `type`, `status`, `priority`, `created_by` |
| **workflow_steps** | Granular approval steps for workflows. | `id`, `workflow_id`, `approver_role`, `status` |
| **leave_requests** | Tracks employee time-off applications. | `id`, `employee_id`, `type`, `start_date`, `status` |
| **projects** | Manages organizational project lifecycles. | `id`, `name`, `owner_id`, `due_date`, `completion_%` |
| **project_updates** | Collaborative updates and file submissions. | `id`, `project_id`, `author_id`, `file_url` |
| **support_tickets** | Internal IT/Facilities helpdesk system. | `id`, `reporter_id`, `category`, `status`, `priority` |
| **employee_skills** | Inventory of talent and expertise levels. | `id`, `user_id`, `skill_name`, `level`, `verified` |
| **achievements** | Recognition and badge management system. | `id`, `user_id`, `badge_name`, `badge_icon` |
| **purchase_requests** | Procurement and financial approval requests. | `id`, `requester_id`, `amount`, `vendor`, `status` |
| **notifications** | In-app alerts for user actions. | `id`, `user_id`, `title`, `message`, `is_read` |
| **career_goals** | Individual personal development tracking. | `id`, `user_id`, `title`, `target_date`, `progress` |

### Relationships
*   **One-to-Many:** One Company has many Departments/Users/Projects.
*   **Many-to-One:** Users belong to one Company and optionally one Department.
*   **Linked Workflows:** Tables like `leave_requests` and `purchase_requests` link to the `workflows` table, which manages the universal state machine for approval logic.

---

## 6. WORKFLOW (STEP-BY-STEP)

The system is designed around a structured request-approval lifecycle.

### Step 1: User Onboarding
1.  **Registration:** An Admin registers the company and sets up the engineering/HR departments.
2.  **Invitation:** Admin provides the `join_code` to employees.
3.  **Employee Signup:** Employees sign up and are automatically associated with the company via the join code.

### Step 2: Request Submission (e.g., Leave Request)
1.  **Input:** Employee fills out the Leave Request form (dates, type, reason).
2.  **Validation:** Frontend (Zod) ensures dates are valid.
3.  **Persistence:** A record is created in `leave_requests` and a corresponding `workflow` task is generated.

### Step 3: Backend Processing
1.  **Context Injection:** A PostgreSQL trigger (`handle_new_user`) ensures user metadata is properly linked.
2.  **Visibility:** The request becomes visible to the Department Manager (via RLS policies).

### Step 4: Approval & Resolution
1.  **Review:** The Manager reviews the request in their `WorkflowReview` portal.
2.  **Action:** Manager clicks "Approve." The system updates the `workflow_steps` and notifies the employee.
3.  **Finalization:** HR performs a final audit for payroll adjustment.

---

## 7. IMPLEMENTATION DETAILS

### Folder Structure Explanation
*   `src/pages/`: Contains the main views, partitioned by role (Admin, HR, etc.) for code clarity.
*   `src/components/`: Shared UI components like `Sidebar`, `KPI Cards`, and `Modals`.
*   `src/contexts/`: Contains `AuthContext` which manages the global user session.
*   `src/lib/`: Houses the `supabase.ts` client configuration and specialized database types.
*   `supabase/`: Contains the SQL source code for the entire schema and security layer.

### Key Logic & Functions
*   **`ProtectedRoute.tsx`:** A higher-order component that checks user permissions before allowing access to specific routes.
*   **`RoleRedirect.tsx`:** Automagically detects a user's role upon login and routes them to their specific dashboard (`/admin/dashboard` vs `/employee/dashboard`).
*   **Multi-Tenant SQL Helper:** The project uses a custom SQL function `get_my_company()` defined in the database to automatically filter all user queries based on their auth context.

---

## 8. UI/UX DESIGN

### Design Decisions
The project adopts a **"Glassmorphism"** aesthetic. This involves:
*   **Translucent Elements:** Using `backdrop-filter: blur()` on cards and sidebars for a premium feel.
*   **Vibrant Gradients:** Accent colors (Indigo, Purple) used to guide the user's eye toward call-to-action buttons.
*   **Modern Typography:** Utilizing the 'Outfit' and 'Inter' font families for maximum readability.

### User Flow
The UI follows a consistent "Layout" pattern:
1.  **Sidebar:** Navigation tailored to the user's specific role.
2.  **Topbar:** Search, notifications, and profile management.
3.  **Content Area:** Dynamic loading of modules with smooth transitions.

---

## 9. SECURITY FEATURES

### Authentication Method
The system uses **JWT (JSON Web Tokens)** managed by Supabase Auth. Sessions are persisted in the browser, allowing for "Remember Me" functionality.

### Data Protection (Row Level Security)
This is the most critical security feature. RLS policies are applied at the database level to ensure:
*   **Company Isolation:** A user from Company A can *never* query data from Company B.
*   **Role-Based Access:** HR users can see all salaries, while Managers can only see those in their department, and Employees can only see their own.

### Validations
*   **Frontend:** Zod schemas validate data types and required fields before sending requests.
*   **Database:** SQL check constraints (e.g., `completion_percentage BETWEEN 0 AND 100`) ensure data integrity even if the API is bypassed.

---

## 10. TESTING & DEBUGGING

### Testing Methodology
*   **Role-Switching Tests:** Manually logging in as different roles to verify that UI components hide/show correctly based on permissions.
*   **Workflow Integrity:** Verifying that a leave request correctly flows through "Manager Pending" → "HR Approved" → "Completed" states.
*   **Mobile Responsiveness:** Testing the layout across various viewport sizes using browser developer tools.

### Common Issues & Fixes
*   **RLS Recursion:** Fixed issues where policies were checking roles in a way that caused circular dependencies in Postgres.
*   **Schema Sync:** Ensured that the `public.users` table stayed in sync with `auth.users` using robust SQL triggers.

---

## 11. DEPLOYMENT

### Local Environment Setup
1.  **Clone:** Download the source code.
2.  **Install:** Run `npm install`.
3.  **Environment:** Create a `.env` file with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4.  **Run:** Execute `npm run dev` to start the local Vite server.

### Deployment Process
1.  **Build:** Run `npm run build`.
2.  **Hosting:** Deploy the generated `dist` folder to any static hosting service (Vercel, Netlify, or GH Pages).
3.  **Database:** Execute the `schema.sql` and `rls_policies.sql` directly in the Supabase SQL Editor.

---

## 12. LIMITATIONS

*   **Real-time Communication:** The system currently relies on notifications rather than a live 1-to-1 chat system.
*   **Custom Workflows:** While the engine is generic, users cannot yet create entirely new workflow *types* through the UI; these must be defined in the database.
*   **Financial Integration:** Payroll is currently a data-management tool and does not integrate with banking APIs for actual fund transfers.

---

## 13. FUTURE ENHANCEMENTS

*   **AI Integration:** implementing AI to predict high-churn risk departments based on leave patterns and feedback.
*   **Mobile App:** Developing a native companion app using React Native for push notifications and on-the-go approvals.
*   **Reporting Engine:** Advanced PDF report generation for HR audits and quarterly project reviews.
*   **Full Payroll Pipeline:** Integration with Stripe or similar APIs for automated salary disbursement.

---

## 14. CONCLUSION

**FirmSync Enterprise** represents a state-of-the-art solution for modern organizational management. By combining a beautiful, responsive frontend with a secure, multi-tenant database backend, the project successfully addresses the complexities of workforce management in the digital age. It provides a scalable foundation for companies to manage their most important assets—their people and their projects—within a secure and unified ecosystem.
