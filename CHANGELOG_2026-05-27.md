# NEXONE-PCI Change Log - 2026-05-27

## Asset Management
- Removed default seed categories and locations from Asset Management.
- Existing unused default seed categories/locations are cleaned up automatically on backend startup.
- Category and Location dropdowns now only show user-created database records.
- Added Category List and Location List management from the Asset Management page.
- Category and Location records can now be created, edited, and deleted.
- Delete is blocked when a category or location is already used by an asset.
- Improved Category/Location edit/delete interaction with selected-row highlight and in-app delete confirmation.
- Fixed QR/Barcode label preview so barcode SVG stays inside its box.
- Purchase Price input now uses Indonesian thousands separator.

## Print And Report Amount Formatting
- Invoice print/PDF currency values now use Indonesian thousands separator.
- Quotation print currency values now use the shared Indonesian thousands separator formatter.
- Sales and Reports pages now format displayed nominal values with `id-ID` locale so thousands use `.` consistently.

## Verification
- Backend compile/tests passed with `go test ./...`.
- Frontend build passed with `npm run build`.
- Local API CRUD verification passed for temporary category and location records.
