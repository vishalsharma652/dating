# Ember Backend

Node.js + Express + MySQL backend for the existing Ember dating frontend.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

3. Update `.env` with your MySQL credentials and JWT secret.

4. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## Notes

- The current frontend has no real API calls yet; it uses local mock data and local component state.
- Backend endpoint names mirror the existing frontend routes so the UI can be connected without large route changes.
- Development OTP is `123456`.
- Default admin credentials come from `.env`: `admin@ember.local` / `Admin@12345`.
