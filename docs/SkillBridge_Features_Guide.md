# SkillBridge Features Guide (Non-Technical Overview)

Welcome to the SkillBridge features overview! This guide is designed to explain the core capabilities of the platform in plain English, focusing on what users can actually *do* in the system without going into the technical details of how it's built under the hood. 

At its core, SkillBridge connects people who need help with a project (**Service Seekers**) with talented professionals who can do the work (**Service Providers**). The system revolves around three main pillars: **Job Postings**, **Applications**, and **Reviews**.

Here is a breakdown of what users can do within each of these pillars.

---

## 1. Job Postings (Service Posts)

A Job Posting represents a project or task that a Service Seeker wants to hire someone for. They can define the budget, requirements, and required skills for the job.

**What users can do with Job Postings:**
*   **Create:** Service Seekers can create new job postings from their dashboard. They fill out details like the title, detailed description, project category, budget, requested skills, and whether the job is remote or location-specific. 
*   **Browse & View:** Service Providers can browse through a unified "Job Board" to see all currently open postings. They can filter these postings by category or by remote preferences, and read the full details of any job that interests them. Service Seekers can also view a dedicated list of all the jobs they have personally posted.
*   **Update:** If a Service Seeker needs to change the details of a project or decides they are no longer accepting new applicants, they can update the job posting or toggle its status from "Open" to "Closed".
*   **Delete/Remove:** If a job was posted by mistake or is completely abandoned, the Service Seeker can permanently delete the posting. Doing so will also automatically clean up any applications that were submitted to that specific job.

---

## 2. Job Applications

Once a Job Posting is active, Service Providers can express their interest in the project by submitting an Application.

**What users can do with Applications:**
*   **Submit (Create):** Service Providers can apply to any "Open" job posting by writing a cover message explaining why they are a good fit for the project. The system ensures they cannot apply to the same job twice.
*   **Review & View:** Service Seekers can view a list of all applications submitted to their specific job postings, allowing them to compare candidates. Service Providers can view a history of all the applications they've submitted, so they can keep track of their outstanding proposals.
*   **Accept or Reject (Update):** Service Seekers can change the status of an application. After reviewing a candidate, the Seeker can formally "Accept" or "Reject" the application. Doing so officially updates the candidate's status and automatically notifies the candidate of the decision.
*   **Withdraw (Delete):** If a Service Provider changes their mind after submitting an application (and before the Seeker has made a decision), the Provider can withdraw their application.

---

## 3. Feedback & Reviews

After a job is formally accepted and presumably completed, Service Seekers can leave feedback on the Service Provider's performance. This helps build a trustworthy community.

**What users can do with Reviews:**
*   **Leave Feedback (Create):** Service Seekers can leave a star rating (1 to 5 stars) and a written comment for a Service Provider, but *only* if they have officially accepted that provider's application for a job.
*   **Read Reviews (View):** Reviews are publicly visible on a Service Provider's profile. When Providers apply for new jobs, Seekers can see their average rating and read past reviews left by other people.
*   **Delete Feedback:** If a Service Seeker wants to remove a review they previously wrote, they can delete it. When a review is deleted, the Service Provider's overall average rating automatically adjusts to reflect the change.

*(Note: Once a review is posted, it cannot be simply "edited" to prevent manipulation. If a user needs to change their review, they must delete the old one and submit a new one, which is an industry standard practice for maintaining authentic ratings.)*

---

## 4. User Flows & Navigation

To help you understand how users interact with the system, here are the primary step-by-step navigation paths for both Service Seekers and Service Providers.

### Authentication Flow (Getting Started)
*   **Sign Up / Login:** All users start at the login or registration screens. During registration, users must uniquely select their role: **Service Seeker** (hiring) or **Service Provider** (working).
*   **Landing Navigation:** Based on their role, users are automatically directed to their respective dashboards upon logging in.

### Service Seeker Flow (Hiring Talent)
1.  **Dashboard Hub:** The Seeker Dashboard is the central hub. It contains two main tabs: "My Posts" and "Profile".
2.  **Posting a Job:** From the "My Posts" tab, Seekers click "New Post", fill in project details (budget, required skills, etc.), and publish it. It immediately appears on the public Job Board.
3.  **Reviewing Applications:** Seekers can click on any of their posted jobs to view incoming applications at a glance.
4.  **Vetting Candidates:** Next to each application, Seekers can click **"View Profile"**. This opens a detailed pop-up showing the Provider's full bio, verified status, skills, and past reviews from other Seekers.
5.  **Hiring Decision:** Seekers can click "Accept" or "Reject". If "Accept" is clicked, the post is automatically closed to new applicants.
6.  **Leaving Feedback:** After accepting a provider, a "Leave Review" button appears, allowing the Seeker to give a 1-5 star rating and comment on the collaboration.
7.  **Managing Feedback:** In the "Profile" tab, Seekers can update their own personal information and view or delete any feedback they have previously left for providers.

### Service Provider Flow (Finding Work)
1.  **Job Board:** Providers navigate to the public Jobs page to browse all open Service Posts. They can filter by category or remote availability.
2.  **Job Details:** Clicking on a job reveals the full description, required skills, budget, and project milestones.
3.  **Applying:** At the bottom of the job details, Providers can write a cover message and submit their application. 
4.  **Dashboard Hub:** The Provider Dashboard tracks their activity securely, containing "My Applications" and "Profile" tabs.
5.  **Tracking Status:** In the "My Applications" tab, Providers can see all their submitted applications and their current status (*Pending*, *Accepted*, *Rejected*). They can safely withdraw "Pending" applications if they change their mind.
6.  **Managing Profile:** In the "Profile" tab, Providers can update their skills taxonomy, bio, and location. This dynamically builds the public profile that Seekers see when vetting them.

---

## Conclusion

By allowing users to fully interact with these three interconnected pillars—creating **Job Postings**, managing **Applications**, and building reputation through **Reviews**—SkillBridge provides a complete, end-to-end framework for finding talent and completing projects successfully.
