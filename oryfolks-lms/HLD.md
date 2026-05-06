# HIGH-LEVEL DESIGN (HLD) DOCUMENT

---

**Project Name:** OryFolks Learning Management System (LMS)
**Document Reference:** ORY-LMS-HLD-v1.0
**Document Version:** 1.0
**Status:** Final Draft
**Prepared By:** Engineering Team
**Date:** April 2026
**Target Audience:** Executive Stakeholders, Project Managers, Business Analysts, Solution Architects

---

## TABLE OF CONTENTS

1. Executive Summary
2. Business Goals & Objectives
3. Scope of the System
4. High-Level Architecture Overview
5. System Components
6. Technology Stack
7. User Roles & Access Control
8. Core Functional Modules
9. Security Architecture
10. Data Flow & Integration Design
11. Non-Functional Requirements
12. Assumptions & Dependencies

---

## 1. Executive Summary

The OryFolks Learning Management System (LMS) is an enterprise-grade, web-based platform developed to centralize and govern employee training and professional development at OryFolks Pvt Ltd. The platform enables authorized administrators to create and publish digital course content, assign those courses to specific employees, and track learning compliance at both team and organizational levels.

The system is designed around three distinct organizational user roles — **Administrator, Manager, and Employee** — each with a custom-tailored interface and tightly governed access controls. The LMS ensures a tamper-proof learning experience by enforcing progressive, non-skippable video content consumption. Completion metrics and progress analytics are aggregated in real-time on managerial and administrative dashboards.

---

## 2. Business Goals & Objectives

| # | Goal | Description |
|---|------|-------------|
| 1 | Centralized Training Portal | Provide a single platform for course publishing, assignment, and tracking. |
| 2 | Organizational Email Governance | Restrict account creation to internal `@oryfolks.com` email addresses. |
| 3 | Strict Learning Compliance | Guarantee employees cannot skip or bypass module content to fraudulently claim completion. |
| 4 | Role-Based Visibility | Ensure each user type (Admin, Manager, Employee) only accesses data relevant to their scope. |
| 5 | Data Integrity | Completely purge all orphaned user data when an employee account is deleted. |
| 6 | Real-Time Progress Analytics | Provide up-to-date dashboards showing completion rates, pending course approvals, and employee metrics. |

---

## 3. Scope of the System

### 3.1 In-Scope
- User registration, authentication, and role-based session management via JWT.
- Admin capabilities: Create/manage users, publish courses, view organizational metrics.
- Manager capabilities: Assign/unassign courses to employees, approve/reject self-enrollment requests, send reminders.
- Employee capabilities: Browse assigned courses, consume video content, track personal progress, self-enroll.
- Automated email notification service for reminders and enrollment status.
- Strict video completion tracking with skip-protection enforcement.

### 3.2 Out-of-Scope
- Native mobile application (Android / iOS).
- Third-party LMS system integrations (e.g., SAP SuccessFactors, Moodle).
- Offline video content support.
- AI/ML-based course recommendations.

---

## 4. High-Level Architecture Overview

The system is built on a classic **Three-Tier Architecture** employing a RESTful API pattern for stateless communication.

```
┌─────────────────────────────────────────────────────┐
│                 CLIENT TIER (Browser)               │
│         React.js SPA  |  Axios HTTP Client          │
│         Role-Based Dashboards (Admin/Manager/Emp)   │
└───────────────────────┬─────────────────────────────┘
                        │  HTTPS + JWT Bearer Tokens
                        ▼
┌─────────────────────────────────────────────────────┐
│              APPLICATION TIER (Backend)             │
│         Java 17 + Spring Boot 3.x REST API          │
│   Controllers → Services → Repositories             │
│   Spring Security (JWT Filter Chain)                │
└───────────────────────┬─────────────────────────────┘
                        │  Spring Data JPA / Hibernate
                        ▼
┌─────────────────────────────────────────────────────┐
│                   DATA TIER                         │
│         Relational Database (MySQL)                 │
│         9 Core Tables / Entity Schemas              │
└─────────────────────────────────────────────────────┘
```

**Communication Pattern:** All client-server interactions happen over HTTPS using JSON-formatted request/response payloads. Authentication state is carried via a signed JWT token — the backend is entirely stateless, holding no session data server-side.

---

## 5. System Components

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Frontend Web App | React.js + Vite | SPA rendering, routing, state management, user interaction |
| REST API Server | Spring Boot 3.x | Business logic, endpoint routing, security enforcement |
| Authentication Module | Spring Security + JWT | Login, token generation, role claim validation |
| ORM / Data Access | Spring Data JPA + Hibernate | Entity mapping, query execution, transaction management |
| Email Notification | Spring Boot + SMTP (JavaMailSender) | Automated reminder and status notification emails |
| Cloud File Storage | AWS S3 (S3ServiceImpl) | Course video/thumbnail asset storage |
| Relational Database | MySQL | Persistent data storage |

---

## 6. Technology Stack

### 6.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React.js | 18.x | Component-based UI rendering |
| Vite | 5.x | Frontend build tool and dev server |
| React Router | v6 | Client-side routing and protected route guards |
| Axios | latest | HTTP client for REST API communication |
| CSS (Vanilla) | — | Component-scoped styling without external UI libraries |

### 6.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17+ | Core application runtime language |
| Spring Boot | 3.x | Application scaffold, embedded Tomcat server |
| Spring Web (MVC) | 6.x | REST controller and endpoint framework |
| Spring Security | 6.x | JWT-based stateless authentication and authorization |
| Spring Data JPA | 3.x | ORM abstraction and repository layer |
| Hibernate | 6.x | JPA provider and SQL dialect management |
| Lombok | latest | Boilerplate code reduction (@Getter, @Setter) |
| Jakarta Validation | 3.x | Input constraint enforcement (@NotBlank, @Email, @Pattern) |
| Maven | 3.x | Dependency management and build lifecycle |

### 6.3 Infrastructure
| Technology | Purpose |
|------------|---------|
| MySQL | Relational database server |
| AWS S3 | Video and media asset storage |
| SMTP | Email delivery service |
| GitHub | Source code version control |

---

## 7. User Roles & Access Control

The system enforces strict **Role-Based Access Control (RBAC)** implemented via Spring Security's `@PreAuthorize` annotations.

| Role | Access Scope | Default Landing Page |
|------|-------------|---------------------|
| `ADMIN` | Full system access — user management, course management, organization-wide analytics | Admin Dashboard |
| `MANAGER` | Team-level access — assign courses, manage enrollments, view team progress | Manager Dashboard |
| `EMPLOYEE` | Personal access — view assigned courses, watch videos, track own progress, self-enroll | Employee Dashboard |

All API endpoint groups are guarded at the controller level:
- `/admin/**` → Requires `ADMIN` authority.
- `/manager/**` → Requires `MANAGER` authority.
- `/employee/**` → Requires `EMPLOYEE` authority.
- `/auth/**` → Public (no authentication required).

---

## 8. Core Functional Modules

### 8.1 Authentication & Session Management Module
Employees authenticate via a username/password form. Upon successful credential verification, the server generates a signed JWT and returns it to the client. All subsequent requests include this token in the `Authorization` header. The `CustomUserDetailsService` loads the `UserDetails` from the DB for every incoming request.

### 8.2 User Management Module (Admin)
- Administrators create accounts for new hires via the **Add User** form.
- **Email Governance:** The system enforces that every new account email must end with `@oryfolks.com`. Any other domain is rejected at both the frontend (instant feedback) and the backend (server-side validation).
- **Complete Data Deletion:** When an admin deletes a user, the deletion cascades through all related tables: `UserProfile`, `EmployeeCourse`, `EmployeeContentProgress`, `CourseRating`, and `CourseEnrollment` records.

### 8.3 Course Management Module
- Administrators publish courses containing metadata (`title`, `description`, `category`, `duration`, `thumbnailUrl`) and link a `CourseVideo` asset (stored on AWS S3).
- Each video can contain multiple ordered `CourseContent` records, acting as chapter markers defined by a `timestamp` (in seconds).
- Admins can view the full list of published and unassigned courses through the dashboard.

### 8.4 Course Assignment & Enrollment Module
**Manager-Driven Assignment:**
- Managers view their team members and directly assign courses to one or more employees.
- Employees receive an automated email notification upon course assignment.
- Managers can also unassign courses and send deadline reminder emails.

**Employee Self-Enrollment:**
- Employees can browse all available courses and submit a self-enrollment request.
- The Manager reviews the request and approves or rejects it. The employee is notified via email of the outcome.

### 8.5 Learning Engine & Video Progress Module
This is the most technically critical module in the system. It enforces a **strictly chronological, non-skippable** video consumption path.

**Key Behaviors:**
1. The video player resumes from the last saved `lastWatchedTimestamp`.
2. A `furthestWatchedTime` variable is computed client-side and tracks the true furthest point the user has watched *without skipping*.
3. A module receives a green completion tick **only if** the user organically reaches its end timestamp without scrubbing forward past 1.5 seconds at any point.
4. A module completion is also gated on the immediately preceding module already being completed (sequential enforcement).
5. The overall course is only marked **100% complete** after the final module is legitimately finished.

### 8.6 Admin Dashboard Analytics Module
The admin dashboard aggregates:
- **Total Published Courses** and **Assigned Courses** counts.
- **Pending (Unassigned) Courses** count.
- **Total Team Members** (excluding Admins).
- **Average Completion Rate** across all employee-course assignments.
- **Recent Course Approvals** — displays the 6 most recent valid course assignments (orphaned/nameless records are automatically filtered out).

---

## 9. Security Architecture

### 9.1 Authentication Flow
1. User submits credentials to `POST /auth/login`.
2. `UserServiceImpl` validates credentials using `PasswordEncoder` (BCrypt).
3. A signed JWT token is returned containing the username and role claims.
4. The client stores the JWT in `localStorage` and attaches it to every API request.
5. The Spring Security `JwtAuthFilter` validates the token signature and injects the `Authentication` object into the `SecurityContextHolder`.

### 9.2 Authorization
- Endpoint-level access is enforced using `@PreAuthorize("hasAuthority('ROLE_NAME')")` annotations on all Controller classes.
- Role claims are embedded in the JWT payload and decoded server-side per request.

### 9.3 Data Protection
- All passwords are hashed using **BCrypt** before persistence. No plaintext passwords are stored.
- Sensitive configuration (database URL, JWT secret key, SMTP credentials, AWS keys) are stored in `.env` files and `application.properties` and **excluded from version control** via `.gitignore`.

---

## 10. Data Flow & Integration Design

### 10.1 Login Data Flow
```
Browser → POST /auth/login {username, password}
       → AuthController → UserService.login()
       → CustomUserDetailsService (load user from DB)
       → BCrypt password match
       → JwtUtil.generateToken(username, role)
       → Returns {token: "eyJhb..."}
```

### 10.2 Course Progress Update Flow
```
Employee watches video → onTimeUpdate fires every ~250ms
  → furthestWatchedTime tracked contiguously
  → Every 5 seconds: POST /employee/courses/{id}/progress {progress, lastWatchedTimestamp}
  → EmployeeCourse record updated in DB
  → On module end: POST /employee/courses/content/{contentId}/complete
  → EmployeeContentProgress row marked completed = true
```

---

## 11. Non-Functional Requirements

| Requirement | Target Specification |
|-------------|---------------------|
| Availability | 99.5% uptime (excluding scheduled maintenance windows) |
| Performance | API response time should not exceed 2 seconds for standard queries |
| Scalability | Backend designed for horizontal scaling; DB connection pooling via Spring HikariCP |
| Security | JWT expiry enforced; BCrypt password hashing; role-level access guards |
| Maintainability | Layered architecture (Controller / Service / Repository) with explicit separation of concerns |
| Browser Compatibility | Chrome 90+, Firefox 85+, Edge 90+ |

---

## 12. Assumptions & Dependencies

- The organization's Internet infrastructure supports HTTPS connections.
- MySQL database instance is provisioned and accessible to the backend server.
- AWS S3 bucket with appropriate IAM roles is configured for video storage.
- SMTP credentials for the email notification service are valid and active.
- All user emails on record conform to the `@oryfolks.com` domain standard.

---

*Document End — OryFolks LMS High-Level Design v1.0*
