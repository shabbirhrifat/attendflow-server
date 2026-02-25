# AttendFlow Server - Complete API Reference

> **Generated:** 2026-02-25
> **Base URL:** `/api/v1`
> **Runtime:** Node.js + Express 5 + TypeScript
> **Database:** MongoDB (Mongoose 9)
> **Validation:** Zod v4
> **Auth:** JWT (Bearer tokens)

---

## Table of Contents

1. [Authentication Scheme](#1-authentication-scheme)
2. [Response Format](#2-response-format)
3. [Rate Limiting](#3-rate-limiting)
4. [Roles & Permissions](#4-roles--permissions)
5. [Roles-to-Endpoints Matrix](#5-roles-to-endpoints-matrix)
6. [API Endpoints](#6-api-endpoints)
   - [6.1 Auth](#61-auth-module)
   - [6.2 Admin](#62-admin-module)
   - [6.3 User](#63-user-module)
   - [6.4 Student](#64-student-module)
   - [6.5 Teacher](#65-teacher-module)
   - [6.6 Attendance](#66-attendance-module)
   - [6.7 Leave](#67-leave-module)
   - [6.8 Course](#68-course-module)
   - [6.9 Organization](#69-organization-module)
   - [6.10 Assignment](#610-assignment-module)
   - [6.11 Dashboard](#611-dashboard-module)
   - [6.12 Notification](#612-notification-module)
   - [6.13 Settings](#613-settings-module)
   - [6.14 Import](#614-import-module)
   - [6.15 Bulk](#615-bulk-module)
   - [6.16 Audit](#616-audit-module)
   - [6.17 Session](#617-session-module)
7. [Data Models](#7-data-models)
8. [Error Reference](#8-error-reference)
9. [Known Issues & Inconsistencies](#9-known-issues--inconsistencies)

---

## 1. Authentication Scheme

All authenticated endpoints require a JWT access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

### Token Types

| Token | Purpose | Secret Config Key | Lifetime Config Key |
|-------|---------|-------------------|---------------------|
| Access Token | Authenticates API requests | `JWT_ACCESS_SECRET` | `JWT_ACCESS_EXPIRES` |
| Refresh Token | Obtains new access tokens | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES` |
| Reset Token | Password reset flow | `JWT_RESET_SECRET` | N/A |
| Email Token | Email verification flow | `JWT_EMAIL_SECRET` | N/A |

### Token Payload (`req.user`)

```typescript
{
  id: string;       // User's MongoDB _id
  email: string;    // User's email
  role: UserRole;   // 'ADMIN' | 'TEACHER' | 'STUDENT'
  iat: number;      // Issued at (epoch)
  exp: number;      // Expiration (epoch)
}
```

### Auth Flow

1. **Register** -> receive `accessToken` + `refreshToken`
2. **Login** -> receive `accessToken` + `refreshToken`
3. Use `accessToken` for all API calls
4. When expired, call **Refresh Token** endpoint with `refreshToken`
5. **Logout** invalidates the `refreshToken`

---

## 2. Response Format

### Success Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Description of what happened",
  "data": { ... }
}
```

### Paginated Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Records retrieved successfully",
  "<entityName>": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Human-readable error description",
  "errorSources": [
    {
      "path": "fieldName",
      "message": "Specific field error"
    }
  ],
  "stack": "Error stack trace (development only)"
}
```

> **Note:** `errorSources` and `stack` are only included when `NODE_ENV=development`.

---

## 3. Rate Limiting

| Scope | Window | Max Requests | Applies To |
|-------|--------|-------------|------------|
| Auth endpoints | 15 minutes | 50 | `/api/v1/auth/login`, `/register`, `/forgot-password`, `/reset-password` |
| General API | 1 minute | 100 | All `/api/v1/*` routes |

Rate limit exceeded returns `429 Too Many Requests`.

---

## 4. Roles & Permissions

### Defined Roles

| Role | Description | Stored in DB |
|------|-------------|-------------|
| `ADMIN` | Full system administrator. Can manage all users, settings, organization structure, and data. | Yes |
| `TEACHER` | Faculty member. Can mark attendance, manage courses, approve/reject leave requests, view schedules. | Yes |
| `STUDENT` | Student user. Can view own attendance, submit leave requests, view own dashboard. | Yes |
| `SUPER_ADMIN` | Referenced in middleware guards but **not** defined in the User schema enum. Cannot be persisted. | No |

### User Statuses

| Status | Description |
|--------|-------------|
| `ACTIVE` | Normal active account |
| `INACTIVE` | Deactivated account |
| `SUSPENDED` | Temporarily suspended |
| `PENDING` | Awaiting activation/verification |

### Access Levels Used in Routes

| Label | Meaning |
|-------|---------|
| **Public** | No authentication required |
| **Authenticated** | Any logged-in user (any role) |
| **ADMIN** | Only users with `ADMIN` role |
| **TEACHER, ADMIN** | Users with `TEACHER` or `ADMIN` role |
| **TEACHER, ADMIN, SUPER_ADMIN** | Teachers, admins, or super admins |

---

## 5. Roles-to-Endpoints Matrix

### ADMIN Role

ADMINs have access to **all** endpoints. The following are **ADMIN-exclusive** or require ADMIN:

| Module | Endpoints |
|--------|-----------|
| User | `PATCH /:id/role`, `PATCH /:id/status`, `GET /stats`, `PATCH /:id/deactivate`, `PATCH /bulk/status` |
| Student | `POST /create-student`, `PATCH /:id`, `DELETE /:id`, `GET /stats` |
| Teacher | `POST /:teacherId/assign-department`, `POST /:teacherId/remove-department`, `POST /bulk-assign-department`, `GET /unassigned` |
| Organization | All `POST`, `PATCH`, `DELETE` on departments, semesters, batches, subjects |
| Course | All `POST`, `PATCH`, `DELETE` on courses, enrollments, schedules; `GET /courses/stats`, `GET /enrollments/stats`, `GET /schedules/stats` |
| Assignment | All 10 endpoints |
| Dashboard | All 6 endpoints |
| Settings | `GET /`, `PATCH /` |
| Import | `POST /validate`, `POST /execute` |
| Bulk | All 4 endpoints |
| Audit | `GET /`, `GET /entity/:entityId`, `GET /failed-logins`, `GET /recent-activity`, `GET /stats`, `POST /cleanup` |
| Session | `GET /user/:userId`, `POST /cleanup` |
| Notification | `POST /broadcast`, `POST /:id/resend-email` |

### TEACHER Role

| Module | Endpoints |
|--------|-----------|
| Teacher | All profile, attendance, leave, schedule, subject, dashboard, and department endpoints (shared with ADMIN) |
| Attendance | `POST /`, `POST /bulk-mark`, `POST /session`, `POST /sessions`, `PATCH /:id`, `GET /dashboard` |
| Leave | `GET /stats`, `GET /dashboard`, `GET /pending`, `PATCH /:id/approve`, `PATCH /:id/reject`, `POST /bulk-approve`, `POST /bulk-reject` |
| Course | `GET /courses`, `GET /courses/:courseId`, `GET /enrollments`, `GET /enrollments/:enrollmentId`, `GET /schedules`, `GET /schedules/:scheduleId` |
| Assignment | `POST /student-to-course`, `DELETE /student-from-course/:studentId/:courseId` |

### STUDENT Role

| Module | Endpoints |
|--------|-----------|
| Auth | All authenticated endpoints (profile, change-password, logout, refresh) |
| Student | All `GET` endpoints (own profile, attendance, dashboard) |
| Leave | `POST /` (submit), `GET /my-leaves`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Notification | All `GET` endpoints, mark as read |
| Session | `GET /my-sessions`, `GET /my-sessions/stats`, `DELETE /:sessionId`, `DELETE /revoke-others`, `DELETE /revoke-all` |
| Audit | `GET /my-logs` |

---

## 6. API Endpoints

---

### 6.1 Auth Module

**Base path:** `/api/v1/auth`

---

#### `POST /auth/register`

**Access:** Public
**Description:** Registers a new user account. Creates user record, generates JWT tokens, and optionally creates role-specific profiles (student/teacher) based on the role field.

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | string | Yes | Valid email format | User's email address |
| `username` | string | No | Min 3 characters | Display username |
| `name` | string | Yes | Min 2 characters | Full name |
| `password` | string | Yes | Min 6 characters | Account password |
| `role` | string | No | `'SUPER_ADMIN'`, `'ADMIN'`, `'TEACHER'`, `'STUDENT'` | Default: `'STUDENT'` |
| `phone` | string | No | - | Phone number |
| `departmentId` | string | No | - | Department reference (for teachers) |
| `employeeId` | string | No | - | Employee ID (for teachers) |
| `designation` | string | No | - | Job title (for teachers) |
| `specialization` | string | No | - | Specialization (for teachers) |
| `studentId` | string | No | - | Student ID (for students) |
| `batchId` | string | No | - | Batch reference (for students) |
| `semester` | number | No | - | Semester number (for students) |

**Success Response:** `201 Created`
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "STUDENT" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation error (missing/invalid fields) |
| 409 | Email or username already exists |

---

#### `POST /auth/login`

**Access:** Public
**Description:** Authenticates a user with email and password. Returns JWT access and refresh tokens.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 1 character |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 401 | Invalid email or password |

---

#### `POST /auth/forgot-password`

**Access:** Public
**Description:** Initiates password reset flow. Sends a password reset email with a tokenized link to the user's email address.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password reset email sent",
  "data": null
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 404 | Email not found |

---

#### `POST /auth/reset-password`

**Access:** Public
**Description:** Resets user password using a token received via email. Invalidates the reset token after use.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | string | Yes | Min 1 character |
| `newPassword` | string | Yes | Min 6 characters |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid or expired token |

---

#### `POST /auth/verify-email`

**Access:** Public
**Description:** Verifies a user's email address using a verification token sent during registration.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | string | Yes | Min 1 character |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid or expired token |

---

#### `POST /auth/refresh-token`

**Access:** Authenticated (via refresh token)
**Description:** Exchanges a valid refresh token for a new access token. Used when the access token expires.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Min 1 character |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing refresh token |
| 401 | Invalid or expired refresh token |

---

#### `POST /auth/logout`

**Access:** Authenticated (via refresh token)
**Description:** Invalidates the user's refresh token, ending the session. The access token remains valid until it expires.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Min 1 character |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged out successfully",
  "data": null
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing refresh token |
| 401 | Invalid refresh token |

---

#### `POST /auth/change-password`

**Access:** Authenticated
**Description:** Changes the authenticated user's password. Requires the current password for verification.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | Min 1 character |
| `newPassword` | string | Yes | Min 6 characters |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 401 | Current password is incorrect |

---

#### `GET /auth/profile`

**Access:** Authenticated
**Description:** Returns the minimal profile of the currently authenticated user (id and role from JWT).

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "64f...",
    "role": "STUDENT"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

#### `PATCH /auth/profile`

**Access:** Authenticated
**Description:** Updates the authenticated user's profile information. Currently a stub -- accepts data but returns success without persisting changes.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | Min 2 characters |
| `username` | string | No | Min 3 characters |
| `email` | string | No | Valid email format |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Profile updated successfully",
  "data": null
}
```

---

### 6.2 Admin Module

**Base path:** `/api/v1/admin`

---

#### `POST /admin/auth/login`

**Access:** Public
**Description:** Dedicated login endpoint for admin panel. Only allows `ADMIN`, `SUPER_ADMIN`, and `TEACHER` roles. Performs inline bcrypt password comparison rather than delegating to the auth service.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 1 character |

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "ADMIN" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Invalid password |
| 403 | User role is not ADMIN, SUPER_ADMIN, or TEACHER |
| 404 | User with that email not found |

---

#### `POST /admin/auth/register`

**Access:** Public
**Description:** Registers an admin or teacher account. Checks for duplicate email/username, hashes password, and if role is `TEACHER`, also creates a teacher profile.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `username` | string | No | Min 3 characters |
| `name` | string | Yes | Min 2 characters |
| `password` | string | Yes | Min 6 characters |
| `role` | string | No | `'ADMIN'` or `'TEACHER'` | Default: `'TEACHER'` |
| `phone` | string | No | - |
| `departmentId` | string | No | - |
| `employeeId` | string | No | - |
| `designation` | string | No | - |
| `specialization` | string | No | - |

**Success Response:** `201 Created`
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 403 | Role is not ADMIN or TEACHER |
| 409 | Email or username already exists |

---

### 6.3 User Module

**Base path:** `/api/v1/user`

---

#### `POST /user/create-user`

**Access:** Authenticated
**Description:** Creates a new user record in the system. Used for admin-initiated user creation.

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | string | Yes | Valid email format | User email |
| `username` | string | No | Min 3 characters | Username |
| `password` | string | Yes | Min 6 characters | Password |
| `name` | string | Yes | Min 2 characters | Full name |
| `role` | string | No | `'ADMIN'`, `'TEACHER'`, `'STUDENT'` | Default: `'STUDENT'` |
| `status` | string | No | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`, `'PENDING'` | Default: `'ACTIVE'` |
| `avatar` | string | No | Valid URL | Profile image URL |
| `phone` | string | No | Regex: `/^[+]?[\d\s\-\(\)]+$/` | Phone number |
| `address` | string | No | - | Address |
| `dateOfBirth` | string | No | Valid date string | Date of birth |

**Success Response:** `201 Created`

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Validation error |
| 409 | Duplicate email/username |

---

#### `GET /user/:id`

**Access:** Authenticated
**Description:** Retrieves a single user by their MongoDB ID.

**URL Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | Min 1 character |

**Success Response:** `200 OK` with user object.

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | User not found |

---

#### `GET /user/`

**Access:** Authenticated
**Description:** Retrieves all users with filtering, searching, pagination, and sorting.

**Query Params:**

| Param | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `role` | string | No | `'ADMIN'`, `'TEACHER'`, `'STUDENT'` | Filter by role |
| `status` | string | No | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`, `'PENDING'` | Filter by status |
| `search` | string | No | - | Search by name/email |
| `page` | string | No | Numeric string | Page number |
| `limit` | string | No | Numeric string | Items per page |
| `sortBy` | string | No | - | Sort field |
| `sortOrder` | string | No | `'asc'`, `'desc'` | Sort direction |

**Success Response:** `200 OK` with paginated users.

---

#### `PATCH /user/:id`

**Access:** Authenticated
**Description:** Updates a user's information by ID. All fields are optional.

**URL Params:** `id` (string, required)

**Request Body:** Same fields as `createUserSchema`, all optional.

**Success Response:** `200 OK` with updated user.

---

#### `DELETE /user/:id`

**Access:** Authenticated
**Description:** Permanently deletes a user record.

**URL Params:** `id` (string, required)

**Success Response:** `204 No Content`

---

#### `PATCH /user/:id/role`

**Access:** ADMIN only
**Description:** Changes a user's role. Admin-only operation with audit implications.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | Yes | Min 1 character |
| `role` | string | Yes | `'ADMIN'`, `'TEACHER'`, `'STUDENT'` |

**Success Response:** `200 OK` with updated user.

**Errors:**
| Status | Condition |
|--------|-----------|
| 403 | Not an ADMIN |
| 404 | User not found |

---

#### `PATCH /user/:id/status`

**Access:** ADMIN only
**Description:** Changes a user's account status (activate, deactivate, suspend).

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | Yes | Min 1 character |
| `status` | string | Yes | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`, `'PENDING'` |

**Success Response:** `200 OK` with updated user.

---

#### `GET /user/profile/:id`

**Access:** Authenticated
**Description:** Retrieves detailed profile information for a user, including role-specific data (student profile, teacher profile).

**URL Params:** `id` (string, required)

**Success Response:** `200 OK` with profile object.

---

#### `GET /user/stats`

**Access:** ADMIN only
**Description:** Returns aggregate statistics about all users in the system (counts by role, status, etc.).

**Success Response:** `200 OK` with stats object.

---

#### `GET /user/role/:role`

**Access:** Authenticated
**Description:** Retrieves all users with a specific role.

**URL Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `role` | string | Yes | `'ADMIN'`, `'TEACHER'`, `'STUDENT'` |

**Success Response:** `200 OK` with array of users.

---

#### `GET /user/search`

**Access:** Authenticated
**Description:** Searches users by name, email, or username.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `q` | string | Yes | Min 1, Max 100 characters |

**Success Response:** `200 OK` with matching users.

---

#### `PATCH /user/profile/:id`

**Access:** Authenticated
**Description:** Updates a user's profile fields (name, avatar, phone, etc.).

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | Min 2 characters |
| `username` | string | No | Min 3 characters |
| `avatar` | string | No | Valid URL |
| `phone` | string | No | Regex: `/^[+]?[\d\s\-\(\)]+$/` |
| `address` | string | No | - |
| `dateOfBirth` | string | No | Valid date string |

**Success Response:** `200 OK` with updated profile.

---

#### `PATCH /user/:id/deactivate`

**Access:** ADMIN only
**Description:** Soft-deletes a user by setting their status to inactive rather than permanently removing the record.

**URL Params:** `id` (string, required)

**Success Response:** `200 OK`

---

#### `PATCH /user/bulk/status`

**Access:** ADMIN only
**Description:** Bulk-updates the status of multiple users at once.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userIds` | string[] | Yes | Min 1 item, each min 1 char |
| `status` | string | Yes | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`, `'PENDING'` |

**Success Response:** `200 OK`

---

#### `GET /user/activity/:id`

**Access:** Authenticated
**Description:** Retrieves recent activity/audit log for a specific user.

**URL Params:** `id` (string, required)

**Query Params:**

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `limit` | number | No | 10 |

**Success Response:** `200 OK` with activity array.

---

### 6.4 Student Module

**Base path:** `/api/v1/student`

---

#### `POST /student/create-student`

**Access:** ADMIN only
**Description:** Creates a new student profile. If no `userId` is provided, also creates the underlying user account.

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `userId` | string | No | Min 1 char | Link to existing user |
| `name` | string | Yes | Min 2 characters | Student's full name |
| `email` | string | Yes | Valid email, Min 1 char | Student's email |
| `password` | string | No | Min 8 characters | Account password (if creating new user) |
| `batchId` | string | No | Min 1 char | Batch assignment |
| `departmentId` | string | No | Min 1 char | Department assignment |
| `semester` | number | No | Int, 1-10 | Default: `1` |
| `gpa` | number | No | 0.0-4.0 | Default: `0.0` |
| `credits` | number | No | Int, Min 0 | Default: `0` |

**Success Response:** `201 Created`

---

#### `GET /student/stats`

**Access:** ADMIN only
**Description:** Returns aggregate statistics about all students (counts by batch, department, semester, active/inactive).

**Success Response:** `200 OK` with stats object.

---

#### `GET /student/:id`

**Access:** Authenticated
**Description:** Retrieves a single student record by student profile ID.

**URL Params:** `id` (string, required)

**Success Response:** `200 OK` with student object.

---

#### `GET /student/user/:userId`

**Access:** Authenticated
**Description:** Retrieves a student record by the associated user ID (useful when you have the user ID from the JWT but need the student profile).

**URL Params:** `userId` (string, required)

**Success Response:** `200 OK` with student object.

---

#### `GET /student/`

**Access:** Authenticated
**Description:** Lists all students with filtering and pagination.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `batchId` | string | No | - |
| `departmentId` | string | No | - |
| `semester` | string | No | Numeric string |
| `isActive` | string | No | `'true'` or `'false'` |
| `status` | string | No | `'all'`, `'active'`, `'inactive'` |
| `search` | string | No | - |
| `page` | string | No | Numeric string |
| `limit` | string | No | Numeric string |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

**Success Response:** `200 OK` with paginated students.

---

#### `PATCH /student/:id`

**Access:** ADMIN only
**Description:** Updates a student record.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | No | Min 1 char |
| `batchId` | string | No | Min 1 char |
| `departmentId` | string | No | Min 1 char |
| `semester` | number | No | Int, 1-10 |
| `gpa` | number | No | 0.0-4.0 |
| `credits` | number | No | Int, Min 0 |
| `isActive` | boolean | No | - |

**Success Response:** `200 OK`

---

#### `DELETE /student/:id`

**Access:** ADMIN only
**Description:** Deletes a student profile. The pre-deleteOne hook also deletes the associated user account.

**URL Params:** `id` (string, required)

**Success Response:** `204 No Content`

---

#### `GET /student/profile/:id`

**Access:** Authenticated
**Description:** Retrieves a detailed student profile including user info, batch, and department data.

**URL Params:** `id` (string, required)

**Success Response:** `200 OK` with detailed profile.

---

#### `GET /student/user/:userId/profile`

**Access:** Authenticated
**Description:** Retrieves student profile by user ID.

**URL Params:** `userId` (string, required)

**Success Response:** `200 OK` with student profile.

---

#### `GET /student/:id/attendance`

**Access:** Authenticated
**Description:** Retrieves attendance records for a specific student with optional filters.

**URL Params:** `id` (string, required)

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | No | - |
| `startDate` | string | No | Valid date string |
| `endDate` | string | No | Valid date string |
| `status` | string | No | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `page` | string | No | Numeric string |
| `limit` | string | No | Numeric string |

**Success Response:** `200 OK` with paginated attendance records.

---

#### `GET /student/user/:userId/attendance`

**Access:** Authenticated
**Description:** Same as above but looks up the student by user ID first.

**URL Params:** `userId` (string, required)

**Query Params:** Same as `GET /student/:id/attendance`

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | No student profile found for this user ID |

---

#### `GET /student/:id/attendance-summary`

**Access:** Authenticated
**Description:** Returns an aggregated attendance summary (total present, absent, late, excused counts and percentages).

**URL Params:** `id` (string, required)

**Success Response:** `200 OK` with summary object.

---

#### `POST /student/:id/leave-request`

**Access:** Authenticated
**Description:** Submits a leave request on behalf of a student.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `startDate` | string | Yes | Valid date string |
| `endDate` | string | Yes | Valid date string |
| `reason` | string | Yes | Min 5 characters |

**Success Response:** `201 Created`

---

#### `PATCH /student/profile/:id`

**Access:** Authenticated
**Description:** Updates a student's user profile fields (name, phone, avatar, etc.).

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | Min 2 characters |
| `username` | string | No | Min 3 characters |
| `avatar` | string | No | Valid URL |
| `phone` | string | No | Regex: `/^[+]?[\d\s\-\(\)]+$/` |
| `address` | string | No | - |
| `dateOfBirth` | string | No | Valid date string |

**Success Response:** `200 OK`

---

#### `GET /student/dashboard/:id`

**Access:** Authenticated
**Description:** Returns dashboard data for a student (attendance summary, upcoming classes, recent activity).

**URL Params:** `id` (string, required)

**Success Response:** `200 OK` with dashboard data.

---

#### `GET /student/user/:userId/dashboard`

**Access:** Authenticated
**Description:** Same as above but resolves the student by user ID.

**URL Params:** `userId` (string, required)

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | No student profile found for this user ID |

---

### 6.5 Teacher Module

**Base path:** `/api/v1/teacher`

All endpoints require `TEACHER` or `ADMIN` role unless otherwise noted.

---

#### Profile Management

##### `POST /teacher/`

**Access:** TEACHER, ADMIN
**Description:** Creates a new teacher profile. If no `userId` is provided, creates the underlying user account as well.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | No | - |
| `name` | string | Yes | Min 2 characters |
| `email` | string | Yes | Valid email, min 1 char |
| `password` | string | No | Min 8 characters |
| `employeeId` | string | No | - |
| `departmentId` | string | No | - |
| `designation` | string | No | - |
| `specialization` | string | No | - |

**Success Response:** `201 Created`

---

##### `GET /teacher/:teacherId`

**Access:** TEACHER, ADMIN
**Description:** Retrieves a teacher profile by teacher ID.

**URL Params:** `teacherId` (string, required)

**Success Response:** `200 OK` with teacher profile.

---

##### `GET /teacher/user/:userId/profile`

**Access:** TEACHER, ADMIN
**Description:** Retrieves teacher profile by user ID.

**URL Params:** `userId` (string, required)

---

##### `PUT /teacher/:teacherId`

**Access:** TEACHER, ADMIN
**Description:** Updates a teacher's profile information.

**URL Params:** `teacherId` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `employeeId` | string | No | Min 1 character |
| `departmentId` | string | No | - |
| `designation` | string | No | - |
| `specialization` | string | No | - |
| `isActive` | boolean | No | - |

**Success Response:** `200 OK`

---

##### `DELETE /teacher/:teacherId`

**Access:** TEACHER, ADMIN
**Description:** Deletes a teacher profile. The pre-deleteOne hook also deletes the associated user account.

**URL Params:** `teacherId` (string, required)

**Success Response:** `204 No Content`

---

##### `GET /teacher/`

**Access:** TEACHER, ADMIN
**Description:** Lists all teachers with filtering and pagination.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | string | No | - |
| `designation` | string | No | - |
| `specialization` | string | No | - |
| `isActive` | boolean | No | - |
| `status` | string | No | `'all'`, `'active'`, `'inactive'` |
| `search` | string | No | - |
| `dateRange` | object | No | `{ start: datetime, end: datetime }` |

**Success Response:** `200 OK` with paginated teachers.

---

##### `GET /teacher/stats`

**Access:** TEACHER, ADMIN
**Description:** Returns aggregate teacher statistics.

**Success Response:** `200 OK`

---

##### `GET /teacher/:teacherId/statistics`

**Access:** TEACHER, ADMIN
**Description:** Returns detailed statistics for a specific teacher (classes taught, attendance rates, etc.).

**URL Params:** `teacherId` (string, required)

**Success Response:** `200 OK`

---

#### Attendance Management

##### `POST /teacher/:teacherId/attendance/mark`

**Access:** TEACHER, ADMIN
**Description:** Marks attendance for a single student in a course.

**URL Params:** `teacherId` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | Yes | - |
| `courseId` | string | Yes | - |
| `date` | string | Yes | ISO 8601 datetime |
| `status` | string | Yes | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `checkIn` | string | No | ISO 8601 datetime |
| `checkOut` | string | No | ISO 8601 datetime |
| `notes` | string | No | Max 500 characters |

**Success Response:** `201 Created`

---

##### `POST /teacher/:teacherId/attendance/bulk`

**Access:** TEACHER, ADMIN
**Description:** Marks attendance for multiple students in a single course at once.

**URL Params:** `teacherId` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | - |
| `date` | string | Yes | ISO 8601 datetime |
| `attendances` | array | Yes | Min 1 item |
| `attendances[].studentId` | string | Yes | - |
| `attendances[].status` | string | Yes | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `attendances[].checkIn` | string | No | ISO 8601 datetime |
| `attendances[].checkOut` | string | No | ISO 8601 datetime |
| `attendances[].notes` | string | No | Max 500 characters |

**Success Response:** `201 Created`

---

##### `GET /teacher/:teacherId/courses/:courseId/attendance`

**Access:** TEACHER, ADMIN
**Description:** Retrieves attendance records for a specific course taught by a teacher.

**URL Params:** `teacherId` (string), `courseId` (string)

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | No | - |
| `startDate` | string | No | ISO 8601 datetime |
| `endDate` | string | No | ISO 8601 datetime |
| `status` | string | No | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `page` | number | No | Int, Min 1 |
| `limit` | number | No | Int, 1-100 |

**Success Response:** `200 OK` with attendance records.

---

##### `GET /teacher/:teacherId/courses/:courseId/attendance/summary`

**Access:** TEACHER, ADMIN
**Description:** Gets aggregated attendance summary for a course.

**URL Params:** `teacherId` (string), `courseId` (string)

**Query Params:** `startDate?`, `endDate?`

**Success Response:** `200 OK`

---

#### Leave Management

##### `GET /teacher/:teacherId/leaves/pending`

**Access:** TEACHER, ADMIN
**Description:** Retrieves all pending leave requests assigned to this teacher for approval.

**URL Params:** `teacherId` (string, required)

**Success Response:** `200 OK` with pending leave requests.

---

##### `PUT /teacher/:teacherId/leaves/:leaveId/approve`

**Access:** TEACHER, ADMIN
**Description:** Processes (approves or rejects) a leave request.

**URL Params:** `teacherId` (string), `leaveId` (string)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `leaveId` | string | Yes | - |
| `status` | string | Yes | `'APPROVED'` or `'REJECTED'` |
| `rejectionReason` | string | No | Max 500 characters |

**Success Response:** `200 OK`

---

##### `GET /teacher/:teacherId/leaves/processed`

**Access:** TEACHER, ADMIN
**Description:** Retrieves previously processed (approved/rejected) leave requests.

**URL Params:** `teacherId` (string, required)

**Success Response:** `200 OK`

---

#### Class Schedule Management

##### `POST /teacher/:teacherId/schedules`

**Access:** TEACHER, ADMIN
**Description:** Creates a class schedule entry for a teacher.

**URL Params:** `teacherId` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | - |
| `batchId` | string | Yes | - |
| `dayOfWeek` | number | Yes | Int, 1-7 |
| `startTime` | string | Yes | `HH:MM` format (regex validated) |
| `endTime` | string | Yes | `HH:MM` format (regex validated) |
| `room` | string | No | Max 50 characters |
| `semester` | number | No | Int, Min 1 |

**Success Response:** `201 Created`

---

##### `GET /teacher/:teacherId/schedules`

**Access:** TEACHER, ADMIN
**Description:** Gets all class schedules for a teacher.

**URL Params:** `teacherId` (string, required)

---

##### `GET /teacher/:teacherId/schedules/today`

**Access:** TEACHER, ADMIN
**Description:** Gets today's class schedule for a teacher.

**URL Params:** `teacherId` (string, required)

---

##### `GET /teacher/user/:userId/schedules`

**Access:** TEACHER, ADMIN
**Description:** Gets schedules by user ID (resolves teacher profile first).

**URL Params:** `userId` (string, required)

---

##### `PUT /teacher/:teacherId/schedules/:scheduleId`

**Access:** TEACHER, ADMIN
**Description:** Updates a class schedule.

**URL Params:** `teacherId` (string), `scheduleId` (string)

**Request Body:** Same as create schedule.

---

##### `DELETE /teacher/:teacherId/schedules/:scheduleId`

**Access:** TEACHER, ADMIN
**Description:** Deletes a class schedule.

**URL Params:** `teacherId` (string), `scheduleId` (string)

**Success Response:** `204 No Content`

---

#### Subject Management

##### `POST /teacher/subjects`

**Access:** TEACHER, ADMIN
**Description:** Creates a new subject.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters |
| `code` | string | Yes | 1-20 characters |
| `description` | string | No | Max 500 characters |
| `credits` | number | No | Int, 0-10 |
| `departmentId` | string | Yes | - |

**Success Response:** `201 Created`

---

##### `GET /teacher/subjects`

**Access:** TEACHER, ADMIN
**Description:** Lists all subjects with filtering.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `search` | string | No | - |
| `departmentId` | string | No | - |
| `isActive` | string | No | `'true'` or `'false'` |
| `page` | string | No | Numeric |
| `limit` | string | No | Numeric |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

---

##### `GET /teacher/subjects/:subjectId`

**Access:** TEACHER, ADMIN

---

##### `PUT /teacher/subjects/:subjectId`

**Access:** TEACHER, ADMIN

**Request Body:** Same as create, all optional, plus `isActive: boolean`.

---

##### `DELETE /teacher/subjects/:subjectId`

**Access:** TEACHER, ADMIN

**Success Response:** `204 No Content`

---

#### Dashboard

##### `GET /teacher/:teacherId/dashboard`

**Access:** TEACHER, ADMIN
**Description:** Returns comprehensive dashboard data for a teacher.

**URL Params:** `teacherId` (string, required)

---

##### `GET /teacher/user/:userId/dashboard`

**Access:** TEACHER, ADMIN
**Description:** Same as above but resolves by user ID.

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | No teacher profile found for this user ID |

---

#### Department Assignment (ADMIN only)

##### `POST /teacher/:teacherId/assign-department`

**Access:** ADMIN only
**Description:** Assigns a teacher to a department.

**URL Params:** `teacherId` (string, required)

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `teacherId` | string | Yes |
| `departmentId` | string | Yes |

---

##### `POST /teacher/:teacherId/remove-department`

**Access:** ADMIN only
**Description:** Removes a teacher from their department.

**URL Params:** `teacherId` (string, required)

---

##### `POST /teacher/bulk-assign-department`

**Access:** ADMIN only
**Description:** Assigns multiple teachers to a department at once.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherIds` | string[] | Yes | Min 1 item |
| `departmentId` | string | Yes | - |

---

##### `GET /teacher/unassigned`

**Access:** ADMIN only
**Description:** Lists teachers not assigned to any department.

---

### 6.6 Attendance Module

**Base path:** `/api/v1/attendance`

---

#### `POST /attendance/`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Records a single attendance entry for a student in a course.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | Yes | Min 1 character |
| `courseId` | string | Yes | Min 1 character |
| `date` | string | Yes | Valid date string |
| `status` | string | No | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'`. Default: `'PRESENT'` |
| `checkIn` | string | No | Valid date string |
| `checkOut` | string | No | Valid date string |
| `notes` | string | No | - |

**Success Response:** `201 Created`

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Duplicate attendance (same userId + courseId + date) |

---

#### `POST /attendance/bulk-mark`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Records attendance for multiple students in a course at once.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | Min 1 character |
| `date` | string | Yes | Valid date string |
| `attendances` | array | Yes | Min 1 item |
| `attendances[].userId` | string | Yes | Min 1 character |
| `attendances[].status` | string | Yes | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `attendances[].notes` | string | No | - |

**Success Response:** `201 Created`

---

#### `POST /attendance/session`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Creates an attendance session (a time window during which attendance can be marked).

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | Min 1 character |
| `teacherId` | string | Yes | Min 1 character |
| `startTime` | string | Yes | Valid date string |
| `endTime` | string | No | Valid date string |
| `location` | string | No | - |
| `notes` | string | No | - |

**Success Response:** `201 Created`

---

#### `POST /attendance/sessions`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Alternate endpoint for creating attendance sessions (same as above, uses a different controller).

---

#### `GET /attendance/sessions/active`

**Access:** Authenticated
**Description:** Gets the currently active attendance session for a course/teacher pair.

**Query Params:**

| Param | Type | Required |
|-------|------|----------|
| `courseId` | string | Yes |
| `teacherId` | string | Yes |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing courseId or teacherId |

---

#### `GET /attendance/sessions`

**Access:** Authenticated
**Description:** Lists attendance sessions with filters.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | No | - |
| `teacherId` | string | No | - |
| `isActive` | string | No | `'true'` or `'false'` |
| `page` | string | No | Numeric |
| `limit` | string | No | Numeric |

**Success Response:** `200 OK` with sessions and pagination meta.

---

#### `GET /attendance/sessions/:sessionId/stats`

**Access:** Authenticated
**Description:** Gets real-time statistics for a specific attendance session (useful for polling during an active session).

**URL Params:** `sessionId` (string, required)

---

#### `POST /attendance/sessions/:id/end`

**Access:** Authenticated
**Description:** Ends an active attendance session.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `teacherId` | string | Yes |

---

#### `GET /attendance/sessions/:id`

**Access:** Authenticated
**Description:** Retrieves a specific attendance session by ID.

**URL Params:** `id` (string, required)

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Session not found |

---

#### `GET /attendance/`

**Access:** Authenticated
**Description:** Lists attendance records with comprehensive filtering.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | No | - |
| `userId` | string | No | - |
| `status` | string | No | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `startDate` | string | No | Valid date string |
| `endDate` | string | No | Valid date string |
| `batchId` | string | No | - |
| `departmentId` | string | No | - |
| `reportType` | string | No | - |
| `page` | string | No | Numeric |
| `limit` | string | No | Numeric |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |
| `sort` | string | No | - |

**Success Response:** `200 OK` with paginated attendance records.

---

#### `PATCH /attendance/:id`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Updates an existing attendance record.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | string | No | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `checkIn` | string | No | Valid date string |
| `checkOut` | string | No | Valid date string |
| `notes` | string | No | - |

---

#### `GET /attendance/:id`

**Access:** Authenticated
**Description:** Retrieves a single attendance record by ID.

**URL Params:** `id` (string, required)

---

#### `GET /attendance/course/:id/summary`

**Access:** Authenticated
**Description:** Gets attendance summary for a specific course.

**URL Params:** `id` (string, required -- courseId)

**Query Params:** `startDate?`, `endDate?`

---

#### `GET /attendance/student/:userId/summary`

**Access:** Authenticated
**Description:** Gets attendance summary for a specific student.

**URL Params:** `userId` (string, required)

**Query Params:** `startDate?`, `endDate?`

---

#### `GET /attendance/dashboard`

**Access:** TEACHER, ADMIN, SUPER_ADMIN
**Description:** Returns overall attendance dashboard data with aggregate statistics.

---

### 6.7 Leave Module

**Base path:** `/api/v1/leave`

---

#### `POST /leave/`

**Access:** Authenticated
**Description:** Submits a new leave request. The `userId` in the body identifies who the leave is for.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | Yes | Min 1 character |
| `startDate` | string | Yes | Valid date string |
| `endDate` | string | Yes | Valid date string, must be >= startDate |
| `reason` | string | Yes | Min 5 characters |

**Success Response:** `201 Created`

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | endDate before startDate |

---

#### `GET /leave/`

**Access:** Authenticated
**Description:** Lists leave requests with filtering and pagination.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | No | - |
| `studentId` | string | No | - |
| `teacherId` | string | No | - |
| `status` | string | No | `'PENDING'`, `'APPROVED'`, `'REJECTED'` |
| `type` | string | No | `'SICK'`, `'PERSONAL'`, `'VACATION'`, `'ACADEMIC'`, `'EMERGENCY'` |
| `leaveType` | string | No | Same as `type` (alias) |
| `startDate` | string | No | Valid date |
| `endDate` | string | No | Valid date |
| `academicYear` | string | No | - |
| `page` | string | No | Numeric |
| `limit` | string | No | Numeric |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

---

#### `GET /leave/:id`

**Access:** Authenticated
**Description:** Retrieves a specific leave request.

**URL Params:** `id` (string, required)

---

#### `PATCH /leave/:id`

**Access:** Authenticated
**Description:** Updates a leave request (only possible while status is PENDING).

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `startDate` | string | No | Valid date |
| `endDate` | string | No | Valid date, must be >= startDate if both provided |
| `reason` | string | No | Min 5 characters |

---

#### `DELETE /leave/:id`

**Access:** Authenticated
**Description:** Deletes a leave request.

**URL Params:** `id` (string, required)

---

#### `GET /leave/my-leaves`

**Access:** Authenticated
**Description:** Retrieves leave requests belonging to the currently authenticated user.

**Query Params:** Same as `GET /leave/`

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | User ID not found in token |

---

#### `GET /leave/pending`

**Access:** TEACHER, ADMIN
**Description:** Retrieves all leave requests with PENDING status.

**Query Params:** Same as `GET /leave/` (status is forced to `PENDING`).

---

#### `PATCH /leave/:id/approve`

**Access:** TEACHER, ADMIN
**Description:** Approves a leave request.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | string | Yes | `'PENDING'`, `'APPROVED'`, `'REJECTED'` |
| `rejectionReason` | string | No | - |

**Success Response:** `200 OK`

---

#### `PATCH /leave/:id/reject`

**Access:** TEACHER, ADMIN
**Description:** Rejects a leave request. Requires a rejection reason.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | string | Yes | `'PENDING'`, `'APPROVED'`, `'REJECTED'` |
| `rejectionReason` | string | Yes | Required for rejection |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing rejectionReason |

---

#### `POST /leave/bulk-approve`

**Access:** TEACHER, ADMIN
**Description:** Bulk-approves multiple leave requests.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `leaveIds` | string[] | Yes | Non-empty array |

**Success Response:** `200 OK` with results array showing success/failure per item.

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | leaveIds is empty or not an array |

---

#### `POST /leave/bulk-reject`

**Access:** TEACHER, ADMIN
**Description:** Bulk-rejects multiple leave requests.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `leaveIds` | string[] | Yes | Non-empty array |
| `rejectionReason` | string | Yes | Required |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | leaveIds empty, not an array, or missing rejectionReason |

---

#### `GET /leave/stats`

**Access:** TEACHER, ADMIN
**Description:** Returns leave statistics (counts by status, type, etc.).

**Query Params:** Filter params (same as leave filters).

---

#### `GET /leave/dashboard`

**Access:** TEACHER, ADMIN
**Description:** Returns leave management dashboard data.

---

### 6.8 Course Module

**Base path:** `/api/v1/course`

---

#### Courses

##### `POST /course/courses`

**Access:** ADMIN only
**Description:** Creates a new course.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1-200 characters |
| `code` | string | Yes | 1-20 characters |
| `description` | string | No | Max 1000 characters |
| `credits` | number | No | Int, 0-10 |
| `batchId` | string | Yes | CUID format |
| `departmentId` | string | Yes | CUID format |
| `teacherId` | string | Yes | CUID format |
| `subjectId` | string | No | CUID format |
| `semesterId` | string | No | CUID format |
| `semester` | number | No | Int, 1-10 |

**Success Response:** `201 Created`

---

##### `GET /course/courses`

**Access:** ADMIN, TEACHER
**Description:** Lists all courses with filtering.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | string | No | CUID |
| `batchId` | string | No | CUID |
| `teacherId` | string | No | CUID |
| `subjectId` | string | No | CUID |
| `semesterId` | string | No | CUID |
| `isActive` | boolean | No | - |
| `search` | string | No | Max 100 chars |

---

##### `GET /course/courses/stats`

**Access:** ADMIN only
**Description:** Returns aggregate course statistics.

---

##### `GET /course/courses/:courseId`

**Access:** ADMIN, TEACHER

**URL Params:** `courseId` (string, CUID)

---

##### `PATCH /course/courses/:courseId`

**Access:** ADMIN only

**Request Body:** Same fields as create, all optional, plus `isActive: boolean`.

---

##### `DELETE /course/courses/:courseId`

**Access:** ADMIN only

**Success Response:** `204 No Content`

---

#### Course Enrollments

##### `POST /course/enrollments`

**Access:** ADMIN only
**Description:** Enrolls a student in a course.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | Yes | CUID format |
| `courseId` | string | Yes | CUID format |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Duplicate enrollment (same student + course) |

---

##### `GET /course/enrollments`

**Access:** ADMIN, TEACHER
**Description:** Lists course enrollments with filters.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | No | CUID |
| `courseId` | string | No | CUID |

---

##### `GET /course/enrollments/stats`

**Access:** ADMIN only

---

##### `GET /course/enrollments/:enrollmentId`

**Access:** ADMIN, TEACHER

---

##### `DELETE /course/enrollments/:enrollmentId`

**Access:** ADMIN only

**Success Response:** `204 No Content`

---

#### Class Schedules

##### `POST /course/schedules`

**Access:** ADMIN only
**Description:** Creates a class schedule entry.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | string | Yes | CUID format |
| `courseId` | string | Yes | CUID format |
| `batchId` | string | Yes | CUID format |
| `dayOfWeek` | number | Yes | Int, 1-7 |
| `startTime` | string | Yes | `HH:MM` format |
| `endTime` | string | Yes | `HH:MM` format, must be after startTime |
| `room` | string | No | Max 50 characters |
| `semester` | number | No | Int, 1-10 |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | endTime not after startTime |

---

##### `GET /course/schedules`

**Access:** ADMIN, TEACHER
**Description:** Lists class schedules with filters.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | string | No | CUID |
| `courseId` | string | No | CUID |
| `batchId` | string | No | CUID |
| `dayOfWeek` | number | No | Int, 1-7 |
| `semester` | number | No | Int, 1-10 |
| `isActive` | boolean | No | - |

---

##### `GET /course/schedules/stats`

**Access:** ADMIN only

---

##### `GET /course/schedules/:scheduleId`

**Access:** ADMIN, TEACHER

---

##### `PATCH /course/schedules/:scheduleId`

**Access:** ADMIN only

**Request Body:** Same as create, all optional, plus `isActive: boolean`.

---

##### `DELETE /course/schedules/:scheduleId`

**Access:** ADMIN only

**Success Response:** `204 No Content`

---

### 6.9 Organization Module

**Base path:** `/api/v1/organization`

Manages the organizational hierarchy: departments, semesters, batches, and subjects.

---

#### Departments

##### `POST /organization/departments`

**Access:** ADMIN only
**Description:** Creates a new department in the institution.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters |
| `code` | string | Yes | 1-10 characters |
| `description` | string | No | Max 500 characters |
| `headId` | string | No | CUID format (teacher reference) |

**Success Response:** `201 Created`

---

##### `GET /organization/departments`

**Access:** Authenticated
**Description:** Lists all departments with optional filters.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `isActive` | boolean | No | - |
| `status` | string | No | `'all'`, `'active'`, `'inactive'` |
| `search` | string | No | Max 100 chars |
| `headId` | string | No | CUID |

---

##### `GET /organization/departments/stats`

**Access:** Authenticated

---

##### `GET /organization/departments/:departmentId`

**Access:** Authenticated

**URL Params:** `departmentId` (string, CUID)

---

##### `PATCH /organization/departments/:departmentId`

**Access:** ADMIN only

**Request Body:** Same as create, all optional, plus `isActive: boolean`.

---

##### `DELETE /organization/departments/:departmentId`

**Access:** ADMIN only

**Success Response:** `204 No Content`

---

#### Semesters

##### `POST /organization/semesters`

**Access:** ADMIN only
**Description:** Creates a new semester period for a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters |
| `year` | number | Yes | Int, 2000-2100 |
| `departmentId` | string | Yes | CUID format |
| `startDate` | string | Yes | ISO 8601 datetime |
| `endDate` | string | Yes | ISO 8601 datetime, must be after startDate |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | endDate not after startDate |
| 400 | Duplicate semester (same department + year + name) |

---

##### `GET /organization/semesters`

**Access:** Authenticated

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | string | No | CUID |
| `year` | number | No | Int, 2000-2100 |
| `isActive` | boolean | No | - |
| `search` | string | No | Max 100 chars |

---

##### `GET /organization/semesters/stats`

**Access:** Authenticated

---

##### `GET /organization/semesters/:semesterId`

**Access:** Authenticated

---

##### `PATCH /organization/semesters/:semesterId`

**Access:** ADMIN only

**Request Body:** Same as create, all optional, plus `isActive: boolean`.

---

##### `DELETE /organization/semesters/:semesterId`

**Access:** ADMIN only

---

#### Batches

##### `POST /organization/batches`

**Access:** ADMIN only
**Description:** Creates a new batch (student cohort/group).

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters |
| `year` | number | Yes | Int, 2000-2100 |
| `description` | string | No | Max 500 characters |
| `startDate` | string | Yes | ISO 8601 datetime |
| `endDate` | string | Yes | ISO 8601 datetime, must be after startDate |

---

##### `GET /organization/batches`

**Access:** Authenticated

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `year` | number | No | Int, 2000-2100 (coerced from string) |
| `isActive` | boolean | No | - |
| `status` | string | No | `'all'`, `'active'`, `'inactive'` |
| `search` | string | No | Max 100 chars |

---

##### `GET /organization/batches/stats`

**Access:** Authenticated

---

##### `GET /organization/batches/:batchId`

**Access:** Authenticated

---

##### `PATCH /organization/batches/:batchId`

**Access:** ADMIN only

---

##### `DELETE /organization/batches/:batchId`

**Access:** ADMIN only

---

#### Subjects

##### `POST /organization/subjects`

**Access:** ADMIN only
**Description:** Creates a new subject in a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-100 characters |
| `code` | string | Yes | 1-20 characters |
| `description` | string | No | Max 500 characters |
| `credits` | number | No | Int, 0-10 |
| `departmentId` | string | Yes | CUID format |

---

##### `GET /organization/subjects`

**Access:** Authenticated

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | string | No | CUID |
| `isActive` | boolean | No | - |
| `search` | string | No | Max 100 chars |
| `credits` | number | No | Int, 0-10 |

---

##### `GET /organization/subjects/stats`

**Access:** Authenticated

---

##### `GET /organization/subjects/:subjectId`

**Access:** Authenticated

---

##### `PATCH /organization/subjects/:subjectId`

**Access:** ADMIN only

---

##### `DELETE /organization/subjects/:subjectId`

**Access:** ADMIN only

---

#### Overview

##### `GET /organization/overview`

**Access:** Authenticated
**Description:** Returns a high-level overview of the entire organization structure with counts.

---

### 6.10 Assignment Module

**Base path:** `/api/v1/assignments`

All endpoints manage entity-to-entity relationships.

---

#### `POST /assignments/teacher-to-department`

**Access:** ADMIN only
**Description:** Assigns a teacher to a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | string | Yes | CUID format |
| `departmentId` | string | Yes | CUID format |

---

#### `DELETE /assignments/teacher-from-department/:teacherId`

**Access:** ADMIN only
**Description:** Removes a teacher from their current department.

**URL Params:** `teacherId` (string, required)

---

#### `POST /assignments/student-to-batch`

**Access:** ADMIN only
**Description:** Assigns a student to a batch.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | Yes | CUID |
| `batchId` | string | Yes | CUID |

---

#### `POST /assignments/student-to-department`

**Access:** ADMIN only
**Description:** Assigns a student to a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | Yes | CUID |
| `departmentId` | string | Yes | CUID |

---

#### `POST /assignments/teacher-to-course`

**Access:** ADMIN only
**Description:** Assigns a teacher to a course.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | string | Yes | CUID |
| `courseId` | string | Yes | CUID |

---

#### `POST /assignments/course-to-department`

**Access:** ADMIN only
**Description:** Associates a course with a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | CUID |
| `departmentId` | string | Yes | CUID |

---

#### `POST /assignments/course-to-batch`

**Access:** ADMIN only
**Description:** Associates a course with a batch.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | CUID |
| `batchId` | string | Yes | CUID |

---

#### `POST /assignments/student-to-course`

**Access:** ADMIN, TEACHER
**Description:** Enrolls a student in a course.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | string | Yes | CUID |
| `courseId` | string | Yes | CUID |

---

#### `DELETE /assignments/student-from-course/:studentId/:courseId`

**Access:** ADMIN, TEACHER
**Description:** Removes a student from a course.

**URL Params:** `studentId` (string), `courseId` (string)

---

#### `POST /assignments/department-head`

**Access:** ADMIN only
**Description:** Assigns a teacher as head of a department.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `departmentId` | string | Yes | CUID |
| `teacherId` | string | Yes | CUID |

---

### 6.11 Dashboard Module

**Base path:** `/api/v1/dashboard`

All endpoints require **ADMIN** role. Controller methods embed `AuthorizeRequest('ADMIN')` middleware.

---

#### `GET /dashboard/overview`

**Access:** ADMIN only
**Description:** Returns high-level dashboard overview with aggregate statistics across the entire system.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `startDate` | string | No | ISO 8601 datetime |
| `endDate` | string | No | ISO 8601 datetime |
| `departmentId` | string | No | - |
| `batchId` | string | No | - |

---

#### `GET /dashboard/stats/class-level`

**Access:** ADMIN only
**Description:** Returns attendance statistics at the class/course level.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | No | - |
| `batchId` | string | No | - |
| `departmentId` | string | No | - |
| `startDate` | string | No | ISO 8601 |
| `endDate` | string | No | ISO 8601 |
| `page` | number | No | Int, positive |
| `limit` | number | No | Int, positive |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

---

#### `GET /dashboard/stats/subject-level`

**Access:** ADMIN only
**Description:** Returns attendance statistics at the subject level.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `subjectId` | string | No | - |
| `batchId` | string | No | - |
| `departmentId` | string | No | - |
| `startDate` | string | No | ISO 8601 |
| `endDate` | string | No | ISO 8601 |
| `page` | number | No | Int, positive |
| `limit` | number | No | Int, positive |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

---

#### `GET /dashboard/stats/teacher-performance`

**Access:** ADMIN only
**Description:** Returns teacher performance analytics (attendance rates, class frequency, etc.).

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | string | No | - |
| `courseId` | string | No | - |
| `batchId` | string | No | - |
| `departmentId` | string | No | - |
| `startDate` | string | No | ISO 8601 |
| `endDate` | string | No | ISO 8601 |
| `page` | number | No | Int, positive |
| `limit` | number | No | Int, positive |
| `sortBy` | string | No | - |
| `sortOrder` | string | No | `'asc'`, `'desc'` |

---

#### `GET /dashboard/alerts`

**Access:** ADMIN only
**Description:** Returns alerts for students or courses below a specified attendance threshold.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `threshold` | number | No | Int, 0-100 |
| `page` | number | No | Int, positive |
| `limit` | number | No | Int, positive |

---

#### `GET /dashboard/attendance-report`

**Access:** ADMIN only
**Description:** Generates a comprehensive attendance report with flexible grouping.

**Query Params:**

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `reportType` | string | No | `'overall'`, `'department'`, `'batch'`, `'course'`, `'student'`, `'teacher'`. Default: `'overall'` |
| `startDate` | string | No | ISO 8601 |
| `endDate` | string | No | ISO 8601 |
| `departmentIds` | string | No | Comma-separated IDs |
| `batchIds` | string | No | Comma-separated IDs |
| `courseIds` | string | No | Comma-separated IDs |

---

### 6.12 Notification Module

**Base path:** `/api/v1/notification`

> **Warning:** Most notification routes lack authentication middleware. Only `broadcast` and `resend-email` are restricted to ADMIN/SUPER_ADMIN via comments, but enforcement varies.

---

#### `POST /notification/send`

**Access:** Authenticated (no explicit role guard)
**Description:** Sends an in-app notification to a single user.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `recipientId` | string | Yes | Min 1 character |
| `title` | string | Yes | 1-200 characters |
| `message` | string | Yes | 1-2000 characters |
| `type` | string | No | `'IN_APP'`, `'EMAIL'`, `'BOTH'`. Default: `'IN_APP'` |
| `priority` | string | No | `'LOW'`, `'MEDIUM'`, `'HIGH'`. Default: `'MEDIUM'` |
| `scheduledAt` | date | No | Coerced to Date |

**Success Response:** `201 Created`

---

#### `POST /notification/send-email`

**Access:** Authenticated (no explicit role guard)
**Description:** Sends an email notification to a user.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `recipientId` | string | Yes | Min 1 character |
| `title` | string | Yes | 1-200 characters |
| `message` | string | Yes | 1-2000 characters |
| `type` | string | Yes | `'EMAIL'` or `'BOTH'` |
| `priority` | string | No | `'LOW'`, `'MEDIUM'`, `'HIGH'`. Default: `'MEDIUM'` |
| `scheduledAt` | date | No | Coerced to Date |
| `emailOptions` | object | No | - |
| `emailOptions.to` | string[] | No | Each must be valid email |
| `emailOptions.cc` | string[] | No | Each must be valid email |
| `emailOptions.bcc` | string[] | No | Each must be valid email |
| `emailOptions.attachments` | array | No | `{ filename, path, contentType? }` |

---

#### `POST /notification/send-bulk`

**Access:** Authenticated (no explicit role guard)
**Description:** Sends notifications to multiple users at once.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `recipientIds` | string[] | Yes | Min 1 item |
| `title` | string | Yes | 1-200 characters |
| `message` | string | Yes | 1-2000 characters |
| `type` | string | No | Default: `'IN_APP'` |
| `priority` | string | No | Default: `'MEDIUM'` |
| `scheduledAt` | date | No | - |

---

#### `POST /notification/broadcast`

**Access:** ADMIN, SUPER_ADMIN
**Description:** Broadcasts a notification to all users of a specific role (or all users).

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `role` | string | Yes | `'ADMIN'`, `'TEACHER'`, `'STUDENT'`, `'ALL'` |
| `title` | string | Yes | 1-200 characters |
| `message` | string | Yes | 1-2000 characters |
| `type` | string | No | Default: `'IN_APP'` |
| `priority` | string | No | Default: `'MEDIUM'` |

---

#### `GET /notification/`

**Access:** Authenticated (no explicit role guard)
**Description:** Lists notifications with comprehensive filtering and pagination.

**Query Params:**

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `page` | number | No | Int, positive | 1 |
| `limit` | number | No | Int, positive, max 100 | 20 |
| `sortBy` | string | No | `'createdAt'`, `'updatedAt'`, `'title'` | `'createdAt'` |
| `sortOrder` | string | No | `'asc'`, `'desc'` | `'desc'` |
| `type` | string | No | `'IN_APP'`, `'EMAIL'`, `'BOTH'` | - |
| `readStatus` | boolean | No | Coerced from string | - |
| `emailStatus` | string | No | `'PENDING'`, `'SENT'`, `'FAILED'` | - |
| `recipientId` | string | No | - | - |
| `search` | string | No | - | - |
| `startDate` | date | No | - | - |
| `endDate` | date | No | Must be >= startDate | - |

---

#### `GET /notification/:id`

**Access:** Authenticated

**URL Params:** `id` (string, required)

---

#### `PATCH /notification/:id`

**Access:** Authenticated
**Description:** Updates a notification's content or status.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | No | 1-200 characters |
| `message` | string | No | 1-2000 characters |
| `type` | string | No | `'IN_APP'`, `'EMAIL'`, `'BOTH'` |
| `readStatus` | boolean | No | - |
| `emailStatus` | string | No | `'PENDING'`, `'SENT'`, `'FAILED'` |

---

#### `PATCH /notification/:id/read`

**Access:** Authenticated
**Description:** Marks a notification as read or unread.

**URL Params:** `id` (string, required)

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `readStatus` | boolean | Yes |

---

#### `DELETE /notification/:id`

**Access:** Authenticated

**Success Response:** `204 No Content`

---

#### `POST /notification/:id/resend-email`

**Access:** ADMIN, SUPER_ADMIN
**Description:** Retries sending a failed email notification.

**URL Params:** `id` (string, required)

---

#### `GET /notification/stats`

**Access:** Authenticated
**Description:** Returns notification statistics, optionally for a specific recipient.

**Query Params:**

| Param | Type | Required |
|-------|------|----------|
| `recipientId` | string | No |
| `startDate` | date | No |
| `endDate` | date | No |

---

#### `PATCH /notification/mark-all-read/:recipientId`

**Access:** Authenticated
**Description:** Marks all notifications for a specific recipient as read.

**URL Params:** `recipientId` (string, required)

---

#### `DELETE /notification/delete-all-read/:recipientId`

**Access:** Authenticated
**Description:** Deletes all read notifications for a specific recipient.

**URL Params:** `recipientId` (string, required)

**Success Response:** `204 No Content`

---

### 6.13 Settings Module

**Base path:** `/api/v1/settings`

---

#### `GET /settings/`

**Access:** ADMIN only
**Description:** Retrieves application settings, optionally filtered by group.

**Query Params:**

| Param | Type | Required |
|-------|------|----------|
| `group` | string | No |

**Success Response:** `200 OK` with settings array.

---

#### `PATCH /settings/`

**Access:** ADMIN only
**Description:** Bulk-updates application settings. Accepts arbitrary key-value pairs.

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `group` | string | No |
| `*` | any | No | `.passthrough()` -- accepts any additional fields |

**Success Response:** `200 OK`

---

### 6.14 Import Module

**Base path:** `/api/v1/import`

---

#### `POST /import/validate`

**Access:** ADMIN only
**Description:** Validates an uploaded file (CSV/Excel) before actual import. Returns validation results including errors and warnings.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | Yes | `'STUDENT'`, `'TEACHER'`, `'COURSE'`, `'DEPARTMENT'`, `'BATCH'` |

**Also requires:** `req.file` (multipart file upload via Multer)

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | No file uploaded |

---

#### `POST /import/execute`

**Access:** ADMIN only
**Description:** Executes the data import from previously validated data.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | Yes | `'STUDENT'`, `'TEACHER'`, `'COURSE'`, `'DEPARTMENT'`, `'BATCH'` |
| `data` | array | Yes | Array of records to import |

**Success Response:** `200 OK` with import results.

---

### 6.15 Bulk Module

**Base path:** `/api/v1/bulk`

All endpoints require authentication + ADMIN role (applied at router level).

---

#### `POST /bulk/create`

**Access:** ADMIN only
**Description:** Creates multiple entities of a specified type in one operation.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `entityType` | string | Yes | `'User'`, `'Student'`, `'Teacher'`, `'Course'`, `'Department'`, `'Attendance'` |
| `data` | array | Yes | Min 1 item. Array of entity objects. |
| `options` | object | No | - |
| `options.continueOnError` | boolean | No | Continue processing on individual failures |
| `options.skipDuplicates` | boolean | No | Skip duplicate records silently |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing entityType or data array |

---

#### `PATCH /bulk/update`

**Access:** ADMIN only
**Description:** Updates multiple entities by IDs with the same data.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `entityType` | string | Yes | Same enum as create |
| `ids` | string[] | Yes | Min 1 item |
| `data` | object | Yes | Update data (passthrough -- any fields) |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing entityType, ids array, or data |

---

#### `DELETE /bulk/delete`

**Access:** ADMIN only
**Description:** Deletes multiple entities by their IDs.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `entityType` | string | Yes | Same enum as create |
| `ids` | string[] | Yes | Min 1 item |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing entityType or ids array |

---

#### `POST /bulk/mark-attendance`

**Access:** ADMIN only
**Description:** Marks attendance for multiple students in a course on a specific date.

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | string | Yes | - |
| `date` | string | Yes | ISO 8601 datetime |
| `attendance` | array | Yes | Min 1 item |
| `attendance[].studentId` | string | Yes | - |
| `attendance[].status` | string | Yes | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `attendance[].notes` | string | No | - |

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing courseId, date, or attendance array |

---

### 6.16 Audit Module

**Base path:** `/api/v1/audit`

All endpoints require authentication (applied at router level). ADMIN-only endpoints use `adminGuard`.

---

#### `GET /audit/`

**Access:** ADMIN only
**Description:** Retrieves all audit logs with comprehensive filtering, pagination, and sorting.

**Query Params:**

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `userId` | string | No | - | - |
| `action` | string | No | AuditAction enum value (see below) | - |
| `entity` | string | No | - | - |
| `entityId` | string | No | - | - |
| `startDate` | string | No | ISO 8601 | - |
| `endDate` | string | No | ISO 8601 | - |
| `success` | string | No | Transformed to boolean | - |
| `sortBy` | string | No | - | - |
| `sortOrder` | string | No | - | - |
| `page` | string | No | Transformed to number | 1 |
| `limit` | string | No | Transformed to number | 50 |

**AuditAction enum values:** `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_CHANGE`, `PASSWORD_RESET`, `ROLE_CHANGE`, `PERMISSION_CHANGE`, `EXPORT`, `IMPORT`, `BULK_OPERATION`, `ATTENDANCE_MARKED`, `ATTENDANCE_MODIFIED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `SETTINGS_CHANGED`

**Success Response:** `200 OK` with paginated audit logs.

---

#### `GET /audit/my-logs`

**Access:** Authenticated
**Description:** Retrieves audit logs belonging to the currently authenticated user.

**Query Params:** `page?`, `limit?`

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | User ID not found in token |

---

#### `GET /audit/entity/:entityId`

**Access:** ADMIN only
**Description:** Retrieves all audit logs for a specific entity (e.g., a specific user, course, etc.).

**URL Params:** `entityId` (string, required)

**Query Params:** `page?`, `limit?`

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing entityId |

---

#### `GET /audit/failed-logins`

**Access:** ADMIN only
**Description:** Retrieves failed login attempts within a time window.

**Query Params:**

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `hours` | string | No | Transforms to number, 1-168 | 24 |
| `page` | string | No | Transforms to number | - |
| `limit` | string | No | Transforms to number | - |

---

#### `GET /audit/recent-activity`

**Access:** ADMIN only
**Description:** Retrieves recent system-wide activity.

**Query Params:**

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `hours` | string | No | Transforms to number, 1-168 | 24 |
| `limit` | string | No | Transforms to number, 1-500 | 100 |

---

#### `GET /audit/stats`

**Access:** ADMIN only
**Description:** Returns audit statistics over a number of days.

**Query Params:**

| Param | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `days` | string | No | Transforms to number, 1-365 | 30 |

---

#### `POST /audit/cleanup`

**Access:** ADMIN only
**Description:** Deletes audit logs older than a specified number of days.

**Request Body:**

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `daysToKeep` | number | No | Min 1, Max 365 | 90 |

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Deleted 42 old audit logs",
  "data": { "deleted": 42 }
}
```

---

### 6.17 Session Module

**Base path:** `/api/v1/sessions`

Manages user login sessions (JWT refresh token sessions). All endpoints require authentication (applied at router level).

---

#### `GET /sessions/my-sessions`

**Access:** Authenticated
**Description:** Returns all active sessions for the authenticated user. Identifies which session is the current one based on the Bearer token.

**Success Response:** `200 OK` with sessions array (each marked with `isCurrent: boolean`).

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | User ID not found in token |

---

#### `GET /sessions/my-sessions/stats`

**Access:** Authenticated
**Description:** Returns session statistics for the current user (total, active, expired counts).

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

#### `GET /sessions/user/:userId`

**Access:** ADMIN only
**Description:** Retrieves all sessions for a specific user (admin monitoring).

**URL Params:** `userId` (string, required)

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing userId |

---

#### `DELETE /sessions/:sessionId`

**Access:** Authenticated
**Description:** Revokes (invalidates) a specific session.

**URL Params:** `sessionId` (string, required)

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

#### `DELETE /sessions/revoke-others`

**Access:** Authenticated
**Description:** Revokes all sessions except the current one (log out everywhere else).

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated or no token in header |

---

#### `DELETE /sessions/revoke-all`

**Access:** Authenticated
**Description:** Revokes ALL sessions including the current one (full logout everywhere).

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

#### `POST /sessions/cleanup`

**Access:** ADMIN only
**Description:** Cleans up expired sessions system-wide.

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sessions cleaned up successfully",
  "data": { "deleted": 15 }
}
```

---

## 7. Data Models

### User

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `_id` | ObjectId | Auto | - | Primary key |
| `email` | string | Yes | Unique, lowercase | Email address |
| `username` | string | No | Unique (sparse) | Display name |
| `password` | string | Yes | Excluded from JSON output | Bcrypt hash |
| `name` | string | Yes | - | Full name |
| `role` | string | Yes | `'ADMIN'`, `'TEACHER'`, `'STUDENT'` | Default: `'STUDENT'` |
| `status` | string | Yes | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'`, `'PENDING'` | Default: `'ACTIVE'` |
| `avatar` | string | No | - | Profile image URL |
| `phone` | string | No | - | Phone number |
| `address` | string | No | - | Address |
| `dateOfBirth` | Date | No | - | Date of birth |
| `departmentId` | ObjectId | No | Ref: Department | Department reference |

**Indexes:** `email` (unique), `username` (unique sparse), `role`, `status`, `departmentId`, `createdAt` (desc)

### Student

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | - |
| `userId` | ObjectId | Yes | Unique, Ref: User |
| `studentId` | string | Yes | Unique |
| `batchId` | ObjectId | No | Ref: Batch |
| `departmentId` | ObjectId | No | Ref: Department |
| `semester` | number | No | 1-8, Default: 1 |
| `enrollmentDate` | Date | No | - |
| `gpa` | number | No | 0-4.0 |
| `credits` | number | No | Min 0 |
| `isActive` | boolean | No | Default: true |

**Cascade:** Deleting a student also deletes the associated User.

### Teacher

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | - |
| `userId` | ObjectId | Yes | Unique, Ref: User |
| `employeeId` | string | Yes | Unique |
| `departmentId` | ObjectId | No | Ref: Department |
| `designation` | string | No | - |
| `specialization` | string | No | - |
| `joinDate` | Date | No | - |
| `isActive` | boolean | No | Default: true |

**Cascade:** Deleting a teacher also deletes the associated User.

### Course

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | - |
| `title` | string | Yes | - |
| `code` | string | Yes | Unique |
| `description` | string | No | - |
| `credits` | number | No | - |
| `batchId` | ObjectId | No | Ref: Batch |
| `departmentId` | ObjectId | No | Ref: Department |
| `teacherId` | ObjectId | No | Ref: User |
| `subjectId` | ObjectId | No | Ref: Subject |
| `semesterId` | ObjectId | No | Ref: Semester |
| `semester` | number | No | 1-8 |
| `isActive` | boolean | No | Default: true |

### CourseEnrollment

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `studentId` | ObjectId | Yes | Ref: User |
| `courseId` | ObjectId | Yes | Ref: Course |
| `enrolledAt` | Date | No | Default: now |

**Compound unique index:** `studentId` + `courseId`

### ClassSchedule

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `teacherId` | ObjectId | No | Ref: User |
| `courseId` | ObjectId | No | Ref: Course |
| `batchId` | ObjectId | No | Ref: Batch |
| `dayOfWeek` | number | No | 0-6 |
| `startTime` | string | No | HH:MM format |
| `endTime` | string | No | HH:MM format |
| `room` | string | No | - |
| `semester` | number | No | - |
| `isActive` | boolean | No | Default: true |

### Attendance

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | Ref: User |
| `courseId` | ObjectId | Yes | Ref: Course |
| `date` | Date | Yes | - |
| `status` | string | Yes | `'PRESENT'`, `'ABSENT'`, `'LATE'`, `'EXCUSED'` |
| `checkIn` | Date | No | - |
| `checkOut` | Date | No | - |
| `notes` | string | No | - |
| `markedBy` | ObjectId | No | Ref: User |
| `attendanceSessionId` | ObjectId | No | Ref: AttendanceSession |

**Compound unique index:** `userId` + `courseId` + `date`

### AttendanceSession

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `courseId` | ObjectId | Yes | Ref: Course |
| `teacherId` | ObjectId | Yes | Ref: User |
| `date` | Date | No | Default: now |
| `startTime` | Date | No | - |
| `endTime` | Date | No | - |
| `isActive` | boolean | No | Default: true |
| `location` | string | No | - |
| `notes` | string | No | - |

### LeaveRequest

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | Ref: User |
| `studentId` | ObjectId | No | Ref: Student |
| `teacherId` | ObjectId | No | Ref: Teacher |
| `startDate` | Date | Yes | - |
| `endDate` | Date | Yes | Must be >= startDate |
| `reason` | string | Yes | - |
| `type` | string | No | `'SICK'`, `'PERSONAL'`, `'VACATION'`, `'ACADEMIC'`, `'EMERGENCY'` |
| `status` | string | No | `'PENDING'`, `'APPROVED'`, `'REJECTED'`. Default: `'PENDING'` |
| `approvedBy` | ObjectId | No | Ref: User |
| `approvedAt` | Date | No | - |
| `rejectionReason` | string | No | - |
| `documents` | string | No | - |
| `isPaid` | boolean | No | Default: false |

### LeaveBalance

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | - |
| `studentId` | ObjectId | No | - |
| `teacherId` | ObjectId | No | - |
| `academicYear` | string | Yes | - |
| `sickLeave` | number | No | Default: 0 |
| `personalLeave` | number | No | Default: 0 |
| `vacationLeave` | number | No | Default: 0 |
| `usedSick` | number | No | Default: 0 |
| `usedPersonal` | number | No | Default: 0 |
| `usedVacation` | number | No | Default: 0 |

**Compound unique:** `userId` + `academicYear`

### LeavePolicy

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique |
| `description` | string | No | - |
| `academicYear` | string | Yes | - |
| `maxSickLeave` | number | No | Default: 5 |
| `maxPersonalLeave` | number | No | Default: 3 |
| `maxVacationLeave` | number | No | Default: 10 |
| `requireDocuments` | boolean | No | Default: false |
| `minAdvanceDays` | number | No | Default: 1 |
| `maxConsecutiveDays` | number | No | Default: 7 |
| `isActive` | boolean | No | Default: true |

### Department

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique |
| `code` | string | Yes | Unique, uppercase |
| `description` | string | No | - |
| `headId` | ObjectId | No | Ref: Teacher |
| `isActive` | boolean | No | Default: true |

### Batch

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique |
| `year` | number | Yes | - |
| `description` | string | No | - |
| `startDate` | Date | No | - |
| `endDate` | Date | No | - |
| `isActive` | boolean | No | Default: true |

### Semester

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | - |
| `year` | number | Yes | - |
| `departmentId` | ObjectId | Yes | Ref: Department |
| `startDate` | Date | Yes | - |
| `endDate` | Date | Yes | - |
| `isActive` | boolean | No | Default: true |

**Compound unique:** `departmentId` + `year` + `name`

### Subject

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique |
| `code` | string | Yes | Unique, uppercase |
| `description` | string | No | - |
| `credits` | number | No | - |
| `departmentId` | ObjectId | No | Ref: Department |
| `isActive` | boolean | No | Default: true |

### Notification

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | - |
| `message` | string | Yes | - |
| `type` | string | No | `'IN_APP'`, `'EMAIL'`, `'BOTH'` |
| `readStatus` | boolean | No | Default: false |
| `emailStatus` | string | No | `'PENDING'`, `'SENT'`, `'FAILED'` |
| `recipientId` | ObjectId | Yes | Ref: User |

### Session (Login Session)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | Ref: User |
| `token` | string | Yes | Unique |
| `ipAddress` | string | No | - |
| `userAgent` | string | No | - |
| `lastActive` | Date | No | - |
| `expiresAt` | Date | Yes | TTL index (auto-delete) |

### AuditLog

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | ObjectId | No | Ref: User |
| `action` | string | Yes | AuditAction enum |
| `entity` | string | No | - |
| `entityId` | string | No | - |
| `changes` | Mixed | No | JSON object |
| `ipAddress` | string | No | - |
| `userAgent` | string | No | - |
| `success` | boolean | No | - |
| `errorMessage` | string | No | - |
| `createdAt` | Date | Auto | - |

### Setting

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `key` | string | Yes | Unique |
| `value` | Mixed | Yes | - |
| `group` | string | No | Default: `'GENERAL'` |

### Auth Tokens (RefreshToken, PasswordResetToken, EmailVerificationToken)

All three share the same schema:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | string | Yes | Unique |
| `userId` | ObjectId | Yes | Ref: User |
| `expiresAt` | Date | Yes | TTL index (auto-delete on expiry) |

---

## 8. Error Reference

### Error Types

| Error Type | HTTP Status | Trigger | Source |
|------------|-------------|---------|--------|
| **ZodError** | 400 | Request body/params/query fails Zod validation | `validateRequest` middleware |
| **Mongoose ValidationError** | 400 | Document fails Mongoose schema validation | Database save/update |
| **Mongoose CastError** | 400 | Invalid ObjectId format in query | Database query |
| **MongoDB Duplicate Key** (code 11000) | 400 | Unique constraint violation | Database insert/update |
| **DocumentNotFoundError** | 404 | Query returns no document | Database query |
| **AppError (401)** | 401 | Missing/invalid JWT, wrong password | Auth middleware |
| **AppError (403)** | 403 | Insufficient role/permissions | Authorization middleware |
| **AppError (404)** | 404 | Resource not found | Service layer |
| **AppError (409)** | 409 | Conflict (e.g., duplicate registration) | Service layer |
| **Generic Error** | 500 | Unhandled exceptions | Fallback handler |
| **Rate Limit** | 429 | Too many requests | express-rate-limit |

### Error Response Structure

```typescript
interface ErrorResponse {
  statusCode: number;
  success: false;
  message: string;
  errorSources?: Array<{       // Development only
    path: string | number;
    message: string;
  }>;
  stack?: string;               // Development only
}
```

### Common Error Messages

| Status | Message | Cause |
|--------|---------|-------|
| 400 | `"Validation Error"` | Zod validation failure |
| 400 | `"Invalid ID Provided"` | Malformed MongoDB ObjectId |
| 400 | `"<field> already exists"` | Duplicate key violation |
| 400 | `"No file uploaded"` | Import without file |
| 400 | `"courseId and teacherId are required"` | Active session query missing params |
| 400 | `"Rejection reason is required"` | Leave rejection without reason |
| 401 | `"Unauthorized Access"` | Missing or invalid JWT |
| 401 | `"Invalid credentials"` | Wrong email/password |
| 401 | `"User not found"` | Token references deleted user |
| 403 | `"Forbidden: You are not authorized"` | Role not in allowed list |
| 403 | `"Only admin and teacher accounts can login here"` | Non-admin login at admin endpoint |
| 404 | `"User not found"` | User ID doesn't exist |
| 404 | `"Teacher profile not found"` | No teacher profile for user |
| 404 | `"Student profile not found"` | No student profile for user |
| 404 | `"Attendance session not found"` | Invalid session ID |
| 404 | `"Not Found"` | Generic 404 fallback |
| 409 | `"Email already exists"` / `"Username already exists"` | Duplicate registration |
| 429 | `"Too many requests"` | Rate limit exceeded |
| 500 | `"Something Went Wrong"` | Unhandled server error |

---

## 9. Known Issues & Inconsistencies

### Critical

1. **`sendResponse` always sends HTTP 200:** The `sendResponse` utility at `src/app/utils/sendResponse.ts:29` hardcodes `res.status(200)` regardless of the `statusCode` property in the response data. This means a `201 Created` response actually arrives as HTTP 200. The `sendPaginatedResponse` function does not have this bug.

2. **`SUPER_ADMIN` role cannot be persisted:** The auth middleware references `SUPER_ADMIN` in `isAdmin`, `isSuperAdmin`, and `authorizeOwnerOrAdmin` guards, but the User schema only allows `['ADMIN', 'TEACHER', 'STUDENT']`. Setting `role: 'SUPER_ADMIN'` would fail Mongoose validation.

3. **`AppError` stack trace bug:** In `src/app/errors/AppError.ts`, the default `stack` parameter is `' '` (a space), not an empty string. Since `if (stack)` evaluates a space as truthy, `Error.captureStackTrace` never executes, resulting in meaningless stack traces.

### Security

4. **Notification routes lack authentication:** Most notification endpoints (`/send`, `/send-email`, `/send-bulk`, all `GET`, `PATCH`, `DELETE`) have no `AuthorizeRequest` or `authenticate` middleware. Anyone can send notifications or read/delete them without authentication.

5. **Console.log in production:** `sendResponse` logs the full response payload, and `auth.middleware.ts:42` logs `req.user`. These remain active in production.

### Architectural

6. **Two auth middleware systems coexist:** The legacy `AuthorizeRequest` in `src/app/middlewares/auth.ts` and the modern `AuthMiddleware` in `src/app/modules/auth/auth.middleware.ts` serve the same purpose with slightly different APIs. Most modules use the legacy system; audit, session, and bulk modules use the new one.

7. **Dead code -- `attendanceSession.route.ts`:** This file exists at `src/app/modules/attendance/attendanceSession.route.ts` but is NOT mounted in the central route registry (`src/app/routes/index.ts`). Its routes are duplicated inline within `attendance.route.ts`.

8. **Audit controller inconsistency:** The audit controller uses raw `async (req, res, next)` with manual `try/catch` and `res.status().json()` instead of the project's standard `catchAsync` + `sendResponse` pattern used everywhere else.

9. **Duplicate type definitions:** `UserRole`, `UserStatus`, `AttendanceStatus`, `LeaveStatus`, `LeaveType` are defined in multiple locations (`types/enums.ts`, `types/index.ts`, and individual module `*.interface.ts` files), creating maintenance burden and potential drift.

10. **CLI scaffolding tool references Prisma:** The `.bin/cli.js` module scaffolding tool still generates Prisma-based templates, but the project has migrated to Mongoose.

### Minor

11. **Auth rate limiter mismatch:** Comment says "5 requests per 15 minutes" but `max` is set to `50` in `src/app.ts`.

12. **Global error handler duplicate checks:** `CastError` and `ValidationError` are checked in their own branches AND in the catch-all MongoDB branch. The catch-all branches are unreachable for those types.
