# Cognito Authentication Setup

This app uses AWS Cognito User Pool authentication with HttpOnly cookies set by Next.js route handlers.

## Required environment variables

- `NEXT_PUBLIC_COGNITO_REGION`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `API_BASE_URL`

## Flow summary

- `POST /api/auth/signup` creates user in Cognito.
- `POST /api/auth/confirm-signup` confirms email code.
- `POST /api/auth/resend-signup-code` resends confirmation code.
- `POST /api/auth/login` performs Cognito `USER_PASSWORD_AUTH` and sets:
  - `mx_access_token`
  - `mx_id_token`
  - `mx_refresh_token`
- `POST /api/auth/forgot-password` sends password reset code.
- `POST /api/auth/forgot-password-submit` confirms password reset.
- `POST /api/auth/logout` clears auth cookies.
- `GET /api/auth/session` returns lightweight session status.

## Testing checklist

- [ ] Sign up new user
- [ ] Confirm email
- [ ] Login (cookies set, refresh persists)
- [ ] Visit protected route -> allowed
- [ ] Call backend `/me` -> returns expected `sub/email/groups`
- [ ] Forgot password -> reset -> login
- [ ] Logout clears cookies -> protected routes redirect to login
