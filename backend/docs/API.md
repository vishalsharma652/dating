# Ember Backend API

Base URL: `http://localhost:5000`

All successful responses use:

```json
{ "success": true, "message": "OK", "data": {} }
```

Errors use:

```json
{ "success": false, "message": "Validation failed", "errors": [] }
```

Protected routes require `Authorization: Bearer <jwt>`.

## Brand

- `GET /api/brand` returns the public website name and logo URL

## Auth

- `POST /api/auth/register` body: `name`, `phone`, optional `email`, `password`; sends an OTP and stores the signup as pending
- `POST /api/auth/login` body: `email` or `phone`, `password`
- `GET /api/auth/me`
- `POST /api/auth/verify-otp` body: `phone`, `otp`; creates the account and returns a token after successful verification
- `POST /api/auth/resend-otp` body: `phone`; returns a fresh backend-generated OTP for the pending signup
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## User App

- `GET /api/user/dashboard`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/user/profile/setup`
- `POST /api/user/profile/age-verify` body: `dob`
- `POST /api/user/profile/kyc` multipart field: `documents`
- `POST /api/user/profile/mobile/send-otp`
- `POST /api/user/profile/mobile/verify`
- `GET /api/user/discover`
- `POST /api/user/discover/:id/action` body: `action` = `like`, `pass`, or `super_like`
- `GET /api/user/matches`
- `GET /api/user/chat`
- `GET /api/user/chat/:userId/messages`
- `POST /api/user/chat/:userId/messages` body: `text`
- `GET /api/user/wallet`
- `GET /api/user/wallet/history`
- `GET /api/user/wallet/coins`
- `POST /api/user/wallet/coins/purchase` body: `packageId`
- `POST /api/user/withdraw` body: `amount`, `method`, optional bank fields
- `GET /api/user/withdraw/history`
- `GET /api/user/notifications`
- `GET /api/user/settings`

## Admin

- `POST /api/admin/login` body: `email`, `password`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `POST /api/admin/upload` multipart field: `files`
- `GET /api/admin/settings`
- `PUT /api/admin/brand` body: `name`
- `POST /api/admin/brand/logo` multipart field: `logo`
- `PUT /api/admin/settings` body: `key`, `value`
