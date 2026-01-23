# Card Component Refactor Plan

**Branch:** `refactor/shared-card-components`
**Status:** Planning
**Date:** 2026-01-23

## Goals

1. **Reduce Duplication**: Eliminate repeated section and card layout code
2. **Improve Consistency**: Standardize spacing, styling, and behavior across all content sections
3. **Better Maintainability**: Single source of truth for card and section patterns
4. **Easier Development**: Debug page to visualize all component states

## Component Architecture

### Two-Tier System

#### 1. `<Section>` Component
Wraps each content area with consistent styling and layout.

**Props:**
```typescript
interface SectionProps {
  title: string;           // Section heading text
  icon?: string;          // Optional emoji/icon prefix
  action?: ReactNode;     // Optional action button (e.g., "+ Add Issue")
  children: ReactNode;    // Section content
  className?: string;     // Optional additional classes
}
```

**Responsibilities:**
- Renders `.section` wrapper
- Renders `.section-header` with title, icon, and action slot
- Provides consistent spacing

**Usage:**
```tsx
<Section title="Current Issues" action={<button>+ Add Issue</button>}>
  <div className="issues-list">
    {issues.map(...)}
  </div>
</Section>
```

#### 2. `<Card>` Component
Base card component with flexible content slots.

**Props:**
```typescript
interface CardProps {
  variant?: 'default' | 'issue' | 'event' | 'maintenance' | 'contact' | 'link';
  editable?: boolean;
  actions?: ReactNode;     // Edit/complete/resolve buttons
  className?: string;
  children: ReactNode;
  onClick?: () => void;    // For clickable cards (links)
}
```

**Responsibilities:**
- Renders card wrapper with appropriate styling
- Provides action button slot (top-right for editable cards)
- Handles hover states and clickable behavior

**Usage:**
```tsx
<Card
  variant="issue"
  editable={isEditable}
  actions={<>
    <button className="btn-icon">✏️</button>
    <button className="btn-icon">✓</button>
  </>}
>
  {/* Card content */}
</Card>
```

## Component Mapping

| Current Component | Refactored To | Changes |
|-------------------|---------------|---------|
| IssueCard | `<Card variant="issue">` + content slots | Extract layout, keep logic |
| EventCard | `<Card variant="event">` + content slots | Extract layout, keep logic |
| MaintenanceCard | `<Card variant="maintenance">` + content slots | Extract layout, keep logic |
| ContactCard | `<Card variant="contact">` + content slots | Extract layout, keep static rendering |
| GarbageSchedule | `<Card variant="default">` (2 cards) | Extract card wrapper, keep grid |
| HelpfulLinks | `<Card variant="link">` + grid | Extract card wrapper, add onClick |
| (StatusPageClient sections) | `<Section>` wrappers | Wrap each content area |

## Card Field Configuration

### Issue Card
- **Header:** icon + category + location + status badge
- **Body:** detail text
- **Footer:** date + actions (edit/resolve)
- **States:** normal, investigating, resolved (opacity)

### Event Card
- **Header:** icon (by type) + datetime + recurring indicator
- **Body:** title + optional description
- **Actions:** inline right (edit/complete)

### Maintenance Card
- **Header:** date (human-readable)
- **Body:** description
- **Actions:** inline right (edit/complete)

### Contact Card
- **Layout:** Vertical stack
- **Fields:** label → phone (tel link) → hours
- **Static:** No edit mode

### Garbage Card
- **Layout:** Grid (2 cards)
- **Fields:** type + icon → days → optional time
- **Static:** No edit mode
- **Footer:** Optional notes below grid

### Link Card
- **Layout:** Clickable card
- **Fields:** icon + title
- **Behavior:** Opens in new tab
- **Static:** No edit mode

## Implementation Plan

### Phase 1: Foundation (Tasks 1-4)
1. ✅ Create refactor plan document
2. ⬜ Build debug page (`/debug/components`)
3. ⬜ Create `<Section>` component
4. ⬜ Create `<Card>` component with variants

### Phase 2: Refactor Editable Cards (Tasks 5-7)
5. ⬜ Refactor IssueCard to use `<Card>`
6. ⬜ Refactor EventCard to use `<Card>`
7. ⬜ Refactor MaintenanceCard to use `<Card>`

### Phase 3: Refactor Static Cards (Tasks 8-10)
8. ⬜ Refactor ContactCard to use `<Card>`
9. ⬜ Refactor GarbageSchedule to use `<Card>`
10. ⬜ Refactor HelpfulLinks to use `<Card>`

### Phase 4: Integration (Tasks 11-12)
11. ⬜ Update StatusPageClient to use `<Section>` wrappers
12. ⬜ Test all components on debug page

## Debug Page Specifications

**Route:** `/debug/components`
**Purpose:** Visualize all card components in various states

**Features:**
- Toggle between view/edit modes
- Show each card type with sample data
- Display multiple states (normal, resolved, etc.)
- Grid layout with component labels
- Dark mode toggle (future)

**Sections to Display:**
1. Section wrapper examples
2. Issue cards (reported, investigating, resolved)
3. Event cards (all-day, timed, recurring)
4. Maintenance cards
5. Contact cards (grid)
6. Garbage schedule
7. Helpful links (grid)

## CSS Considerations

### Existing Classes to Consolidate
- `.issue-item`, `.event-card`, `.maintenance-card`, `.contact-card` → `.card`
- `.issue-header`, `.event-icon` area → `.card-header`
- `.issue-detail`, `.event-description` → `.card-body`
- `.issue-meta` → `.card-footer`

### New Classes to Add
- `.card` (base)
- `.card-header`, `.card-body`, `.card-footer` (slots)
- `.card-actions` (action button container)
- `.card-variant-{type}` (variant-specific styles)

### Preserve Classes
- `.section`, `.section-header` (already consistent)
- `.btn-icon` (action buttons)
- Component-specific classes for unique styling

## Migration Strategy

**Approach:** Gradual, component-by-component

1. Create new components alongside existing ones
2. Test new components on debug page
3. Refactor one card type at a time
4. Keep old components until all are migrated
5. Remove old components and unused CSS

**Rollback Plan:**
- Branch allows easy revert
- Old components remain until migration complete
- No database or API changes required

## Success Criteria

- ✅ All cards use shared `<Card>` component
- ✅ All sections use shared `<Section>` component
- ✅ Debug page shows all component variations
- ✅ No visual regressions on main status page
- ✅ Reduced CSS duplication (measure LOC)
- ✅ Edit mode works identically to current behavior

## Files to Create

- `src/components/Section.tsx`
- `src/components/Card.tsx`
- `src/app/debug/components/page.tsx`
- `src/app/debug/components/page.module.css` (optional)

## Files to Modify

- `src/components/IssueCard.tsx`
- `src/components/EventCard.tsx`
- `src/components/MaintenanceCard.tsx`
- `src/components/ContactCard.tsx`
- `src/components/GarbageSchedule.tsx`
- `src/components/HelpfulLinks.tsx`
- `src/components/StatusPageClient.tsx`
- `src/app/globals.css` (consolidate card styles)

## Testing Checklist

**Visual Testing:**
- [ ] All cards render correctly on debug page
- [ ] Edit mode shows/hides actions appropriately
- [ ] Hover states work on clickable cards
- [ ] Responsive layout works on mobile

**Functional Testing:**
- [ ] Edit buttons open modals
- [ ] Complete/resolve buttons work
- [ ] Links open in new tabs
- [ ] Phone links work on mobile
- [ ] No console errors
- [ ] No TypeScript errors

**Regression Testing:**
- [ ] Main status page looks identical
- [ ] All interactions work as before
- [ ] Session/auth still works
- [ ] Data fetching unchanged

## Notes

- Keep existing Modal and Form components unchanged
- Preserve all edit/complete/resolve logic in card components
- Section component is purely presentational
- Card component provides structure, not business logic
- Component-specific date formatting/icons stay in their cards

## Questions for Review

- Should Card handle all action button logic, or keep in individual cards?
  - **Decision:** Keep action logic in individual cards, Card just provides slots
- Should we add more card variants or keep them minimal?
  - **Decision:** Start minimal (default), add variants only as needed
- Debug page: development only or include in production?
  - **Decision:** Development only, add to .env check or route guard
