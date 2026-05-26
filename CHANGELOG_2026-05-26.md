# NEXONE-PCI Change Log - 2026-05-26

## Scope
- Collaboration module: Messages
- Profile management
- Header notifications
- Announcements
- Table pagination and numbering
- Local/prod deployment readiness notes

## Messages
- Replaced the placeholder `Messages` page with a working one-on-one chat module.
- Added active user list for starting a conversation.
- Added conversation list with latest message preview.
- Added message thread view with sender bubbles and timestamp.
- Added message sending through the backend API.
- Added 6-second refresh on active conversations so new messages appear without manual reload.
- Added backend models:
  - `Conversation`
  - `Message`
  - `conversation_participants` many-to-many join table
- Added backend API routes:
  - `GET /api/v1/messages/users`
  - `GET /api/v1/messages/conversations`
  - `POST /api/v1/messages/conversations`
  - `GET /api/v1/messages/conversations/:id/messages`
  - `POST /api/v1/messages/conversations/:id/messages`

## Profile
- Added profile update API:
  - `PUT /api/v1/profile`
- Added avatar upload API:
  - `POST /api/v1/profile/avatar`
  - `GET /api/v1/profile/avatar/:filename`
- Avatar uploads are stored under the configured upload directory in `avatars/`.
- Avatar upload validation:
  - image files only
  - max 2 MB
  - supported extensions: JPG, PNG, WebP, GIF
- Moved profile editing from the Messages module into the top-right profile dropdown.
- Profile dropdown now supports:
  - upload profile photo
  - edit name
  - edit job title
  - edit phone
  - save profile
  - sign out
- Updated auth state persistence so profile/avatar changes are saved back to browser storage.
- Updated layout avatar rendering so uploaded profile photos appear in sidebar and profile dropdown.

## Notifications
- Header notification bell now includes:
  - new chat messages
  - announcements
- Notification badge count combines unread messages and unread announcements.
- Notifications refresh automatically every 15 seconds while the app is open.
- Opening the notification panel marks current chat and announcement notifications as seen on that browser.
- Notification panel now has separate sections:
  - New messages
  - Announcements
- Clicking a message notification opens the Messages module.
- Clicking an announcement notification opens the Announcements module.

## Announcements
- Existing Announcements module is connected to the notification bell.
- New announcements created by admin or users appear in notifications.
- Announcement notifications respect active announcement dates when available.

## Table Lists
- Added `No.` as the first column for:
  - Leads
  - Quotations
  - Contracts
  - Items
  - Tasks
  - Invoices
  - Payments
  - Expenses
- List/page size set to 30 rows.
- Row numbers continue across pages, for example page 2 starts at 31.
- Pages without previous client-side pagination now use pagination.

## Local Routing Fix
- Fixed local frontend Nginx proxy target from generic `backend:8080` to `nexone-pci-backend:8080`.
- This prevents login requests from being routed to another Docker project on the shared network.

## Verification
- Frontend build passed with `npm run build`.
- Backend compile/tests passed with `go test ./...`.
- Local Docker services were rebuilt during development.
- Message API was tested locally:
  - user list loads
  - conversation creation works
  - message send works
  - message list returns saved messages

## Deployment Notes
- Backend AutoMigrate will create the new message tables on startup.
- Ensure production `UPLOAD_DIR` volume is preserved because profile avatars are stored there.
- After deployment, verify:
  - login
  - `/messages`
  - send message between two users
  - upload avatar from profile dropdown
  - create announcement and confirm notification appears
  - notification badge updates for new chats and announcements
