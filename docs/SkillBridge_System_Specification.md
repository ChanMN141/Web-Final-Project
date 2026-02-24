# SkillBridge System Specification Document

| **Version** | **Date** | **Author** | **Status** |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-02-19 | Senior Architect | Draft |

---

## 1. System Overview
SkillBridge is a web-based service marketplace platform designed to bridge the gap between Service Providers (freelancers, workers) and Service Seekers (clients, employers). The application facilitates the entire lifecycle of a service engagement, from posting a job requirement to the application and approval process.

The system is built using a **Next.js** framework for both frontend and backend, leveraging **MongoDB** for data persistence, and is targeted for deployment on an **AWS EC2** instance.

## 2. Business Objectives
*   **Centralized Marketplace**: Create a single platform for service exchange.
*   **User Empowerment**: Allow users to easily find work or hire help without complex intermediaries.
*   **Simplicity**: Focus on core interactions (Post -> Apply -> Approve) to minimize friction.
*   **Accessibility**: Support easy registration and profile management for all user types.

## 3. Functional Requirements

### FR-1: User Authentication & Profile
*   **FR-1.1**: Users must be able to register with `name`, `email`, `password`, `role` (Service Provider or Service Seeker), and an optional `bio`.
*   **FR-1.2**: Users must be able to log in using `email` and `password`.
*   **FR-1.3**: Passwords must be encrypted before storage.
*   **FR-1.4**: Users must be able to view and edit their own profile information (`name`, `bio`).

### FR-2: Service Management (Service Seeker)
*   **FR-2.1**: Service Seekers can create a new Service Post with `title`, `description`, `category`, and `budget`.
*   **FR-2.2**: Service Seekers can view a list of their own active Service Posts.
*   **FR-2.3**: Service Seekers can edit or delete their Service Posts.
*   **FR-2.4**: Deleting a service post should handle associated applications (e.g., mark as cancelled or cascade delete).

### FR-3: Application Management (Service Provider)
*   **FR-3.1**: Service Providers can browse and search available Service Posts.
*   **FR-3.2**: Service Providers can filter posts by `category`.
*   **FR-3.3**: Service Providers can submit an Application to a specific Service Post with a cover `message`.
*   **FR-3.4**: Service Providers can view a dashboard of their submitted applications and their current status (`PENDING`, `ACCEPTED`, `REJECTED`).
*   **FR-3.5**: A Provider cannot apply to the same post multiple times.

### FR-4: Workflow & Interactions
*   **FR-4.1**: Service Seekers can view all Applications received for their Service Posts.
*   **FR-4.2**: Service Seekers can `ACCEPT` or `REJECT` an Application.
*   **FR-4.3**: Determining an application's status updates the view for the Provider.

### FR-5: Dashboard
*   **FR-5.1**: Upon login, users are redirected to a role-specific dashboard.
*   **FR-5.2**: **Seeker Dashboard**: Summary of active posts and pending applications.
*   **FR-5.3**: **Provider Dashboard**: Summary of applied jobs and recent approvals.

## 4. Non-Functional Requirements
*   **NFR-1: Performance**: API response time should be under 500ms for 95% of requests.
*   **NFR-2: Scalability**: Architecture must support vertical scaling on EC2. The stateless API design should allow future horizontal scaling.
*   **NFR-3: Security**:
    *   Communication encrypted via standard HTTPS (TLS 1.2+).
    *   Passwords explicitly hashed using bcrypt (strength 10+).
    *   API endpoints protected via JWT (JSON Web Tokens).
*   **NFR-4: Availability**: Target availability 99.9% uptime during business hours.
*   **NFR-5: Data Integrity**: MongoDB transactions (or atomic operations) used where critical to maintain data consistency.

## 5. User Roles and Permissions Matrix

| Permission | Guest | Service Seeker | Service Provider |
| :--- | :---: | :---: | :---: |
| Register / Login | ✅ | — | — |
| View Public Job Board | ✅ | ✅ | ✅ |
| Create Service Post | ❌ | ✅ | ❌ |
| Edit/Delete Own Post | ❌ | ✅ | ❌ |
| Apply to Job | ❌ | ❌ | ✅ |
| View Own Applications | ❌ | ❌ | ✅ |
| Review Applications (for own post) | ❌ | ✅ | ❌ |
| Accept/Reject Application | ❌ | ✅ | ❌ |

## 6. Detailed Data Models

### 6.1 User
| Field | Type | Required | Validation / Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique Identifier |
| `name` | String | Yes | Min 2, Max 50 chars |
| `email` | String | Yes | Valid email format, Unique |
| `password` | String | Yes | Hashed (bcrypt) |
| `role` | Enum | Yes | Values: `['SEEKER', 'PROVIDER']` |
| `bio` | String | No | Max 500 chars |
| `createdAt` | DateTime | Yes | Auto-generated |

### 6.2 ServicePost
| Field | Type | Required | Validation / Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique Identifier |
| `userId` | ObjectId | Yes | Reference to **User** (Creator) |
| `title` | String | Yes | Min 5, Max 100 chars |
| `description` | String | Yes | Min 20, Max 2000 chars |
| `category` | String | Yes | Predefined categories (e.g., 'Development', 'Design') |
| `budget` | Number | Yes | Positive integer |
| `status` | Enum | Yes | Values: `['OPEN', 'CLOSED']`. Default: `OPEN` |
| `createdAt` | DateTime | Yes | Auto-generated |

### 6.3 Application
| Field | Type | Required | Validation / Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique Identifier |
| `postId` | ObjectId | Yes | Reference to **ServicePost** |
| `providerId` | ObjectId | Yes | Reference to **User** (Applicant) |
| `message` | String | Yes | Cover letter. Max 1000 chars. |
| `status` | Enum | Yes | Values: `['PENDING', 'ACCEPTED', 'REJECTED']`. Default: `PENDING` |
| `appliedAt` | DateTime | Yes | Auto-generated |

## 7. API Contract Definitions

### Authentication
*   **POST** `/api/auth/register`
    *   **Request**: `{ "name": "John", "email": "john@ex.com", "password": "...", "role": "SEEKER" }`
    *   **Response**: `201 Created` - `{ "token": "jwt...", "user": { ... } }`
*   **POST** `/api/auth/login`
    *   **Request**: `{ "email": "john@ex.com", "password": "..." }`
    *   **Response**: `200 OK` - `{ "token": "jwt...", "user": { ... } }`

### Service Posts
*   **GET** `/api/posts`
    *   **Query Params**: `?category=Design&search=Logo`
    *   **Response**: `200 OK` - `[ { "title": "Logo Design", ... }, ... ]`
*   **POST** `/api/posts` (Auth: Seeker)
    *   **Request**: `{ "title": "...", "budget": 100, ... }`
    *   **Response**: `201 Created` - `{ "_id": "...", ... }`
*   **GET** `/api/posts/:id`
    *   **Response**: `200 OK` - Single post details.
*   **DELETE** `/api/posts/:id` (Auth: Owner)
    *   **Response**: `200 OK`

### Applications
*   **POST** `/api/applications` (Auth: Provider)
    *   **Request**: `{ "postId": "...", "message": "I can do this..." }`
    *   **Response**: `201 Created`
*   **GET** `/api/posts/:id/applications` (Auth: Post Owner)
    *   **Response**: `200 OK` - List of applications for a specific job.
*   **PUT** `/api/applications/:id/status` (Auth: Post Owner)
    *   **Request**: `{ "status": "ACCEPTED" }`
    *   **Response**: `200 OK` - Updated status.

## 8. Database Schema Structure
The database will be **NoSQL (MongoDB)** containing three primary collections.

```javascript
// Collection: users
{
  "_id": ObjectId("..."),
  "name": "Alice Provider",
  "email": "alice@example.com",
  "role": "PROVIDER",
  ...
}

// Collection: service_posts
{
  "_id": ObjectId("..."),
  "userId": ObjectId("ref_to_user_seeker"),
  "title": "Build a Website",
  "status": "OPEN",
  ...
}

// Collection: applications
// Compound Index: { postId: 1, providerId: 1 } (Unique constraint to prevent duplicate applications)
{
  "_id": ObjectId("..."),
  "postId": ObjectId("ref_to_post"),
  "providerId": ObjectId("ref_to_user_provider"),
  "status": "PENDING",
  ...
}
```

## 9. System Architecture Diagram Description
The system structure follows a standard Monolithic Web Application pattern using the Next.js framework (Frontend + Backend within the same deployment unit).

1.  **Frontend Layer**: Next.js (React) Components. Handles UI rendering, State Management (Context API/Redux), and Form Validation (React Hook Form).
2.  **API Layer**: Next.js API Routes (`/pages/api` or `/app/api`). Handles request routing, Input Validation (Zod), and Authorization checks.
3.  **Service Layer**: Business logic controllers. Separates core logic from API handlers. Calls the Database layer.
4.  **Data Layer**: Mongoose ODM. Interactions with MongoDB instance.
5.  **Infrastructure**:
    *   **Host**: AWS EC2 (t2.micro/small class).
    *   **Process Manager**: PM2 (keeps Node.js process alive).
    *   **Reverse Proxy**: Nginx (handles SSL termination and forwards port 80/443 to Next.js port 3000).

## 10. Deployment Architecture
*   **Instance**: Single AWS EC2 Instance (Ubuntu 22.04 LTS).
*   **Environment**: Node.js v18+.
*   **Database**: Self-hosted MongoDB on the same EC2 instance (or MongoDB Atlas using VPC peering connection). *Note: For production resilience, Atlas is recommended, but scope implies EC2 hosting.*
*   **Build Pipeline**: Code is pulled from Git repository to EC2. `npm run build` generates the production artifact.
*   **Process Management**: `pm2 start npm --name "skillbridge" -- start` ensures the application runs continuously.

## 11. Security Model
*   **Authentication**: JSON Web Tokens (JWT). Tokens issued on login, expected in `Authorization: Bearer <token>` header for protected routes.
*   **Input Validation**: All API inputs validated against schema (Zod/Joi) to prevent injection attacks.
*   **Data Protection**: User passwords never stored in plain text.
*   **CORS**: Configured to allow requests only from the application domain.
*   **Rate Limiting**: Basic rate limiting (e.g., using Nginx or middleware) to prevent abuse on Auth endpoints.

## 12. Edge Cases & Failure Scenarios
1.  **Duplicate Application**: A Provider tries to apply for the same job twice.
    *   *Handling*: Database unique index on `{ postId, providerId }` throws error. API returns `409 Conflict`.
2.  **Job Deletion with Active Applications**: A Seeker deletes a job that has pending applications.
    *   *Handling*: System warns user. On confirmation, job is deleted. Applications effectively become orphaned (or are cascade deleted/marked 'ARCHIVED').
3.  **Self-Application**: A Seeker acts as a Provider and applies to their own job.
    *   *Handling*: API logic check: `if (post.userId === currentUserId) throw Error`.
4.  **Database Connection Loss**:
    *   *Handling*: API returns `503 Service Unavailable`. Frontend displays "Maintenance Mode" friendly error.

## 13. Assumptions
*   **Currency**: All budgets are in USD ($) by default.
*   **Settlement**: Actual payment transfer happens outside user platform (Cash/Direct Transfer). The "Budget" field is informational.
*   **Language**: Interface is English only.

## 14. Clarifications Needed (REQUIRES CLARIFICATION)
The following items are outside the current brief but critical for a real-world production release:
1.  **Admin Portal**: Is there a "Super Admin" role required to ban users or delete illegal content? (Currently assumed out of scope).
2.  **Notifications**: Should users receive email or real-time notifications when an application is received/accepted? (Currently not in Core Features).
3.  **File Uploads**: Do users need to upload resumes or profile pictures? (Currently assumed text-only for 'Bio' and 'Description').
4.  **Payment Gateway**: Is on-platform payment processing required in the future? (Currently assumed off-platform).
