# Booking App Backend

Backend API for the Studio Booking application built with Node.js and Express.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booking_app
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE booking_app;
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (dev). In production it runs on `0.0.0.0:5000` and is exposed via the Apache `/api` proxy.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password

### Studios
- `GET /api/studios` - Get all studios
- `GET /api/studios/:studioId/slots/:date` - Get time slots for a studio on a specific date

### Bookings
- `POST /api/bookings/create` - Create a new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `DELETE /api/bookings/:bookingId` - Cancel a booking

### Users
- `GET /api/users/profile` - Get current user profile

## Database Schema

### Users
- id, username, email, password_hash, initials, created_at

### Studios
- id, name, description, created_at

### Time Slots
- id, studio_id, slot_number, start_time, end_time, slot_date, created_at

### Bookings
- id, user_id, studio_id, time_slot_id, booking_date, status, created_at, cancelled_at

## Notes

- Users must be created directly in the database (no frontend registration)
- Maximum 2 bookings per user
- Cannot book consecutive slots in the same studio
- JWT tokens expire after 24 hours
