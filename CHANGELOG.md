# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - 2025-11-29

### Added
- **Notifications**: Integrated old notification system across customers, tickets, payments, and other entities using an adapter/bridge layer
- **Events**: New event system for emitting notifications on entity changes (created, updated, deleted, status_changed, etc.)
- **Suppliers**: Added Supplier model and CRUD API endpoints with notification support
- **Notification Preferences**: User notification preferences UI in settings to control which notifications to receive
- **Deep Links**: Enhanced notification components with deep link support for tickets

### Changed
- **Release**: Reset project versioning to Beta.
- **Removed**: Electron desktop app support - application is now web-only.
