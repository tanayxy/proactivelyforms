# Collaborative Form Filling System

A real-time collaborative form filling system similar to Google Docs, but for structured forms. Multiple users can work together to fill out a single form response in real-time, with live updates for admins and robust conflict resolution.

## Features

- Admin can create forms with custom fields (text, number, dropdown)
- Share forms with unique codes
- Real-time collaborative editing with live updates
- User authentication and authorization (Admin and Regular User roles)
- Optimistic locking for concurrent form field edits
- Live tracking of active participants filling a form
- Real-time display of submitted forms in the admin view

## Technologies Used

- **Backend**: Node.js with Express
  - *Why*: Provides a robust and scalable server-side environment for handling API requests and business logic.
- **Real-time Communication**: Socket.IO
  - *Why*: Enables bidirectional, low-latency communication between the server and clients, essential for real-time form updates and participant tracking.
- **Database**: PostgreSQL
  - *Why*: A powerful, reliable, and open-source relational database suitable for structured form data and user information.
- **Authentication**: JWT (JSON Web Tokens)
  - *Why*: A secure and efficient method for stateless user authentication and authorization.
- **Frontend**: React.js with Material-UI (MUI)
  - *Why*: React provides a component-based architecture for a dynamic and responsive user interface, while MUI offers pre-designed, accessible UI components for faster development and a consistent look.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup & Run Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd proactively # Navigate into the project root
    ```

2.  **Backend Setup:**

    a.  **Navigate to the backend directory:**
        ```bash
        cd backend
        ```
    b.  **Install backend dependencies:**
        ```bash
        npm install
        ```
    c.  **Create a PostgreSQL database:**
        ```sql
        CREATE DATABASE collaborative_forms;
        ```
    d.  **Create a `.env` file** in the `backend` directory (i.e., `proactively/backend/.env`) with the following variables:

        ```
        PORT=5000
        DB_USER=postgres
        DB_HOST=localhost
        DB_NAME=collaborative_forms
        DB_PASSWORD=your_password
        DB_PORT=5432
        JWT_SECRET=your-secret-key
        ```
    e.  **Initialize the database schema:**
        ```bash
        psql -U postgres -d collaborative_forms -f src/db/schema.sql
        ```
    f.  **Add `version` column to `form_responses` (if it doesn't exist):**
        ```sql
        ALTER TABLE form_responses
        ADD COLUMN version INTEGER DEFAULT 0;
        ```
    g.  **Add `form_user_submissions` table (if it doesn't exist):**
        ```sql
        CREATE TABLE form_user_submissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            answers JSONB NOT NULL DEFAULT '{}',
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_form_user_submissions_form_id ON form_user_submissions(form_id);
        CREATE INDEX idx_form_user_submissions_user_id ON form_user_submissions(user_id);
        ```
    h.  **Start the backend server:**
        ```bash
        npm start # or npm run dev if you have a dev script
        ```

3.  **Frontend Setup:**

    a.  **Open a new terminal and navigate to the frontend directory:**
        ```bash
        cd proactively-frontend
        ```
    b.  **Install frontend dependencies:**
        ```bash
        npm install
        ```
    c.  **Start the frontend development server:**
        ```bash
        npm start
        ```

    The frontend application should now be accessible in your browser, usually at `http://localhost:3000`.

## Architecture and Design Decisions

### Real-time Collaboration

The system leverages **Socket.IO** for real-time, bidirectional communication between the server and connected clients. This enables: 
- **Live Form Editing**: As a user types into a form field, changes are instantly transmitted to the server and then broadcast to all other active participants in that form's room, ensuring everyone sees the most up-to-date responses. 
- **Active Participant Tracking**: The backend maintains an in-memory store of active users for each form, broadcasting updates (users joining/leaving) to administrators, allowing them to see who is currently viewing or filling out a form. 
- **Live Submitted Responses**: When a form is successfully submitted, a `formSubmitted` Socket.IO event is emitted, allowing the admin view to instantly display new submissions without requiring a page refresh.

### Optimistic Locking for Conflict Resolution

To manage concurrent edits on the same form response, the system implements an **optimistic locking** strategy. 
- A `version` column is included in the `form_responses` table. 
- When a client sends an update, it includes the `currentVersion` it's working on. 
- The server compares this `currentVersion` with the `dbVersion`. If they mismatch, a `formConflict` event is emitted back to the client, indicating that the form has been updated by another user and prompting a refresh or re-sync.
- On successful updates, the `version` number is incremented, and the new version is broadcast to all clients.

### Modular Design

The backend is structured with clear separation of concerns, utilizing:
- **Routes**: For defining API endpoints and handling HTTP requests.
- **Models**: For interacting with the PostgreSQL database and encapsulating data logic.
- **Middleware**: For authentication, authorization, and other request processing tasks.

## Key Features and Edge Cases Handled

- **User Roles**: Differentiates between 'admin' and 'user' roles, with administrators having the ability to create forms and view live submissions.
- **Unique Form Sharing**: Forms can be shared via unique share codes, allowing users to join specific forms.
- **Dynamic Form Fields**: Admins can define custom form fields (text, number, dropdown) with configurable labels and options.
- **Real-time Form State Synchronization**: All changes made to a form response are reflected in real-time across all connected clients for that form.
- **Robust Form Submission**: Handles final submission of completed forms and stores them in a dedicated `form_user_submissions` table for historical tracking.
- **Disconnected Socket Handling**: Implements logic to track and remove participants when their socket connection is lost.
- **Frontend Authentication**: Ensures that Socket.IO connections are authenticated using JWTs, providing secure real-time communication.

## API Endpoints

### Authentication
- POST `/auth/register` - Register a new user
- POST `/auth/login` - Login user
- GET `/auth/me` - Get current user

### Forms
- POST `/forms` - Create a new form (admin only)
- GET `/forms/my-forms` - Get all forms created by the user
- GET `/forms/:id` - Get a specific form
- POST `/forms/join/:shareCode` - Join a form using share code
- GET `/forms/:id/participants` - Get form participants
- POST `/forms/:id/response` - Update form response
- GET `/forms/:id/response` - Get form response
- GET `/forms/:id/submissions` - Get all submitted responses for a specific form (admin only)
- POST `/forms/:id/submit` - Submit a completed form (user or admin)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 