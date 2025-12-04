---
trigger: always_on
---

# Detected Stack & Repo Signals (Used to Shape Rules)

- Next.js (App Router) + TypeScript (repo top-level)
- Prisma ORM and DB schema usage (`prisma/` folder)
- Tailwind CSS + Tailwind config present
- NextAuth authentication and environment variables
- Multilanguage / i18n (English, French, Arabic) and public tracking features
- Image upload, SMS, and print features included in the project

---

# Coding Rules (Applies to All Codegen by Cursor)

## Project Conventions
- Use Next.js App Router patterns (`app/` directory): server components by default, client only when explicitly needed.
- Use TypeScript everywhere and prefer `interface` for public props/types.
- Use Prisma client for all DB access; always use parameterized queries.
- Follow existing folder layout (`src/app`, `src/components`, `prisma`).

## Components & UI
- Prefer React Server Components (RSC) for all data fetching and page-level logic.
- Use `use client` only when browser APIs, interactivity, or local state are required.
- Wrap client components with `<Suspense fallback={...}>` when rendered inside server components.
- Use Tailwind utility classes following a mobile-first approach.
- Break UI into small composable components and export named components.
- Follow accessibility best practices: semantic HTML, aria-labels for icon-only buttons, proper modal focus handling.

## Forms & Validation
- Use typed form libraries consistently (React Hook Form + Zod).
- Keep client-only form components small.
- Export Zod schemas and mirror validation on the server when possible.

## TypeScript & Code Style
- Use `function` keyword for pure helpers/utilities.
- Prefer explicit interfaces; avoid `any`.
- Avoid enums for runtime maps — prefer `const` objects with `as const`.
- Use clear boolean-prefixed variable names (e.g., `isLoading`, `hasError`, `canDelete`).
- Organize files: exported component → subcomponents → helpers → constants → types.

## Data Fetching & Server Logic
- Use Next.js server actions or async server functions for mutations.
- Never access secrets or environment variables in client components.
- Keep Prisma usage in server code (server actions, route handlers). Do not bundle Prisma into client code.

## API Routes & Error Handling
- Follow existing API patterns: use `try/catch`, structured JSON responses, correct HTTP status codes.
- Enforce role-based access rules (Admin vs Staff).

## Images & Media
- Optimize images: prefer WebP, provide width/height, and lazy-load when needed.
- For Base64 device photos: process uploads server-side, validate and stream safely.

## i18n & Copy
- All user-facing text must be translatable.
- Add new i18n keys to English and update French/Arabic as needed.
- Keep copy changes minimal; update locale files in the same commit.

## Performance & Bundling
- Reduce client bundle size using dynamic imports.
- Avoid unnecessary `useEffect` and local state; favor server-rendered logic.
- Optimize Web Vitals: avoid layout shifts, lazy-load images below-the-fold.

## Security & Infrastructure
- Keep secrets (`NEXTAUTH_SECRET`) only in environment variables and server code.
- Sanitize file uploads and all SMS/email templates.
- Email/SMS templates must be i18n-ready and safe.

## Tests & Documentation
- Update or add tests for critical flows (auth, ticket status, returns workflow).
- Update README / API documentation whenever new endpoints or workflows are added.

---

# Commit & Codegen Behavior for Cursor

- Generate single-file changes unless the task requires multiple files.
- Include a header comment summarizing the change and any required doc/i18n updates.
- Add unit tests or TODOs when modifying critical business flows.
- When changing the Prisma schema, always include:

  ```
  npx prisma generate && npx prisma db push
  ```

---

# Strict Rules (Hard Stop)

- Do **not** invent database models or fields. All DB changes must reflect the existing Prisma schema.
- Do **not** expose or log secrets.
- Do **not** change i18n keys without updating at least `locales/en.json`.
