# LOW-LEVEL DESIGN (LLD) DOCUMENT

---

**Project Name:** OryFolks Learning Management System (LMS)
**Document Reference:** ORY-LMS-LLD-v1.0
**Document Version:** 1.0
**Status:** Final Draft
**Prepared By:** Engineering Team
**Date:** April 2026
**Target Audience:** Software Developers, Database Administrators, QA Engineers, DevOps Engineers

---

## TABLE OF CONTENTS

1. Introduction
2. Database Schema Design (Entity Relationship Details)
3. Backend Architecture & Package Structure
4. REST API Endpoint Contracts
5. Frontend Architecture & Component Tree
6. Business Logic Specifications
7. Security Implementation Details
8. Error Handling Strategy
9. Email Notification Service
10. AWS S3 File Storage Integration

---

## 1. Introduction

This Low-Level Design document provides a detailed technical specification of all components constituting the OryFolks LMS application. It serves as the primary reference for development, database administration, and quality assurance activities. All implementation details, data schemas, API contracts, and algorithmic logic outlined herein are derived directly from the source code of the production application.

---

## 2. Database Schema Design

### 2.1 Entity Overview

The data layer consists of **9 core entities** managed by Hibernate ORM and persisted in a MySQL relational database.

---

### 2.2 `users` Table

**Entity Class:** `User.java`
**Purpose:** Stores core authentication credentials and role assignment for all platform users.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique system identifier |
| `username` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Login username (typically the employee's email) |
| `password` | `VARCHAR(255)` | `NOT NULL` | BCrypt-hashed password string |
| `role` | `VARCHAR(50)` | `NOT NULL` | User role string: `ADMIN`, `MANAGER`, or `EMPLOYEE` |

**Relationships:**
- One-to-One (Cascading ALL) with `user_profiles` table via `user_id`.

---

### 2.3 `user_profiles` Table

**Entity Class:** `UserProfile.java`
**Purpose:** Stores extended personal information for a user beyond login credentials.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique system identifier |
| `user_id` | `BIGINT` | `FK → users.id, NOT NULL` | Reference to the parent `User` record |
| `first_name` | `VARCHAR(30)` | `NOT NULL` | Employee's first name. Pattern: `^[A-Za-z]+$` |
| `last_name` | `VARCHAR(30)` | `NOT NULL` | Employee's last name. Pattern: `^[A-Za-z]+$` |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Valid email (must end with `@oryfolks.com`) |
| `mobile` | `VARCHAR(10)` | `NOT NULL` | 10-digit phone number. Pattern: `^\d{10}$` |
| `gender` | `VARCHAR(20)` | Nullable | Employee gender |
| `employee_id` | `VARCHAR(50)` | Nullable | Organizational employee ID |
| `dob` | `DATE` | Nullable | Date of birth |

---

### 2.4 `courses` Table

**Entity Class:** `Course.java`
**Purpose:** Stores course metadata published by administrators.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique course identifier |
| `title` | `VARCHAR(255)` | Nullable | Course display title |
| `category` | `VARCHAR(100)` | Nullable | Learning category (e.g., "Java", "Spring", "HR") |
| `description` | `TEXT(1000)` | Nullable | Long-form course description |
| `duration` | `VARCHAR(50)` | Nullable | Duration string (e.g., "4 hours", "3 weeks") |
| `thumbnail_url` | `VARCHAR(255)` | Nullable | URL to the course thumbnail image |
| `created_date` | `DATETIME` | `AUTO, NOT UPDATABLE` | Timestamp auto-set on record creation |

---

### 2.5 `course_videos` Table

**Entity Class:** `CourseVideo.java`
**Purpose:** Stores the actual video asset associated with a course.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique video identifier |
| `video_title` | `VARCHAR(255)` | Nullable | Title of the video |
| `video_url` | `VARCHAR(500)` | Nullable | AWS S3 or external URL to the video file |
| `contents` | `TEXT` | Nullable | Raw content metadata (legacy text field) |
| `course_id` | `BIGINT` | `FK → courses.id, NOT NULL` | Parent course reference |

**Relationships:**
- Many-to-One with `courses` (a course can have one video).
- One-to-Many (Cascade ALL, orphanRemoval) with `course_contents`.

---

### 2.6 `course_contents` Table

**Entity Class:** `CourseContent.java`
**Purpose:** Represents individual learning chapters/modules within a course video, defined by a timestamp.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique content module identifier |
| `title` | `VARCHAR(255)` | Nullable | Module chapter name (e.g., "Introduction to Spring Boot") |
| `timestamp` | `DOUBLE` | Nullable | Start timestamp of this module in the video, in **seconds** |
| `course_video_id` | `BIGINT` | `FK → course_videos.id, NOT NULL` | Parent video reference |

---

### 2.7 `employee_course` Table

**Entity Class:** `EmployeeCourse.java`
**Purpose:** Junction table — records a course assigned to an employee. Acts as the core progress tracking entity.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Record identifier |
| `employee_id` | `BIGINT` | `NOT NULL` | Reference to the `users.id` of the assigned employee |
| `course_id` | `BIGINT` | `NOT NULL` | Reference to the `courses.id` |
| `progress` | `INT` | `DEFAULT 0` | Integer 0–100 representing percentage watched |
| `status` | `VARCHAR(50)` | `DEFAULT 'NOT_STARTED'` | Enum string: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED` |
| `last_watched_timestamp` | `DOUBLE` | Nullable | Last video position (in seconds) saved for resume functionality |
| `deadline` | `DATE` | Nullable | Target completion date set by the manager |
| `assigned_date` | `DATE` | `DEFAULT CURRENT_DATE` | Date the course was assigned |
| `enrollment_type` | `VARCHAR(50)` | `DEFAULT 'MANUAL_ASSIGNMENT'` | `MANUAL_ASSIGNMENT` or `SELF_ENROLLMENT` |
| `reminder_sent` | `BOOLEAN` | `DEFAULT false` | Flag tracking if a deadline reminder email has been sent |

**Unique Constraint:** `(employeeId, courseId)` — prevents duplicate assignments.

---

### 2.8 `employee_content_progress` Table

**Entity Class:** `EmployeeContentProgress.java`
**Purpose:** Granular module-level completion tracking. Each row represents whether a specific employee has fully completed a specific `CourseContent` module.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Record identifier |
| `employee_id` | `BIGINT` | `NOT NULL` | Mapped from `users.id` |
| `content_id` | `BIGINT` | `NOT NULL` | Reference to `course_contents.id` |
| `completed` | `BOOLEAN` | `DEFAULT false` | `true` once the module is legitimately finished |

**Unique Constraint:** `(employeeId, contentId)` — one progress record per employee per module.

---

### 2.9 `course_enrollments` Table

**Entity Class:** `CourseEnrollment.java`
**Purpose:** Stores self-enrollment requests submitted by employees, pending manager review.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Record identifier |
| `employee_id` | `BIGINT` | `NOT NULL` | Requesting employee's `users.id` |
| `course_id` | `BIGINT` | `NOT NULL` | Requested course's `courses.id` |
| `status` | `VARCHAR(20)` | `NOT NULL` | `PENDING`, `APPROVED`, or `REJECTED` |
| `request_date` | `DATETIME` | `AUTO, NOT UPDATABLE` | When the request was submitted |
| `response_date` | `DATETIME` | Nullable | When the manager approved or rejected the request |

---

### 2.10 Entity Relationship Summary (ERD)

```
users ──────────────────── user_profiles
  │ (1:1, CASCADE ALL)
  │
  ├─── employee_course ──── courses ──── course_videos ──── course_contents
  │         │                                                      │
  │         └── (progress / status / deadline)                     │
  │                                                                 │
  └─── employee_content_progress ──────────────────────────────────┘
  │         (tracks per-module completion)
  │
  └─── course_enrollments
            (self-enrollment requests)
```

---

## 3. Backend Architecture & Package Structure

```
com.oryfolks.lms_backend
│
├── LmsBackendApplication.java          (Spring Boot entry point)
│
├── config/                             (Security, CORS, Bean configs)
│
├── controller/                         (REST API endpoint definitions)
│   ├── AuthController.java             (/auth)
│   ├── AdminController.java            (/admin)
│   ├── ManagerController.java          (/manager)
│   ├── EmployeeController.java         (/employee)
│   └── CourseController.java           (/courses)
│
├── service/                            (Business logic layer)
│   ├── UserService.java / UserServiceImpl.java
│   ├── AdminUserService.java
│   ├── CourseService.java / CourseServiceImpl.java
│   ├── ManagerService.java / ManagerServiceImpl.java
│   ├── EmailService.java
│   ├── S3Service.java / S3ServiceImpl.java
│   └── CustomUserDetailsService.java
│
├── repository/                         (Data access layer / JPA)
│   ├── UserRepository.java
│   ├── UserProfileRepository.java
│   ├── CourseRepository.java
│   ├── CourseVideoRepository.java
│   ├── EmployeeCourseRepository.java
│   ├── EmployeeContentProgressRepository.java
│   ├── CourseEnrollmentRepository.java
│   └── CourseRatingRepository.java
│
├── entity/                             (JPA Entity / DB Table mapping)
│   ├── User.java
│   ├── UserProfile.java
│   ├── Course.java
│   ├── CourseVideo.java
│   ├── CourseContent.java
│   ├── EmployeeCourse.java
│   ├── EmployeeContentProgress.java
│   ├── CourseEnrollment.java
│   └── CourseRating.java
│
├── DTO/                                (Data Transfer Objects)
│   ├── LoginRequest.java
│   ├── AddUserForm.java
│   ├── CourseResponseDTO.java
│   ├── UserManagementDTO.java
│   ├── AssignedCourseDTO.java
│   ├── AssignCourseRequest.java
│   ├── TeamMemberDTO.java
│   ├── CourseEnrollmentDTO.java
│   ├── RecentAssignmentDTO.java
│   └── DashboardSummaryResponse.java
│
├── security/                           (JWT filter and utility classes)
│
├── exception/                          (Global exception handling)
│
└── util/                               (Helper utilities)
```

---

## 4. REST API Endpoint Contracts

All endpoints consume and produce `application/json`. All protected routes require `Authorization: Bearer <JWT_TOKEN>` in the request header.

### 4.1 Authentication Endpoints (Public)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|--------------|----------|-------------|
| `POST` | `/auth/login` | `{ "username": "string", "password": "string" }` | `{ "token": "eyJhbGci..." }` `200 OK` | Authenticates user and returns a signed JWT |

---

### 4.2 Admin Endpoints (Role: `ADMIN`)

| Method | Endpoint | Request Body / Params | Response | Description |
|--------|----------|-----------------------|----------|-------------|
| `POST` | `/admin/add-user` | `AddUserForm` JSON body | `"User created successfully"` `200 OK` | Creates a new user. Validates `@oryfolks.com` email. |
| `GET` | `/admin/users` | — | `List<UserManagementDTO>` | Returns all platform users with profile details. |
| `DELETE` | `/admin/users/{id}` | Path var: `id` | `204 No Content` | Cascading delete — removes User, Profile, Courses, Progress, Ratings. |
| `GET` | `/admin/dashboard/summary` | — | `DashboardSummaryResponse` | Returns aggregated stats: total courses, assignments, members, avg. completion, recent 6 valid assignments. |
| `GET` | `/admin/dashboard/recent-assignments` | — | `List<RecentAssignmentDTO>` | Returns all valid assignment records with employee name and course title. |
| `GET` | `/admin/assigned-courses` | — | `List<AssignedCourseDTO>` | All courses that have at least one assignment. |
| `GET` | `/admin/pending-courses` | — | `List<AssignedCourseDTO>` | All courses with no current assignments. |

**`DashboardSummaryResponse` Fields:**
- `publishedCount` (long): Total number of courses in the system.
- `assignedCount` (long): Number of unique courses currently assigned to employees.
- `pendingCount` (long): `publishedCount - assignedCount`.
- `totalMembersCount` (long): Total non-admin users.
- `averageCompletionRate` (int): Mean progress percentage across all `employee_course` records.
- `recentAssignments` (List): Up to 6 valid (non-orphaned) recent course assignments with employee name.

---

### 4.3 Manager Endpoints (Role: `MANAGER`)

| Method | Endpoint | Request Body / Params | Response | Description |
|--------|----------|-----------------------|----------|-------------|
| `GET` | `/manager/courses` | — | `List<Course>` | Returns all published courses. |
| `GET` | `/manager/my-team` | — | `List<TeamMemberDTO>` | Returns all employees in the manager's team. |
| `POST` | `/manager/assign-course` | `AssignCourseRequest` { `courseId`, `employeeIds[]`, `deadline` } | `"Course assigned successfully"` | Assigns a course to one or more employees. |
| `POST` | `/manager/unassign-course` | `AssignCourseRequest` { `courseId`, `employeeIds[0]` } | `"Course unassigned successfully"` | Removes a course assignment for one employee. |
| `GET` | `/manager/enrollments` | `?status=PENDING` (optional) | `List<CourseEnrollmentDTO>` | Fetches self-enrollment requests, optionally filtered by status. |
| `POST` | `/manager/enrollments/{id}/approve` | Path var: `id` | `"Enrollment approved"` | Approves a pending enrollment request. |
| `POST` | `/manager/enrollments/{id}/reject` | Path var: `id` | `"Enrollment rejected"` | Rejects a pending enrollment request. |
| `POST` | `/manager/send-reminder` | `AssignCourseRequest` | `"Reminder sent successfully"` | Sends an email reminder to an employee about their course deadline. |

---

### 4.4 Employee Endpoints (Role: `EMPLOYEE`)

| Method | Endpoint | Request Body / Params | Response | Description |
|--------|----------|-----------------------|----------|-------------|
| `GET` | `/employee/courses/my` | — | `List<CourseResponseDTO>` | Returns all courses assigned to the logged-in employee. |
| `GET` | `/employee/courses/all` | — | `List<CourseResponseDTO>` | Returns the full course catalog for browsing. |
| `GET` | `/employee/courses/{id}` | Path var: `id` | `CourseResponseDTO` | Returns full details for a single course including contents and progress. |
| `POST` | `/employee/courses/{id}/progress` | Params: `progress` (int), `lastWatchedTimestamp` (double) | `200 OK` | Updates the employee's watched-up-to timestamp and overall percentage. |
| `POST` | `/employee/courses/content/{contentId}/complete` | Path var: `contentId` | `"Content marked as completed"` | Marks a specific module as completed in `employee_content_progress`. |
| `POST` | `/employee/enroll/{courseId}` | Path var: `courseId` | `"Enrollment request sent successfully"` | Submits a self-enrollment request. |
| `GET` | `/employee/enrollments/history` | — | `List<CourseEnrollmentDTO>` | Returns all past enrollment requests and their statuses. |
| `GET` | `/employee/profile` | — | `UserProfile` JSON | Returns the logged-in employee's profile details. |
| `PUT` | `/employee/profile` | `UserProfile` JSON body | Updated `UserProfile` JSON | Updates profile fields (name, email, mobile, etc.). |
| `POST` | `/employee/reset-password` | Params: `username`, `newPassword` | `"Password updated"` | Resets the user's password. |

---

## 5. Frontend Architecture & Component Tree

### 5.1 Application Routing Structure (`App.jsx`)

```
/                       → LoginPage.jsx
/admin                  → AdminDashboard.jsx       [ProtectedRoute: ADMIN]
/admin/add-course       → AddCourse.jsx            [ProtectedRoute: ADMIN]
/admin/add-user         → AddUser.jsx              [ProtectedRoute: ADMIN]
/admin/users            → UserManagement.jsx       [ProtectedRoute: ADMIN]
/manager                → ManagerDashboard.jsx     [ProtectedRoute: MANAGER]
/employee               → EmployeeDashboard.jsx    [ProtectedRoute: EMPLOYEE]
/employee/course/:id    → CoursePlayer.jsx         [ProtectedRoute: EMPLOYEE]
/employee/profile       → EmployeeProfile.jsx      [ProtectedRoute: EMPLOYEE]
/employee/my-learning   → MyLearning.jsx           [ProtectedRoute: EMPLOYEE]
```

### 5.2 `ProtectedRoute.jsx`
Reads the JWT from `localStorage`. Decodes the `role` claim. If the role does not match the required role for the route, redirects the user to `/` (login page). Prevents unauthorized users from accessing any protected page.

### 5.3 `LoginPage.jsx`
- Renders username/password form.
- On submit, sends `POST /auth/login`.
- Stores returned JWT in `localStorage`.
- Reads `role` from the decoded token and redirects to the appropriate dashboard route.

### 5.4 `AdminDashboard.jsx`
- Fetches summary analytics from `GET /admin/dashboard/summary` on mount.
- Renders stat cards: Published Courses, Assigned Courses, Total Members, Avg. Completion Rate.
- Renders a "Recent Course Approvals" table using the `recentAssignments` field from the API.
- Navigation links to `AddCourse`, `AddUser`, `UserManagement`, `AllAssignedCourses`, `PendingCourses`, `RecentAssignments`.

### 5.5 `AddUser.jsx`
- Multi-field form: First Name, Last Name, Email, Employee ID, Mobile, Gender, DOB, Role, Password.
- **Frontend Validation Rules:**
  - `firstName` / `lastName`: Must be 2–30 alphabetic characters.
  - `email`: Must end with `@oryfolks.com` (case-insensitive check).
  - `mobile`: Must be exactly 10 digits.
  - `password`: Minimum 8 characters.
- On submission, calls `POST /admin/add-user`.

### 5.6 `EmployeeDashboard.jsx`
- Fetches `GET /employee/courses/my` to display the employee's assigned course grid.
- Displays progress bars and completion status for each assigned course.
- Clicking a course card navigates to `CoursePlayer` at `/employee/course/:id`.
- Provides tabs/links to `MyLearning`, `EmployeeProfile`.

### 5.7 `CoursePlayer.jsx`
The most complex frontend component. Contains the entire video learning engine.

**Key State & Refs:**
| Variable | Type | Purpose |
|----------|------|---------|
| `course` | State | Full course data object fetched from API |
| `videoRef` | Ref | DOM reference to the `<video>` element |
| `furthestWatchedTime` | Ref | Maximum contiguously watched timestamp in seconds |
| `lastTimeRef` | Ref | Previous `currentTime` value for skip-detection math |
| `markingCompletedRef` | Ref | `Set<contentId>` — prevents duplicate completion API calls |
| `resumeTimeSet` | State | Boolean flag ensuring resume logic only fires once on load |

**Lifecycle — `useEffect` on `course` load:**
1. Sets `videoRef.current.currentTime = course.lastWatchedTimestamp || 0`.
2. Scans `course.contents[]` to find the first uncompleted module.
3. Initializes `furthestWatchedTime.current = Math.max(lastWatchedTimestamp, startOfUncompletedModule.timestamp)`.
4. This correctly allows a returning user to pick up at their last legitimate position.

**`handleTimeUpdate(e)` — Fires every ~250ms during playback:**
1. Calculates `currentProgress` as `Math.round((currentTime / duration) * 100)`.
2. **Skip Detection:** If `currentTime <= furthestWatchedTime + 1.5`, advances `furthestWatchedTime`. Otherwise, the tracker does NOT advance (user scrubbed forward).
3. **Progress Cap:** If `currentProgress >= 100` but `furthestWatchedTime < duration - 1.0`, caps `currentProgress` at `99` before sending to the backend.
4. **Progress Update:** Sends `POST /employee/courses/{id}/progress` every 5 seconds or when progress hits 100.
5. **Module Completion Loop:** Iterates over `course.contents[]`. For each uncompleted module:
   - Checks `isEligible`: Index is 0 OR previous module is `completed`.
   - Checks `hasWatchedToEnd`: `furthestWatchedTime >= (moduleEndTimestamp - 0.5)`.
   - If both are true, calls `markContentCompleted(item.id)`.

**`handleVideoEnded()` — Fires when video reaches the end:**
1. Evaluates the last module's `isEligible` and `hasWatchedToEnd` conditions.
2. If both conditions pass, triggers `markContentCompleted` for the final module and then `updateProgress(100, duration)`.
3. If either condition fails (user scrubbed to the end), updates progress to `99` instead.

---

## 6. Business Logic Specifications

### 6.1 Email Validation Rule

**Location:** `UserServiceImpl.java` (Backend), `AddUser.jsx` (Frontend)

```java
// Backend: UserServiceImpl.addUser()
if (!form.getEmail().toLowerCase().endsWith("@oryfolks.com")) {
    throw new RuntimeException("Only @oryfolks.com emails are allowed");
}
```

```javascript
// Frontend: AddUser.jsx validateForm()
if (!formData.email.toLowerCase().endsWith('@oryfolks.com')) {
    newErrors.email = 'Only @oryfolks.com emails are allowed';
}
```

### 6.2 Cascade User Delete

**Location:** `AdminUserService.deleteUser(Long id)`

**Deletion Sequence:**
1. `employeeContentProgressRepository.deleteByEmployeeId(id)` — removes all module completion records.
2. `courseEnrollmentRepository.deleteByEmployeeId(id)` — removes all enrollment requests.
3. `employeeCourseRepository.deleteByEmployeeId(id)` — removes all course assignments.
4. `courseRatingRepository.deleteByEmployeeId(id)` — removes all course ratings.
5. `userProfileRepository.deleteByUserId(id)` — removes the personal profile.
6. `userRepository.deleteById(id)` — removes the root authentication entity.

### 6.3 Dashboard Recent Assignment Null Guard

**Location:** `AdminController.mapToRecentAssignmentDTO()`

The method defends against database orphan records in two stages:
1. If `UserProfile` is `null` for a given `employeeId`, the method returns `null` immediately.
2. If `firstName` or `lastName` resolve to `"null"` strings, they are replaced with empty strings.
3. If the composed `employeeName` is blank or just `"-"`, the method returns `null`.
4. The calling stream applies `.filter(dto -> dto != null && dto.getEmployeeName() != null && !dto.getEmployeeName().trim().isEmpty())` to exclude all null returns.

---

## 7. Security Implementation Details

### 7.1 JWT Token Structure

- **Algorithm:** HMAC-SHA256 (HS256)
- **Payload Claims:** `sub` (username), `role`, `iat` (issued at), `exp` (expiry)
- **Storage:** `localStorage` on the client browser.

### 7.2 Spring Security Filter Chain Order

1. Request enters the server.
2. `JwtAuthFilter` reads the `Authorization` header.
3. Token is validated (signature + expiry check).
4. `CustomUserDetailsService.loadUserByUsername()` queries the DB to confirm the user still exists.
5. `UsernamePasswordAuthenticationToken` is set in `SecurityContextHolder`.
6. Request passes to the controller layer.
7. `@PreAuthorize` annotation checks the authority against the role in the JWT.
8. If unauthorized, a `403 Forbidden` response is returned.

### 7.3 Password Hashing

- All passwords are encoded using `BCryptPasswordEncoder` before being saved to the `users` table.
- Plain-text passwords are **never** stored, logged, or returned in any API response.

---

## 8. Error Handling Strategy

| Scenario | Handling Approach | HTTP Response |
|----------|-------------------|---------------|
| Invalid credentials | `RuntimeException("Invalid credentials")` in `UserServiceImpl.login()` | `400 Bad Request` |
| Email domain violation | `RuntimeException("Only @oryfolks.com emails are allowed")` | `400 Bad Request` |
| Resource not found | `Optional.orElseThrow(...)` pattern in service layer | `404 Not Found` (or internal error if not explicitly handled) |
| Missing JWT token | Spring Security blocks the request before hitting the controller | `403 Forbidden` |
| Dashboard data fetch error | `try-catch` in `getDashboardSummary()` logs error and returns `500 Internal Server Error` body with message |
| Duplicate assignment | DB unique constraint `(employeeId, courseId)` prevents duplicate inserts at the database level |

---

## 9. Email Notification Service

**Class:** `EmailService.java`
**Framework:** Spring Boot `JavaMailSender`

**Triggered Events:**
| Trigger | Recipient | Email Type |
|---------|-----------|------------|
| Course assigned by manager | Employee | Assignment notification with course name and deadline |
| Manager sends reminder | Employee | Deadline reminder notification |
| Enrollment approved | Employee | Approval confirmation |
| Enrollment rejected | Employee | Rejection notification |

Email content is composed programmatically within the service and dispatched to the employee's registered email from `user_profiles.email`.

---

## 10. AWS S3 File Storage Integration

**Interface:** `S3Service.java`
**Implementation:** `S3ServiceImpl.java`

The service integrates with **Amazon Web Services Simple Storage Service (S3)** to manage storage and retrieval of large binary assets (course videos and thumbnails) outside the relational database.

- **Upload:** Course videos are uploaded to a designated S3 bucket. The returned public URL is stored as `course_videos.video_url`.
- **Access:** The `CoursePlayer.jsx` frontend directly streams the video from the S3 URL via the native HTML5 `<video>` element's `src` attribute.
- **Configuration:** AWS Access Key, Secret Key, and Bucket Name are configured via environment variables, not hardcoded in source.

---

*Document End — OryFolks LMS Low-Level Design v1.0*
