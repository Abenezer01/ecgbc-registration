# ECGBC Registration System Documentation

The ECGBC Registration System is a comprehensive platform designed to digitize the registration, evaluation, and management of member churches and fellowships. It consists of a backend API and two distinct frontend portals.

## 🏗 System Architecture

The project is structured as a monorepo containing three main applications:

### 1. Backend (`apps/backend`)
- **Stack:** Node.js, Express, TypeScript, Prisma (ORM), MySQL.
- **Purpose:** Serves as the central API and database interface.
- **Key Modules:**
  - `auth` & `permission`: Role-based access control (RBAC) for staff and church users.
  - `registration-request`: Handles incoming applications from the church portal.
  - `name-reservation`: Contains the algorithmic name similarity engine (Levenshtein, Jaccard, Trigram scoring) to prevent duplicate names.
  - `file`: Manages document uploads, storage, and retrieval.
  - `member` & `council-fellowship`: Core domain models for approved entities.

### 2. Admin Portal (`apps/admin-portal`)
- **Stack:** Next.js (React), Tailwind CSS, TypeScript.
- **Purpose:** The internal dashboard for ECGBC staff and administrators.
- **Key Features:**
  - **Application Review:** Review incoming registrations, verify documents, and approve or reject applications.
  - **Name Checking:** Run real-time similarity checks on proposed church names against existing records.
  - **Member Management:** View and edit approved churches, their files, and associated users.
  - **System Configuration:** Manage lookup tables, staff accounts, and user roles.

### 3. Church Portal (`apps/church-portal`)
- **Stack:** Next.js (React), Tailwind CSS, TypeScript.
- **Purpose:** The public-facing platform for prospective and existing churches.
- **Key Features:**
  - **Online Registration:** A multi-step wizard allowing applicants to submit:
    1. Up to 5 proposed alternative names (in order of preference).
    2. Location and organizational details.
    3. Contact person information.
    4. Required supporting documents.
  - **Self-Service Dashboard:** Post-approval access for churches to manage their profile and download related files.

---

## 🔄 Core Workflows

### 1. Online Registration & Name Submission
1. A prospective church navigates to the Church Portal and begins the application.
2. The applicant provides up to 5 proposed church names in Amharic (and optionally English).
3. The applicant fills out location, contact information, and uploads required PDF/Image documents.
4. The payload is submitted to the Backend, creating a `RegistrationRequest` with a `PENDING` status.

### 2. Application Review & Name Clearance
1. An admin logs into the Admin Portal and opens the pending application.
2. The admin views the "Proposed Names" section and clicks **Check Availability**.
3. The backend runs a similarity matching algorithm against all active members and fellowships.
4. The admin reviews the similarity scores (e.g., Exact match, Trigram overlap, Acronym match).
5. The admin selects the highest-priority available name from the 5 choices to be the official name.
6. The admin clicks **Approve**.

### 3. Approval & Account Generation
1. Upon approval, the backend converts the `RegistrationRequest` into a permanent `Member` record.
2. The selected official name is locked in.
3. A `ChurchUser` account is automatically generated for the contact person, granting them access to the Church Portal.
4. The uploaded files are permanently attached to the new member's profile.

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- pnpm

### Installation
1. Install dependencies at the root:
   ```bash
   pnpm install
   ```
2. Setup Backend:
   ```bash
   cd apps/backend
   cp .env.example .env
   npx prisma generate
   npx prisma db push
   pnpm dev
   ```
3. Setup Admin Portal:
   ```bash
   cd apps/admin-portal
   cp .env.example .env.local
   pnpm dev
   ```
4. Setup Church Portal:
   ```bash
   cd apps/church-portal
   cp .env.example .env.local
   pnpm dev
   ```
