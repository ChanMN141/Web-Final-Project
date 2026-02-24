# SkillBridge Platform - Web Development Project

**Course:** Web Development  
**Student Name:** Chan Mya Nyein  
**Student ID:** 6540202  

SkillBridge is a modern, web-based service marketplace platform designed to connect **Service Seekers** (clients needing tasks completed) with **Service Providers** (professionals offering their expertise). 

This project serves as a comprehensive demonstration of full-stack web development principles, encompassing responsive UI design, secure authentication, database modeling, and complete RESTful CRUD operations.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Authentication:** Custom JWT (JSON Web Tokens) with `bcryptjs`
- **Forms & Validation:** `react-hook-form` + `zod`
- **Icons:** `lucide-react`

## 📊 Database Models & CRUD Operations Showcase

This project implements standard CRUD (Create, Read, Update, Delete) operations across multiple core database entities. Here is a showcase of three primary models and how their CRUD operations are utilized in the application:

### 1. ServicePost (Job Postings)
The core model representing a job or project created by a Service Seeker.
*   **Create (POST):** Service Seekers can create a new job posting from their dashboard by providing a title, description, category, and budget.
*   **Read (GET):** Service Providers can fetch and browse all open job postings on the public Job Board. Seekers can read a specific list of their own created posts.
*   **Update (PATCH):** Service Seekers can edit the details of their active posts (e.g., updating the description or budget) or toggle the post's status between `OPEN` and `CLOSED`.
*   **Delete (DELETE):** Service Seekers can permanently delete a job posting if it is no longer needed, which seamlessly removes it from the database.

### 2. Application (Job Applications)
The model representing a Service Provider's proposal to work on a specific `ServicePost`.
*   **Create (POST):** Service Providers can submit an application to an open `ServicePost`, including a customized cover message.
*   **Read (GET):** Service Seekers can fetch all applications tied to their specific jobs to review candidates. Providers can fetch a history of all their submitted applications.
*   **Update (PATCH):** Service Seekers can change the status of an application by updating it to either `ACCEPTED` or `REJECTED`.
*   **Delete (DELETE):** Service Providers have the ability to withdraw (delete) their application from the database as long as it is still in the `PENDING` state.

### 3. Review (Platform Feedback)
The model capturing the feedback and rating a Seeker leaves for a Provider after a successful collaboration.
*   **Create (POST):** Once an application is accepted, the Service Seeker can create a review by submitting a star rating (1-5) and a written comment.
*   **Read (GET):** Anyone can fetch and read the reviews on a Service Provider's public profile pop-up. Seekers can also fetch a personalized list of all the reviews they have given.
*   *(Update)*: *Update operations on reviews are intentionally omitted to preserve data integrity and prevent manipulation, mimicking real-world industry standards.*
*   **Delete (DELETE):** A Service Seeker can delete a review they previously created. Doing so automatically triggers the system to recalculate the provider's overall average rating.

## ✨ Additional Features

*   **Role-Based Authentication:** Dedicated onboarding and protected dashboard routes for Seekers and Providers.
*   **Provider Profiles:** Detailed public profiles showcasing a provider's bio, skills, location, verification status, and historical reviews.
*   **Notification System:** In-app alerts informing users of application status changes and new reviews.

## 🛠 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v20+ recommended)
- MongoDB (Local or Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/skill_bridge.git
   cd skill_bridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to `http://localhost:3000` in your browser.

## 📂 Project Structure

- `app/`: Next.js App Router structure.
  - `(auth)/`: Login and registration routes.
  - `(dashboard)/`: Protected dashboard routes.
  - `api/`: Backend REST API endpoints managing CRUD operations.
  - `jobs/`: Public job board.
- `models/`: Mongoose database schemas.
- `docs/`: System specifications and non-technical feature guides.
