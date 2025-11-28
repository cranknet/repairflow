# Changelog

All notable changes to RepairFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 

### Changed
- 

### Fixed
- 

## [1.5.0] - 2025-11-28

### Added
- **Dynamic Branding**: Added support for custom logo, favicon, and login background with default fallbacks.
- **Project Index**: Added `PROJECT_INDEX.md` for better codebase overview.
- **Ticket Management**: Enhanced filtering and status updates.

### Changed
- **UI Refactor**: Updated Badge, ConfirmDialog, SearchBars, and Notifications components for better consistency.
- **Settings**: Updated settings API and context to handle dynamic assets.

### Fixed
- **Customer Actions**: Fixed delete and edit actions in customer table.

## [1.4.0] - 2024-12-XX

### Added
- Simplified returns system with refund amount tracking
- Automatic ticket status update to RETURNED when return is created
- Status editing disabled for returned tickets

### Changed
- Returns now track ticket-level refund amounts instead of individual items
- Return creation automatically marks ticket as RETURNED
- Returns UI simplified to show refund amount instead of items/condition

### Fixed
- Button variant prop in returns client component

## [1.3.0] - 2024-12-XX

### Added
- Settings context provider to cache company logo and name, preventing flickering on navigation
- Remember me functionality in login page with localStorage persistence
- Comprehensive currencies list (100+ currencies) with symbols and flag emojis
- Comprehensive countries list (150+ countries) with flag emojis
- Notification system for ticket status changes, price adjustments, and user management
- Edit customer functionality with modal dialog
- Delete customer functionality with confirmation dialog
- Login logs viewing feature for admins
- Click-to-copy functionality for tracking codes
- Free-text input for device issues with suggestion to add new issues

### Changed
- Currency and country dropdowns now display flags alongside names
- Settings page now uses comprehensive currency and country lists
- Sidebar and dashboard use settings context instead of direct API calls
- Session duration extended to 30 days for remember me feature
- Device issue autocomplete now allows free-text input

### Fixed
- Logo and company name flickering when navigating between pages
- Currency helper now uses new comprehensive currencies data
- Prevent deletion of customers with existing tickets

## [1.2.0] - 2024-12-XX

### Added
- Date range selector for dashboard analytics with custom date range support
- Real-time dashboard data fetching based on selected date ranges
- API endpoint for dynamic sales data retrieval (`/api/dashboard/sales`)
- Image modal for viewing large images when adding tickets
- Comprehensive translation support for ticket detail pages
- Translation support for image upload components (Take Photo, Upload File, Crop Image, etc.)
- Translation support for device photos component
- Translation support for ticket tabs (Overview, Status & History, Parts & Returns, Pricing, Messaging)
- Translation support for all ticket detail labels (Back to List, Customer, Created, Status, Priority, Tracking Code, etc.)
- Date range picker component with support for Last Week, Last Two Weeks, Last Month, and Custom ranges
- Dynamic date formatting based on selected range (daily for short ranges, weekly for longer ranges)

### Changed
- Sales chart now fetches data dynamically based on selected date range
- Dashboard analytics now use real data with configurable date ranges instead of mock data
- Image upload component now shows images in a modal when clicked
- Ticket detail page header is now a client component with full translation support
- Improved date range display in sales chart with formatted labels

### Fixed
- Image crop now properly saves to ticket state when applying crop
- Cropped images are correctly stored in ticket creation form
- All ticket detail page labels are now properly translated
- Image upload labels (Take Photo, Upload File, Crop Image, Apply Crop, Cancel) are now translated
- Device photos component labels are now translated
- Date range selector properly calculates and displays date ranges

## [1.1.0] - 2024-12-XX

### Added
- Comprehensive internationalization (i18n) system with full translation support
- Translation coverage for all major UI elements (navigation, buttons, labels, filters, search)
- Translated components for search bars, filters, and empty states
- Reusable translation components (PageHeader, TranslatedCardTitle, etc.)
- Support for 100+ translation keys across English, Arabic, and French
- Language context provider with localStorage persistence
- Real-time language switching without page reload

### Changed
- All page headers now use translation system
- All search placeholders are translated
- All filter buttons are translated
- All status and priority labels are translated
- Dashboard KPIs are now translated
- Empty state messages are translated
- Improved language switcher UX (no page reload required)

### Fixed
- Language switching now works correctly without page refresh
- Translations update immediately when language is changed
- Sidebar navigation items properly translate
- User profile dropdown items translate correctly

## [1.0.0] - 2024-12-XX

### Added
- Initial stable release of RepairFlow
- Complete ticket management system with status tracking
- Customer management with history
- Inventory management with stock tracking
- Multi-language support (English, French, Arabic)
- Custom SMS templates with multi-language support
- Print system with label (40x20mm) and invoice (80x80mm) formats
- Price adjustment tracking with audit trail
- User management with role-based access control (Admin, Staff)
- Dashboard with real-time KPIs and analytics
- Public ticket tracking page
- Android app support via Capacitor
- Responsive design for all screen sizes
- Image upload for device condition
- Parts integration with tickets
- Returns management
- Payment tracking
- Device tracking (brands, models, issues)
- Search and filter functionality
- Status history with notes
- QR code generation for tickets
- Email notifications (password reset)
- Settings management (company info, branding, users)
- Theme support (light/dark mode)
- Language switcher
- Currency and country settings
- Multi-language support (English, French, Arabic)
- Custom SMS templates with multi-language support
- Print system with label (40x20mm) and invoice (80x80mm) formats
- Price adjustment tracking with audit trail
- User management with role-based access control
- Dashboard with real-time KPIs and analytics
- Ticket management with complete lifecycle tracking
- Customer management with history tracking
- Inventory management with stock tracking
- Public ticket tracking page
- Android app support via Capacitor
- Responsive design for all screen sizes

### Changed
- App name changed from "RepairShop" to "RepairFlow"
- Improved print preview modal with format selection
- Enhanced status update UI
- Better error handling and user feedback

### Fixed
- Print functionality compatibility with React 19
- Price adjustment saving issues
- Language switching without page reload
- SMS template formatting
- Various UI/UX improvements

## [1.0.0] - 2024-01-XX

### Added
- Initial release of RepairFlow
- Core ticket management system
- Customer and inventory management
- Authentication and authorization
- Dashboard with analytics
- Print functionality
- SMS notifications
- Multi-language support

---

## Version History

- **1.0.0** - Initial release

