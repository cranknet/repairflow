---COMMIT START---
COMMIT_FILES:
src/components/tickets/tickets-table.tsx,src/components/tickets/tickets-page-client.tsx,src/app/(main)/tickets/page.tsx
COMMIT_HEADER:
feat(tickets): convert view link to button and add conditional delete button
COMMIT_BODY:
Replace View text link with styled button (EyeIcon + label) and add Delete button (TrashIcon + label) in tickets table action row.

- View button uses outlined variant with EyeIcon
- Delete button is admin-only, disabled for REPAIRED/RETURNED tickets
- Delete button opens confirmation modal with ticket details
- Proper error handling for 403, 400, and other errors
- Added aria-labels and accessibility features
- Pass userRole from server to client components

Files:
- src/components/tickets/tickets-table.tsx: Main implementation with buttons and delete modal
- src/components/tickets/tickets-page-client.tsx: Pass userRole prop
- src/app/(main)/tickets/page.tsx: Extract and pass userRole from session

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)
STAGING_COMMANDS:
git add src/components/tickets/tickets-table.tsx src/components/tickets/tickets-page-client.tsx src/app/(main)/tickets/page.tsx
git commit -m "feat(tickets): convert view link to button and add conditional delete button

Replace View text link with styled button (EyeIcon + label) and add Delete button (TrashIcon + label) in tickets table action row.

- View button uses outlined variant with EyeIcon
- Delete button is admin-only, disabled for REPAIRED/RETURNED tickets
- Delete button opens confirmation modal with ticket details
- Proper error handling for 403, 400, and other errors
- Added aria-labels and accessibility features
- Pass userRole from server to client components

Files:
- src/components/tickets/tickets-table.tsx: Main implementation with buttons and delete modal
- src/components/tickets/tickets-page-client.tsx: Pass userRole prop
- src/app/(main)/tickets/page.tsx: Extract and pass userRole from session

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
src/components/customers/customers-table.tsx,src/components/customers/customers-page-client.tsx,src/app/(main)/customers/page.tsx,src/app/api/customers/[id]/route.ts
COMMIT_HEADER:
feat(customers): convert view/edit/delete links to styled buttons and add safe delete flow
COMMIT_BODY:
Replace View, Edit, Delete links with styled buttons (icons + labels) in customers table action row.

- View button uses outlined variant with EyeIcon
- Edit button uses ghost variant with PencilIcon + label
- Delete button is admin-only, disabled when customer has linked tickets
- Delete button opens confirmation modal with customer details
- Added admin permission check in DELETE API endpoint (403 for non-admins)
- Proper error handling for 403, 400, and other errors
- Added aria-labels and accessibility features
- Pass userRole from server to client components

Files:
- src/components/customers/customers-table.tsx: Main implementation with buttons and delete modal
- src/components/customers/customers-page-client.tsx: Pass userRole prop
- src/app/(main)/customers/page.tsx: Extract and pass userRole from session
- src/app/api/customers/[id]/route.ts: Add admin-only check for delete endpoint

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)
STAGING_COMMANDS:
git add src/components/customers/customers-table.tsx src/components/customers/customers-page-client.tsx src/app/(main)/customers/page.tsx src/app/api/customers/[id]/route.ts
git commit -m "feat(customers): convert view/edit/delete links to styled buttons and add safe delete flow

Replace View, Edit, Delete links with styled buttons (icons + labels) in customers table action row.

- View button uses outlined variant with EyeIcon
- Edit button uses ghost variant with PencilIcon + label
- Delete button is admin-only, disabled when customer has linked tickets
- Delete button opens confirmation modal with customer details
- Added admin permission check in DELETE API endpoint (403 for non-admins)
- Proper error handling for 403, 400, and other errors
- Added aria-labels and accessibility features
- Pass userRole from server to client components

Files:
- src/components/customers/customers-table.tsx: Main implementation with buttons and delete modal
- src/components/customers/customers-page-client.tsx: Pass userRole prop
- src/app/(main)/customers/page.tsx: Extract and pass userRole from session
- src/app/api/customers/[id]/route.ts: Add admin-only check for delete endpoint

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
src/components/returns/create-return-modal.tsx,src/components/returns/returns-client.tsx,src/app/(main)/returns/page.tsx,src/components/tickets/ticket-details-client.tsx,src/app/api/tickets/search/route.ts,src/app/api/returns/validate/route.ts
COMMIT_HEADER:
feat(returns): refactor returns page with searchable modal and ticket status integration
COMMIT_BODY:
Refactor returns creation workflow to use searchable modal instead of static list.

- Remove "Create New Return" list section, keep single "Create Return" button
- Add search input in modal for customer name or ticket ID
- Only repaired tickets without active returns are searchable
- Modal shows search results with ticket details
- When ticket status changed to RETURNED, open modal prefilled with ticket data
- Add ticketId prop to CreateReturnModal for prefilled flow
- Hide search when ticketId is provided (ticket view flow)
- Add ticket fetching logic with loading/error states and retry
- Create new API endpoints: /api/tickets/search and /api/returns/validate

Files:
- src/components/returns/create-return-modal.tsx: Add search functionality and ticketId prop support
- src/components/returns/returns-client.tsx: Remove eligible tickets list, add single button
- src/app/(main)/returns/page.tsx: Remove eligible tickets fetching
- src/components/tickets/ticket-details-client.tsx: Open modal with ticketId when status changes to RETURNED
- src/app/api/tickets/search/route.ts: New endpoint for searching repaired tickets
- src/app/api/returns/validate/route.ts: New endpoint for validating return creation

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)
STAGING_COMMANDS:
git add src/components/returns/create-return-modal.tsx src/components/returns/returns-client.tsx src/app/(main)/returns/page.tsx src/components/tickets/ticket-details-client.tsx src/app/api/tickets/search/route.ts src/app/api/returns/validate/route.ts
git commit -m "feat(returns): refactor returns page with searchable modal and ticket status integration

Refactor returns creation workflow to use searchable modal instead of static list.

- Remove \"Create New Return\" list section, keep single \"Create Return\" button
- Add search input in modal for customer name or ticket ID
- Only repaired tickets without active returns are searchable
- Modal shows search results with ticket details
- When ticket status changed to RETURNED, open modal prefilled with ticket data
- Add ticketId prop to CreateReturnModal for prefilled flow
- Hide search when ticketId is provided (ticket view flow)
- Add ticket fetching logic with loading/error states and retry
- Create new API endpoints: /api/tickets/search and /api/returns/validate

Files:
- src/components/returns/create-return-modal.tsx: Add search functionality and ticketId prop support
- src/components/returns/returns-client.tsx: Remove eligible tickets list, add single button
- src/app/(main)/returns/page.tsx: Remove eligible tickets fetching
- src/components/tickets/ticket-details-client.tsx: Open modal with ticketId when status changes to RETURNED
- src/app/api/tickets/search/route.ts: New endpoint for searching repaired tickets
- src/app/api/returns/validate/route.ts: New endpoint for validating return creation

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
src/app/api/returns/route.ts,src/app/api/returns/[id]/route.ts,src/app/api/tickets/[id]/route.ts,src/components/returns/returns-table.tsx,src/components/tickets/ticket-status-badge.tsx
COMMIT_HEADER:
feat(returns): implement return approval workflow and auto-create on status change
COMMIT_BODY:
Implement return approval workflow where ticket status changes only when return is approved.

- Ticket status remains REPAIRED when return is created (PENDING status)
- Ticket status changes to RETURNED only when return is APPROVED
- Ticket status remains REPAIRED when return is REJECTED
- When manually changing ticket status to RETURNED, auto-create return record
- Auto-creation only happens when changing from REPAIRED to RETURNED
- Default refund amount is full amount (finalPrice or estimatedPrice)
- Reason is required in status change request
- Admin-only permission for creating returns via status change
- Add handledAt and handledBy fields to Return model
- Add return pending indicator to ticket status badge

Files:
- src/app/api/returns/route.ts: Update to keep ticket REPAIRED, add createdBy field
- src/app/api/returns/[id]/route.ts: Update approval/rejection to change ticket status accordingly
- src/app/api/tickets/[id]/route.ts: Add auto-create return when status changes to RETURNED
- src/components/returns/returns-table.tsx: Update success messages for new workflow
- src/components/tickets/ticket-status-badge.tsx: Add return pending indicator

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)
STAGING_COMMANDS:
git add src/app/api/returns/route.ts src/app/api/returns/[id]/route.ts src/app/api/tickets/[id]/route.ts src/components/returns/returns-table.tsx src/components/tickets/ticket-status-badge.tsx
git commit -m "feat(returns): implement return approval workflow and auto-create on status change

Implement return approval workflow where ticket status changes only when return is approved.

- Ticket status remains REPAIRED when return is created (PENDING status)
- Ticket status changes to RETURNED only when return is APPROVED
- Ticket status remains REPAIRED when return is REJECTED
- When manually changing ticket status to RETURNED, auto-create return record
- Auto-creation only happens when changing from REPAIRED to RETURNED
- Default refund amount is full amount (finalPrice or estimatedPrice)
- Reason is required in status change request
- Admin-only permission for creating returns via status change
- Add handledAt and handledBy fields to Return model
- Add return pending indicator to ticket status badge

Files:
- src/app/api/returns/route.ts: Update to keep ticket REPAIRED, add createdBy field
- src/app/api/returns/[id]/route.ts: Update approval/rejection to change ticket status accordingly
- src/app/api/tickets/[id]/route.ts: Add auto-create return when status changes to RETURNED
- src/components/returns/returns-table.tsx: Update success messages for new workflow
- src/components/tickets/ticket-status-badge.tsx: Add return pending indicator

Notes: Requires translation update (i18n keys added), requires docs update (README.md updated)"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
src/lib/i18n.ts
COMMIT_HEADER:
i18n(translations): add translation keys for tickets, customers, and returns features
COMMIT_BODY:
Add comprehensive translation keys for new features in English, Arabic, and French.

- Tickets action buttons: view, delete, delete disabled messages, modal content
- Customers action buttons: view, edit, delete, delete disabled messages, modal content
- Returns workflow: search labels, validation messages, status indicators
- Delete confirmation modals: titles, descriptions, button labels
- Success and error messages for all delete operations

All keys follow consistent naming pattern: feature.action.action_name or feature.modal.modal_name

Files:
- src/lib/i18n.ts: Added ~50+ new translation keys across EN, AR, FR locales

Notes: All user-facing strings are now translated
STAGING_COMMANDS:
git add src/lib/i18n.ts
git commit -m "i18n(translations): add translation keys for tickets, customers, and returns features

Add comprehensive translation keys for new features in English, Arabic, and French.

- Tickets action buttons: view, delete, delete disabled messages, modal content
- Customers action buttons: view, edit, delete, delete disabled messages, modal content
- Returns workflow: search labels, validation messages, status indicators
- Delete confirmation modals: titles, descriptions, button labels
- Success and error messages for all delete operations

All keys follow consistent naming pattern: feature.action.action_name or feature.modal.modal_name

Files:
- src/lib/i18n.ts: Added ~50+ new translation keys across EN, AR, FR locales

Notes: All user-facing strings are now translated"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
src/components/ui/confirm-dialog.tsx
COMMIT_HEADER:
feat(ui): add loading state support to ConfirmDialog component
COMMIT_BODY:
Add isLoading prop to ConfirmDialog to support async operations.

- Add isLoading prop to ConfirmDialogProps interface
- Disable both Cancel and Confirm buttons when loading
- Show translated loading text in Confirm button during async operation
- Use existing i18n key 'loading' for consistent translations
- Prevents double-submission and provides visual feedback

Files:
- src/components/ui/confirm-dialog.tsx: Add isLoading prop, loading state handling, and i18n integration

Notes: Used by delete confirmation modals in tickets and customers tables
STAGING_COMMANDS:
git add src/components/ui/confirm-dialog.tsx
git commit -m "feat(ui): add loading state support to ConfirmDialog component

Add isLoading prop to ConfirmDialog to support async operations.

- Add isLoading prop to ConfirmDialogProps interface
- Disable both Cancel and Confirm buttons when loading
- Show translated loading text in Confirm button during async operation
- Use existing i18n key 'loading' for consistent translations
- Prevents double-submission and provides visual feedback

Files:
- src/components/ui/confirm-dialog.tsx: Add isLoading prop, loading state handling, and i18n integration

Notes: Used by delete confirmation modals in tickets and customers tables"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
prisma/schema.prisma,prisma/seed.ts
COMMIT_HEADER:
feat(db): update Return model schema and seed data
COMMIT_BODY:
Update Return model to include new fields for return workflow tracking.

- Add returnedTo, notes, createdBy, handledAt, handledBy fields to Return model
- Add relations to User model for createdBy and handledBy
- Update seed.ts to generate proper return data with new fields
- Ensure seed data follows app specifications

Files:
- prisma/schema.prisma: Add new fields and relations to Return model
- prisma/seed.ts: Update return creation to include new required fields

Notes: Requires database migration (prisma db push or migrate)
STAGING_COMMANDS:
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat(db): update Return model schema and seed data

Update Return model to include new fields for return workflow tracking.

- Add returnedTo, notes, createdBy, handledAt, handledBy fields to Return model
- Add relations to User model for createdBy and handledBy
- Update seed.ts to generate proper return data with new fields
- Ensure seed data follows app specifications

Files:
- prisma/schema.prisma: Add new fields and relations to Return model
- prisma/seed.ts: Update return creation to include new required fields

Notes: Requires database migration (prisma db push or migrate)"
---COMMIT END---

---COMMIT START---
COMMIT_FILES:
README.md
COMMIT_HEADER:
docs(readme): update documentation for new UI features and workflows
COMMIT_BODY:
Update README.md to document new styled button features and return workflow changes.

- Document styled action buttons in Ticket Management section
- Document styled action buttons in Customer Management section
- Update Returns Workflow section with new searchable modal flow
- Document ticket status change integration with return creation

Files:
- README.md: Updated Core Functionality section with new feature descriptions

Notes: Documentation now reflects current UI and workflow implementations
STAGING_COMMANDS:
git add README.md
git commit -m "docs(readme): update documentation for new UI features and workflows

Update README.md to document new styled button features and return workflow changes.

- Document styled action buttons in Ticket Management section
- Document styled action buttons in Customer Management section
- Update Returns Workflow section with new searchable modal flow
- Document ticket status change integration with return creation

Files:
- README.md: Updated Core Functionality section with new feature descriptions

Notes: Documentation now reflects current UI and workflow implementations"
---COMMIT END---

AUTO_SPLIT_RESULT: 7 commits planned

