## Project Summary
A comprehensive MCQ Examination Platform for Shree Genius IT Hub. The system provides a modern, SaaS-like interface for admins to manage courses, questions, and exams, and for students to take assessments and track their progress.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS, Shadcn/UI
- **Icons**: Lucide React
- **Notifications**: Sonner

## Architecture
- `src/app/admin`: Admin dashboard for managing Courses, Batches, Questions, Exams, Students, and Results.
- `src/app/dashboard`: Student dashboard for viewing assigned exams and previous performance.
- `src/app/exam/[id]`: Interactive exam-taking interface with timer and question navigation.
- `src/lib/supabase.ts`: Supabase client configuration.
- `profiles` table: Extends auth.users with roles ('admin', 'student') and personal details.

## User Preferences
- **Primary Color**: #2563eb (Blue)
- **Background**: White (#ffffff)
- **Typography**: Modern Sans-serif (Geist)
- **Aesthetic**: SaaS feel, minimal borders, high visual clarity.

## Project Guidelines
- **Admin Access**: Hardcoded login "admin" / "@shish" (mapped to admin@geniusit.com).
- **Student Registration**: Collects First Name, Father's Name, Surname, Mobile, Email, and Password.
- **Exam Logic**: Exams support multi-course selection, question shuffling, and optional scheduling (start/end times). Questions are filtered dynamically by selected courses.
- **Results**: Scores are calculated instantly and stored in the database.

## Common Patterns
- **Data Fetching**: Using `useEffect` with Supabase client on the client side.
- **UI Components**: Consistent use of Card, Button, and Input from shadcn/ui.
- **Feedback**: Immediate toast notifications for all CRUD operations.
