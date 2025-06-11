# Collaborative Form Filling System

A real-time collaborative form filling system similar to Google Docs, but for structured forms. Multiple users can work together to fill out a single form response in real-time.

## Features

- Admin can create forms with custom fields (text, number, dropdown)
- Share forms with unique codes
- Real-time collaborative editing
- User authentication and authorization
- Form field locking to prevent conflicts
- Live updates as users type

## Tech Stack

- Backend: Node.js with Express
- Real-time Communication: Socket.IO
- Database: PostgreSQL
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-form-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE collaborative_forms;
```

4. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=collaborative_forms
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your-secret-key
```

5. Initialize the database:
```bash
psql -U postgres -d collaborative_forms -f src/db/schema.sql
```

6. Start the server:
```bash
npm run dev
```

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

## Real-time Features

The system uses Socket.IO for real-time updates. When a user makes changes to a form:

1. The change is sent to the server
2. The server updates the database
3. The change is broadcast to all connected clients
4. Other users see the updates in real-time

## Conflict Resolution

The system implements a basic field-level locking mechanism:
- When a user starts editing a field, it's marked as "locked"
- Other users can't edit locked fields
- The lock is released when the user finishes editing

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 