# ADR 002: Issues and Maintenance CRUD UX Design

**Status**: Approved
**Date**: 2026-01-15
**Decision Makers**: User

## Context

The building status application displays current issues and scheduled maintenance, but currently has no way for authenticated managers to create, edit, or resolve these items through the UI. We need to design a user-friendly CRUD interface that fits the existing mobile-first, tap-to-edit design pattern.

## Decision

Implement modal-based CRUD operations with soft-delete pattern for issues and maintenance items.

## Design Decisions

### 1. Create Operations (Modal/Dialog)

**UX Flow**:
- In edit mode, display "+ Add Issue" and "+ Add Maintenance" buttons
- Click opens a centered modal overlay with appropriate form
- Modal includes form fields, Save, and Cancel buttons
- On save, modal closes and page refreshes to show new item
- Escape key or clicking outside modal cancels the operation

**Issue Form Fields**:
- Category (text input)
- Location (text input)
- Icon (emoji picker or text input)
- Status (dropdown: 'reported', 'investigating', 'resolved')
- Detail (textarea)

**Maintenance Form Fields**:
- Date (text input - flexible format)
- Description (textarea)

### 2. Edit Operations (Modal)

**UX Flow**:
- In edit mode, edit icon (✏️) appears on each issue/maintenance card
- Click opens modal pre-populated with current values
- Same form fields as create operation
- Save updates database and refreshes page
- Cancel discards changes

### 3. Delete Operations (Soft Delete)

**Issues - Mark as Resolved**:
- "Resolve" button appears on issue cards in edit mode
- Click sets `resolvedAt` timestamp to current date/time
- Resolved issues are filtered out from "Current Issues" display
- Query: `where(isNull(issues.resolvedAt))`
- Preserves data for potential future "Issue History" page

**Maintenance - Mark as Complete**:
- "Complete" button appears on maintenance cards in edit mode
- Click sets `completedAt` timestamp to current date/time
- Completed maintenance filtered out from "Scheduled Maintenance" display
- Query: `where(isNull(maintenance.completedAt))`
- Preserves data for potential future "Maintenance History" page

### 4. Status Derivation Consistency

Following the pattern established in StatusPill, all status indicators should be derived from underlying data:
- Issue status derives from `status` field ('reported', 'investigating', 'resolved')
- System status derives from count ratio (3/3 = ok, 0/3 = down, 1-2/3 = issue)

## Technical Implementation

### Schema Changes Required

Add `completedAt` field to maintenance table:

```typescript
export const maintenance = pgTable('maintenance', {
  id: serial('id').primaryKey(),
  date: varchar('date', { length: 50 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // NEW FIELD
});
```

### New Components

1. **Modal Component** (`src/components/Modal.tsx`)
   - Reusable modal wrapper with overlay
   - Close on Escape, click outside, or Cancel button
   - Handles focus trap for accessibility

2. **IssueForm Component** (`src/components/IssueForm.tsx`)
   - Form fields for creating/editing issues
   - Validation before submission
   - Works in both create and edit modes

3. **MaintenanceForm Component** (`src/components/MaintenanceForm.tsx`)
   - Form fields for creating/editing maintenance
   - Validation before submission
   - Works in both create and edit modes

4. **Update Existing Components**:
   - `IssueCard.tsx`: Add edit and resolve buttons in edit mode
   - `MaintenanceCard.tsx`: Add edit and complete buttons in edit mode

### New API Routes

1. **POST /api/issues** - Create new issue
2. **PUT /api/issues/[id]** - Update existing issue
3. **POST /api/issues/[id]/resolve** - Soft delete (set resolvedAt)
4. **POST /api/maintenance** - Create new maintenance
5. **PUT /api/maintenance/[id]** - Update existing maintenance
6. **POST /api/maintenance/[id]/complete** - Soft delete (set completedAt)

All routes require password authentication.

### Query Updates

Update `src/lib/queries.ts`:

```typescript
// Issues - only show unresolved
db.select()
  .from(issues)
  .where(isNull(issues.resolvedAt))

// Maintenance - only show incomplete
db.select()
  .from(maintenance)
  .where(isNull(maintenance.completedAt))
```

## Consequences

### Positive

- **Consistent UX**: Modal pattern familiar to users from web applications
- **Data Preservation**: Soft deletes preserve historical data
- **Mobile Friendly**: Modals work well on mobile devices
- **Accessibility**: Modals can be made fully keyboard navigable
- **Simple Implementation**: No need for complex inline editing or routing

### Negative

- **Modal Overhead**: Additional component complexity for modal management
- **No Undo**: Once resolved/completed, items disappear (could add "View History" later)
- **Mobile Modal Size**: Need to ensure modals are appropriately sized for small screens

### Neutral

- **Migration Required**: Need to add `completedAt` field to existing maintenance table
- **Testing Scope**: New components and API routes require thorough testing

## Alternatives Considered

### Inline Editing
- **Pros**: No modal overlay, edit in place
- **Cons**: Complex for multi-field forms, harder on mobile
- **Rejected**: Better suited for simple single-field edits like announcements

### Separate Pages
- **Pros**: More space for forms, clearer navigation
- **Cons**: Requires routing, breaks single-page feel, slower UX
- **Rejected**: Doesn't fit with tap-to-edit simplicity

### Hard Delete
- **Pros**: Simpler database queries, no timestamp fields needed
- **Cons**: Loses historical data, no audit trail, can't undo
- **Rejected**: Soft delete is safer and enables future features

## Implementation Plan

1. Create database migration for `completedAt` field
2. Build reusable Modal component
3. Build IssueForm component
4. Build MaintenanceForm component
5. Update IssueCard with edit/resolve buttons
6. Update MaintenanceCard with edit/complete buttons
7. Create API routes for CRUD operations
8. Update queries to filter resolved/completed items
9. Add "+ Add Issue" and "+ Add Maintenance" buttons to StatusPageClient
10. Test all CRUD operations
11. Update README with new functionality

## Related Documents

- [ADR 001: Next.js Migration](./001-migrate-to-nextjs-typescript-database.md)
- Database Schema: `src/lib/schema.ts`
- Query Functions: `src/lib/queries.ts`

## Notes

- Icon selection could start as simple text input, later enhance with emoji picker
- Consider adding "Archive" view for resolved issues and completed maintenance
- May want to add "Edit" button to system status pills for editing notes later
