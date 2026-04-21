# TeamFlow — Feature Roadmap

Tasks are in priority order. Remove each item once completed.

---

## 🚀 High Priority (Resume Impact)

- [ ] **Global Search** — search across tasks, projects, and users

---

## 🔧 Core Feature Gaps

- [ ] **Forgot Password / Reset Password** — Firebase `sendPasswordResetEmail` flow
- [ ] **Email Verification on Register** — Firebase `sendEmailVerification`
- [ ] **Task Comments** — discussion thread per task, stored in Firebase
- [ ] **File Attachments on Tasks** — Firebase Storage integration
- [ ] **Subtasks / Checklists** — checklist items within a task
- [ ] **Bulk Task Actions** — reassign, change status, delete multiple at once
- [ ] **Project Archiving** — soft delete with restore option
- [ ] **Soft Delete for Tasks/Projects** — trash bin with restore

---

## 👤 User & Auth

- [ ] **User Profile Page** — avatar upload, bio, change password
- [ ] **Invite Users by Email** — send invite link via Firebase
- [ ] **OAuth Login** — Google / GitHub sign-in via Firebase
- [ ] **Session Timeout Warning** — prompt before auto-logout

---

## 📊 Reporting & Analytics

- [ ] **Burndown Chart** — per-project task completion over time
- [ ] **Productivity Report** — tasks completed per user over time
- [ ] **Overdue Tasks Report** — dedicated view/page
- [ ] **Export to CSV/PDF** — tasks and project data

---

## 🎨 UX / UI

- [ ] **Skeleton Loaders** — expand usage across more pages
- [ ] **Keyboard Shortcuts** — `N` new task, `?` help modal, etc.
- [ ] **Onboarding Tour** — guide for new users (react-joyride)
- [ ] **Drag-and-drop Task Reordering** — within a project list
- [ ] **Due Date Countdown Badges** — visual urgency on task cards
- [ ] **Empty State Illustrations** — use existing assets folder images

---

## 🔒 Security & Data

- [ ] **Granular Firebase Security Rules** — per-project member validation
- [ ] **Input Sanitization** — XSS prevention in task descriptions/comments
- [ ] **Audit Log Improvements** — filter by user, action type, date range
- [ ] **Data Export (GDPR)** — let users export their own data

---

## 🛠️ Infrastructure / DX

- [ ] **Firebase Emulator Suite** — local dev without hitting production DB
- [ ] **End-to-End Tests** — Playwright or Cypress
- [ ] **Expand Unit Test Coverage** — beyond current 3 test files
- [ ] **Storybook** — UI component documentation

---

## 💬 Collaboration (Nice to Have)

- [ ] **Task Dependencies** — block / blocked-by relationships
- [ ] **Task Time Tracking** — log hours worked per task
- [ ] **Recurring Tasks** — daily / weekly / monthly repeat
- [ ] **Task Templates** — reusable task structures
- [ ] **Project Milestones** — milestone markers with progress
- [ ] **Project Timeline / Gantt Chart** — visual date-based view
- [ ] **@Mentions** — in task descriptions and comments
- [ ] **Team Chat per Project** — real-time messaging
- [ ] **User Presence Indicators** — online / offline status
