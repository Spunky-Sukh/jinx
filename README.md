# Jinx — Trainee Work Tracker

A role-based web app for tracking trainee work. Trainees log their daily tasks,
mentors review and grade that work, and a super admin manages everyone and all the
reference data. Built as a clean, modular full-stack project with security enforced
at the database level.

---

## Features

### Roles
Three roles, each with its own scoped experience:

- **Super Admin** — manages reference data, registers mentors and trainees, and has a
  read-only view of all work logs across the program.
- **Mentor** — sees only their own trainees, and reviews/marks their work with remarks.
- **Trainee** — logs daily work and tracks their own progress.

### Authentication
- Email + password sign-in (no public sign-up — accounts are provisioned by an admin).
- Forgot-password and reset-password flows with branded emails.
- Protected, role-aware routing: each role lands on its own dashboard and can't reach
  another role's pages.

### Trainee daily work
- Log a task with name, description, location (**Home / Office**), date, and status.
- Status options: pending, in progress, hold, failed, complete.
- Mentor is auto-selected from the trainee's assignment, with the option to pick another
  mentor from the same team.
- **Completed logs are locked** — once a task is marked complete it can no longer be
  edited or deleted. This is enforced both in the UI and in the database.

### Mentor review
- Mentors see only their own trainees' logs (enforced by row-level security).
- Mark a log's status and leave remarks/feedback for the trainee.

### Masters (admin-managed reference data)
- Teams, Colleges, Courses, Systems, Companies — simple add/edit/remove lists.
- Training periods (e.g. "45 Days", "6 Months") with a duration in days.

### Registration
- **Mentor registration** also creates the mentor as an app user and assigns them to a team.
- **Trainee registration** captures full profile details, and:
  - the mentor dropdown is **filtered by the selected team**, so you only see relevant mentors;
  - the **end date is auto-calculated** from the start date plus the chosen training period.
- New users are provisioned server-side and receive an email to set up their account.

### Dashboards
- Tailored dashboards for each role, with stat tiles and a status breakdown chart.
- Filterable work-log views (by status, location, and date range).

### Design
- Custom, fully keyboard-accessible dropdowns (no native selects).
- Smooth micro-interactions and transitions.
- A single-file theme with a built-in **dark / light** toggle — re-skin the whole app by
  editing one stylesheet.
- Mobile-responsive throughout.

---

## Tech stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS (theme driven by CSS variables)
- React Router (role-scoped routes + guards)
- TanStack Query (data fetching / caching)
- Framer Motion (animation)
- Lucide (icons)

**Backend**
- Supabase — Postgres, Auth, Edge Functions
- Row Level Security for role-based data access
- A serverless function for provisioning new users

---

## Architecture

The codebase is organized by **feature**. Each feature folder is split into:

- `api/` — backend calls
- `hooks/` — data hooks (queries & mutations)
- `components/` — UI for that feature

```
src/
  app/            App root (providers)
  routes/         Router (role-scoped route trees + guards)
  components/
    ui/           Design-system primitives (Button, custom Select, Modal, ...)
    layout/       App shell (sidebar / topbar), page header
  features/
    auth/         Login, guards, session handling
    masters/      Reference-data management
    mentors/      Mentor registration & listing
    trainees/     Trainee registration & listing
    work-logs/    Daily-work entry, review, listing
    dashboard/    Stat tiles, status chart, role dashboards
  lib/            Client setup, helpers
  theme/          Theme stylesheet + provider
  types/          Shared types
public/           Static assets (favicon, etc.)
supabase/
  schema.sql              Full database + Row Level Security
  functions/              Serverless function for user provisioning
  email-templates/        Branded auth email templates
```

This separation keeps UI, data logic, and backend calls independent, so any layer can be
changed without rippling through the others.

---

## Getting started

> You'll need Node.js (18+), a package manager, and a Supabase project.

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

In the Supabase SQL editor, run the schema in `supabase/schema.sql`. This creates all
tables, enums, security policies, helper functions, and seed reference data.

### 4. Deploy the user-provisioning function

Deploy the function in `supabase/functions/` (via the Supabase dashboard editor or the
Supabase CLI), and set its required secrets in your project settings.

### 5. Configure email

For real emails, connect a custom SMTP provider in your Supabase Auth settings, then
paste the branded templates from `supabase/email-templates/` into the corresponding
Auth email templates.

### 6. Create the first admin

There's no public sign-up. Create the first admin user from the Supabase dashboard and
give it the super-admin role (see the comments in `schema.sql`). Every other user is then
created from inside the app.

### 7. Run

```bash
npm run dev
```

---

## Role permissions

| Capability                         | Trainee | Mentor | Super Admin |
|------------------------------------|:------:|:------:|:-----------:|
| Log daily work                     |   ✅   |        |             |
| Edit own non-complete logs         |   ✅   |        |             |
| Review / mark logs (with remarks)  |        |   ✅   |             |
| See only own trainees' logs        |        |   ✅   |             |
| See all logs (read-only)           |        |        |     ✅      |
| Manage masters & registrations     |        |        |     ✅      |

Visibility is enforced by **Row Level Security**, not just the UI — a mentor cannot query
another mentor's trainees, and a trainee can only read their own records.

---

## Theming

All colors and the corner radius live in a single theme stylesheet. Tailwind reads them
via CSS variables, so re-skinning the whole app — including the separate light theme — is
a one-file change. A dark/light toggle is available in the top bar.

---

## Available scripts

```bash
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

---

## Deployment

The app is a static Vite build and deploys to any static host. A `vercel.json` is
included with an SPA rewrite so client-side routes work on refresh. After deploying,
set your production URL as the Site URL and add the reset-password route to the redirect
allow-list in your Supabase Auth settings.

---