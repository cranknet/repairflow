# RepairFlow Load Tests

This directory contains k6 load testing scripts to verify performance and stability.

## Prerequisites

1. **Install k6**:
   - macOS: `brew install k6`
   - Linux: `sudo apt-get install k6` or `snap install k6`
   - Windows: `choco install k6`

2. **Start the Application**:
   Ensure RepairFlow is running locally (`http://localhost:3000`) or target a staging URL.

3. **Authentication**:
   Most tests (except health/login checks) require a valid session cookie.
   - Log in to your application manually.
   - Open DevTools -> Application -> Cookies.
   - Copy the value of `next-auth.session-token`.
   - Set it as an environment variable or pass it to k6.

   Example (Powershell):
   ```powershell
   $env:AUTH_COOKIE="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..your_token"
   ```

## Available Tests

### 1. Concurrent Users (Unauthenticated/Public)
Tests general site availability and public endpoints.
```bash
k6 run load-tests/concurrent-users.js
```

### 2. Ticket Browsing (Read Logic)
Tests database read performance for ticket lists.
```bash
k6 run load-tests/ticket-operations.js
```

### 3. Create Ticket (Write Logic + Base64)
Tests creation of tickets with **large Base64 image payloads** (simulating device photos).
This stresses JSON parsing and database writes.
```bash
k6 run --env AUTH_COOKIE="<cookie>" load-tests/create-ticket.js
```

### 4. File Upload (Multipart)
Tests binary file upload to the settings endpoint. Stresses disk I/O and buffer validation.
**Requires ADMIN role.**
```bash
k6 run --env AUTH_COOKIE="<cookie>" load-tests/file-upload.js
```

## Running All Tests (Script)
You can use the npm scripts defined in `package.json`:
```bash
npm run load:test        # Run concurrent users test
npm run load:tickets     # Run ticket browsing test
```

## Reports
To generate a JSON summary:
```bash
k6 run --out json=results.json load-tests/concurrent-users.js
```
