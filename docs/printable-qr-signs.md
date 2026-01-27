# Printable QR Code Signs - Feature Plan

## Overview

Enable building managers to generate and print QR code signs for various locations (units, common areas, etc.) with flexible formatting options for different use cases.

**Status**: Planning
**Branch**: `feature/printable-qr-signs`
**Target**: v1.2

---

## Use Cases

### 1. Unit-Specific QR Codes (Private)

**Actor**: Building Manager
**Goal**: Generate unique QR codes for each unit to enable issue tracking and adoption monitoring

**Flow**:
1. Manager navigates to QR Code Manager
2. Selects "Generate Unit Codes" option
3. Chooses format: Fridge magnet (4x6), Door hanger (8.5x11), Label (2x3)
4. System generates 40 unique QR codes (one per unit)
5. Manager prints all or selected codes
6. Distributes to unit mailboxes

**QR Code Payload**:
```
https://[domain]/[property-hash]?unit=4A&utm_source=unit_qr&utm_medium=print&utm_campaign=rollout
```

**Benefits**:
- **Auto-tagging**: Issues reported from unit codes automatically include unit number
- **Adoption tracking**: Know which units are using the system
- **Privacy**: Residents can report issues without manually entering unit
- **Convenience**: One-scan access from home

**Resident Experience**:
1. Scans QR code on fridge/door
2. Lands on status page with unit pre-filled in forms
3. Clicks "Report issue" → Unit field auto-populated
4. Submits → Manager knows it's from 4A

### 2. Public/Common Area QR Codes

**Actor**: Building Manager
**Goal**: Post QR codes in laundry room, lobby for general access

**Flow**:
1. Manager generates "Public" QR code
2. Labels it: "Laundry Room Sign"
3. Chooses format: Full page poster (8.5x11), Half page (5.5x8.5)
4. Prints and posts in location

**QR Code Payload**:
```
https://[domain]/[property-hash]?location=laundry&utm_source=public_qr&utm_medium=print&utm_campaign=laundry_room
```

**Resident Experience**:
1. Scans code in laundry room
2. Sees current status (especially laundry machines)
3. Can report issue (must manually enter unit)
4. Optionally: Subscribe to notifications → asked to verify identity (unit number)

### 3. Welcome Packet Cards

**Actor**: Building Manager
**Goal**: Include professional QR code card in new resident welcome packet

**Flow**:
1. Manager generates "Welcome Card" format
2. Selects: Business card (3.5x2), Postcard (4x6), or Full sheet
3. Includes welcome message + QR code
4. Prints batch for next 5 move-ins

**QR Code Payload**: (same as unit-specific, or generic property code)

**Card Content**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    LINDEN HEIGHTS
    Building Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[QR CODE]

Scan to:
✓ Check building systems
✓ Report issues
✓ View events
✓ Emergency contacts

Or visit:
status.lindenheights.com

Welcome to the building!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Feature Requirements

### Data Model

#### QR Code Types

**Unit Code** (1:1 with units)
```typescript
{
  id: number;
  propertyId: number;
  type: 'unit';
  label: 'Unit 4A';
  unitNumber: '4A';
  qrCodeUrl: string; // Pre-generated QR code data URL
  createdAt: Date;
  printedAt: Date | null; // Track when distributed
  lastScanned: Date | null; // Track usage
  scanCount: number; // Adoption metric
}
```

**Location Code** (public areas)
```typescript
{
  id: number;
  propertyId: number;
  type: 'location';
  label: 'Laundry Room';
  location: 'laundry';
  qrCodeUrl: string;
  createdAt: Date;
  scanCount: number;
}
```

**Generic Property Code**
```typescript
{
  id: number;
  propertyId: number;
  type: 'property';
  label: 'General Access';
  qrCodeUrl: string;
  createdAt: Date;
}
```

#### Schema Changes

Add `qr_codes` table:
```sql
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'unit', 'location', 'property'
  label VARCHAR(100) NOT NULL,
  unit_number VARCHAR(10), -- Only for unit type
  location VARCHAR(50), -- Only for location type
  qr_code_url TEXT NOT NULL, -- Data URL of QR image
  target_url TEXT NOT NULL, -- URL the QR code points to
  created_at TIMESTAMP DEFAULT NOW(),
  printed_at TIMESTAMP,
  last_scanned_at TIMESTAMP,
  scan_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Indexes
  INDEX idx_qr_property_type (property_id, type),
  INDEX idx_qr_unit (property_id, unit_number),
  INDEX idx_qr_location (property_id, location)
);
```

### URL Structure & Tracking

**Unit-Specific QR Code**:
```
https://[domain]/[property-hash]?unit=4A&source=qr_unit&qr_id=123
```

**Public/Location QR Code**:
```
https://[domain]/[property-hash]?location=laundry&source=qr_public&qr_id=124
```

**On Scan**:
1. Page loads with query params
2. Increment `qr_codes.scan_count` via API call
3. Update `qr_codes.last_scanned_at`
4. Store unit/location context in component state
5. Pre-fill forms with unit number (if applicable)

**Analytics**:
- Track via `qr_id` parameter
- Google Analytics event: `qr_scan` with properties `{qr_type, unit, location}`

---

## UI Design

### Manager Interface

#### QR Code Manager (Enhanced)

**New Tabs**:
1. **Access Codes** (existing - resident access tokens)
2. **Unit Signs** (new - unit-specific QR codes)
3. **Public Signs** (new - location QR codes)

**Unit Signs Tab**:

```
┌─────────────────────────────────────────────────┐
│ Unit Signs                                      │
├─────────────────────────────────────────────────┤
│ Generate QR codes for individual units          │
│                                                  │
│ [Generate All Units] [Bulk Print View]          │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Unit 4A          Created: 1/20/2025         │ │
│ │ [QR Preview]     Scans: 12                  │ │
│ │                  Last: 2 hours ago          │ │
│ │ [View] [Print] [Regenerate]                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Unit 4B          Created: 1/20/2025         │ │
│ │ [QR Preview]     Scans: 0                   │ │
│ │                  Never scanned              │ │
│ │ [View] [Print] [Regenerate]                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Public Signs Tab**:

```
┌─────────────────────────────────────────────────┐
│ Public Signs                                    │
├─────────────────────────────────────────────────┤
│ QR codes for common areas and public posting    │
│                                                  │
│ [+ Add Public Sign]                              │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🧺 Laundry Room  Scans: 45                  │ │
│ │ [QR Preview]     Last: 10 min ago           │ │
│ │                  Created: 1/15/2025         │ │
│ │ [View] [Print] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🏢 Lobby         Scans: 23                  │ │
│ │ [QR Preview]     Last: 1 hour ago           │ │
│ │                  Created: 1/15/2025         │ │
│ │ [View] [Print] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### Print Dialog/Modal

**Format Selection**:

```
┌─────────────────────────────────────────────────┐
│ Print QR Code Sign                               │
├─────────────────────────────────────────────────┤
│                                                  │
│ Sign for: Unit 4A                                │
│                                                  │
│ Format:                                          │
│ ○ Full Page (8.5" × 11")          [Preview]     │
│ ○ Half Page (5.5" × 8.5")         [Preview]     │
│ ○ Postcard (6" × 4")               [Preview]     │
│ ○ Business Card (3.5" × 2")        [Preview]     │
│ ○ Label - 2" × 3" (Avery 5160)     [Preview]     │
│ ○ Thermal Sticker (2.25" × 1.25")  [Preview]     │
│                                                  │
│ Include:                                         │
│ ☑ Building name                                  │
│ ☑ Unit number (if applicable)                    │
│ ☑ Instructions text                              │
│ ☑ Contact info                                   │
│ ☐ Property address                               │
│                                                  │
│ [Cancel]                    [Print Preview]       │
└─────────────────────────────────────────────────┘
```

### Print Layouts

#### Full Page Sign (8.5" × 11")

**Orientation**: Portrait
**Use Case**: Post in common area, tape to fridge

```
┌───────────────────────────────────┐
│                                   │
│        LINDEN HEIGHTS             │
│      Building Status Page         │
│                                   │
│       ┌─────────────────┐         │
│       │                 │         │
│       │   [QR CODE]     │         │
│       │   (3" × 3")     │         │
│       │                 │         │
│       └─────────────────┘         │
│                                   │
│      Scan to check:               │
│      • Building systems           │
│      • Current issues             │
│      • Upcoming events            │
│      • Report problems            │
│                                   │
│      Or visit:                    │
│   status.lindenheights.com        │
│                                   │
│      Unit 4A                      │
│                                   │
│   Questions? Call 555-123-4567    │
│                                   │
└───────────────────────────────────┘
```

#### Postcard (6" × 4")

**Orientation**: Landscape
**Use Case**: Welcome packet, mailbox insert

```
┌─────────────────────────────────────────┐
│ LINDEN HEIGHTS     ┌──────────┐         │
│ Building Status    │          │         │
│                    │ QR CODE  │  Scan   │
│ Check systems,     │ (2"×2")  │  for    │
│ report issues,     │          │  quick  │
│ view events        └──────────┘  access │
│                                          │
│ status.lindenheights.com                 │
│ Unit 4A                                  │
└─────────────────────────────────────────┘
```

#### Label (2" × 3") - Avery 5160

**Orientation**: Landscape
**Use Case**: Stick on bulletin board, fridge

```
┌───────────────────────┐
│ LINDEN   ┌─────┐      │
│ STATUS   │ QR  │ 4A   │
│          └─────┘      │
│  status.linden.com    │
└───────────────────────┘
```

#### Thermal Sticker (2.25" × 1.25")

**Orientation**: Landscape
**Use Case**: Thermal label printer

```
┌──────────────────────┐
│ BLDG  ┌────┐   Unit  │
│ STATUS│ QR │    4A   │
│       └────┘         │
└──────────────────────┘
```

---

## Technical Implementation

### Phase 1: Data & API

**Migration**: `0005_add_qr_codes_table.sql`
```sql
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('unit', 'location', 'property')),
  label VARCHAR(100) NOT NULL,
  unit_number VARCHAR(10),
  location VARCHAR(50),
  qr_code_data_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  printed_at TIMESTAMP,
  last_scanned_at TIMESTAMP,
  scan_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

CREATE INDEX idx_qr_property_type ON qr_codes(property_id, type);
CREATE INDEX idx_qr_unit ON qr_codes(property_id, unit_number) WHERE unit_number IS NOT NULL;
CREATE INDEX idx_qr_location ON qr_codes(property_id, location) WHERE location IS NOT NULL;
```

**New API Endpoints**:

1. `POST /api/admin/qr-codes/generate-units`
   - Generate QR codes for all units in property
   - Input: `{ propertyId, unitNumbers[] }`
   - Output: `{ qrCodes: QRCode[] }`

2. `POST /api/admin/qr-codes/generate-location`
   - Generate QR code for specific location
   - Input: `{ propertyId, label, location }`
   - Output: `{ qrCode: QRCode }`

3. `GET /api/admin/qr-codes`
   - List all QR codes for property
   - Query: `?propertyId=1&type=unit`
   - Output: `{ qrCodes: QRCode[] }`

4. `POST /api/qr-codes/:id/scan`
   - Track QR code scan (no auth required)
   - Increments scan_count, updates last_scanned_at
   - Output: `{ success: true }`

5. `DELETE /api/admin/qr-codes/:id`
   - Deactivate QR code
   - Sets is_active = false

**QR Code Generation** (`src/lib/qr-code-signs.ts`):
```typescript
import QRCode from 'qrcode';

export async function generateUnitQRCode(
  propertyId: number,
  propertyHash: string,
  unitNumber: string,
  baseUrl: string
): Promise<string> {
  // Build target URL with tracking params
  const targetUrl = `${baseUrl}/${propertyHash}?unit=${encodeURIComponent(unitNumber)}&source=qr_unit`;

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H', // High error correction for print quality
  });

  return qrDataUrl;
}

export async function generateLocationQRCode(
  propertyHash: string,
  location: string,
  baseUrl: string
): Promise<string> {
  const targetUrl = `${baseUrl}/${propertyHash}?location=${encodeURIComponent(location)}&source=qr_public`;

  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  return qrDataUrl;
}
```

### Phase 2: Manager UI

**New Component**: `src/components/QRCodeSignsManager.tsx`

**Features**:
- Three tabs: Access Codes | Unit Signs | Public Signs
- Bulk generation UI
- Individual QR preview and regeneration
- Scan statistics display
- Print dialog with format selection

**Component Structure**:
```typescript
interface QRCodeSignsManagerProps {
  propertyId: number;
  propertyHash: string;
  propertyName: string;
  sessionToken: string;
  onClose: () => void;
}

export function QRCodeSignsManager(props: QRCodeSignsManagerProps) {
  const [activeTab, setActiveTab] = useState<'access' | 'units' | 'public'>('access');
  const [unitQRCodes, setUnitQRCodes] = useState<QRCode[]>([]);
  const [publicQRCodes, setPublicQRCodes] = useState<QRCode[]>([]);
  const [selectedForPrint, setSelectedForPrint] = useState<QRCode | null>(null);

  // ... implementation
}
```

### Phase 3: Print Views

**New Route**: `src/app/print/qr-sign/[id]/page.tsx`

**Print-Specific Page**:
- Server-side rendering for reliable printing
- No page chrome (header, footer)
- Print CSS media query optimizations
- Multiple layout components based on format

**Print Stylesheet** (`src/app/print/qr-sign/print.css`):
```css
@media print {
  @page {
    margin: 0;
    size: letter portrait; /* or landscape, A4, etc. */
  }

  body {
    margin: 0;
    padding: 0;
  }

  .no-print {
    display: none !important;
  }

  .page-break {
    page-break-after: always;
  }
}

/* Full page layout */
.qr-sign-full-page {
  width: 8.5in;
  height: 11in;
  padding: 1in;
  text-align: center;
  font-family: 'DM Sans', sans-serif;
}

.qr-sign-full-page .qr-code {
  width: 3in;
  height: 3in;
  margin: 1in auto;
}

/* Postcard layout */
.qr-sign-postcard {
  width: 6in;
  height: 4in;
  padding: 0.5in;
  display: flex;
  align-items: center;
  gap: 0.5in;
}

.qr-sign-postcard .qr-code {
  width: 2in;
  height: 2in;
}

/* Label layout (Avery 5160: 10 per sheet, 3 columns, 1" × 2.625") */
.qr-sign-label-sheet {
  width: 8.5in;
  height: 11in;
  display: grid;
  grid-template-columns: repeat(3, 2.625in);
  grid-template-rows: repeat(10, 1in);
  gap: 0;
}

.qr-sign-label {
  width: 2.625in;
  height: 1in;
  padding: 0.1in;
  text-align: center;
  font-size: 8pt;
}

.qr-sign-label .qr-code {
  width: 0.75in;
  height: 0.75in;
}
```

**Layout Components**:
```
src/components/print/
  ├── FullPageSign.tsx
  ├── HalfPageSign.tsx
  ├── PostcardSign.tsx
  ├── BusinessCardSign.tsx
  ├── LabelSign.tsx
  └── ThermalSign.tsx
```

### Phase 4: Scan Tracking

**Client-Side Tracking** (`src/app/[hash]/page.tsx`):

```typescript
export default async function PropertyPage({ params, searchParams }: PropertyPageProps) {
  const { unit, location, source, qr_id } = searchParams;

  // ... existing code

  // Track QR scan if from QR code
  if (qr_id && source?.startsWith('qr_')) {
    await trackQRScan(parseInt(qr_id));
  }

  return (
    <StatusPageClient
      data={data}
      siteUrl={siteUrl}
      formattedDate={formattedDate}
      propertyId={property.id}
      propertyHash={params.hash}
      propertyName={property.name}
      requireAuthForContacts={property.requireAuthForContacts}
      // New props for QR context
      unitContext={unit}
      locationContext={location}
    />
  );
}

async function trackQRScan(qrCodeId: number) {
  try {
    await fetch(`/api/qr-codes/${qrCodeId}/scan`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Failed to track QR scan:', error);
    // Non-critical, don't block page load
  }
}
```

**Auto-Fill Forms** (`src/components/IssueForm.tsx`):

```typescript
interface IssueFormProps {
  // ... existing props
  unitContext?: string; // From QR code scan
}

export function IssueForm({ unitContext, ...props }: IssueFormProps) {
  const [selectedUnit, setSelectedUnit] = useState(unitContext || '');

  // If unitContext provided, pre-select and lock the field
  const isUnitLocked = !!unitContext;

  return (
    // ... form
    <select
      value={selectedUnit}
      onChange={(e) => !isUnitLocked && setSelectedUnit(e.target.value)}
      disabled={isUnitLocked}
    >
      {/* options */}
    </select>
  );
}
```

---

## Bulk Operations

### Generate All Unit QR Codes

**Flow**:
1. Manager clicks "Generate All Units"
2. System fetches building configuration (units per building)
3. For each unit (4A, 4B, ... 1J):
   - Generate unique QR code URL
   - Create QR code image
   - Save to database
4. Show success: "Generated 40 QR codes"

**Performance**:
- Generate in batches of 10 to avoid timeout
- Show progress: "Generating... 20/40 complete"
- Use queue/background job for large properties

### Bulk Print View

**Route**: `/print/qr-signs/bulk?propertyId=1&type=unit&format=label`

**Features**:
- All unit QR codes on one print-friendly page
- Multiple formats:
  - **Label Sheet**: 30 labels per page (Avery 5160)
  - **Business Cards**: 10 per page
  - **Postcards**: 2 per page
- Page breaks between sheets
- Print dialog appears automatically

**Label Sheet Example**:
```
Page 1:
[ 4A ] [ 4B ] [ 4C ]
[ 4D ] [ 4E ] [ 4F ]
[ 4G ] [ 4H ] [ 4I ]
...
[ 3A ] [ 3B ] [ 3C ]

Page 2:
[ 2D ] [ 2E ] ...
```

---

## Analytics & Reporting

### Manager Dashboard Metrics

**QR Code Adoption**:
```
┌────────────────────────────────────┐
│ QR Code Usage (Last 30 Days)      │
├────────────────────────────────────┤
│ Total Scans: 156                   │
│ Unique Units Scanned: 18/40 (45%) │
│ Public Signs Scanned: 67           │
│                                    │
│ Most Active:                       │
│ 1. Unit 4A - 12 scans              │
│ 2. Unit 2B - 9 scans               │
│ 3. Laundry Room - 45 scans         │
│                                    │
│ Never Scanned: 22 units            │
│ [View Details]                     │
└────────────────────────────────────┘
```

**CSV Export**: `GET /api/admin/qr-codes/export?propertyId=1`

```csv
Type,Label,Unit,Location,Scans,Last Scanned,Created
unit,Unit 4A,4A,,12,2025-01-25 14:30,2025-01-20
unit,Unit 4B,4B,,9,2025-01-25 09:15,2025-01-20
location,Laundry Room,,laundry,45,2025-01-25 16:45,2025-01-15
```

---

## User Experience Flows

### Manager: Generate Unit QR Codes

1. Navigate to QR Code Manager
2. Click "Unit Signs" tab
3. Click "Generate All Units"
4. System generates 40 codes (progress bar shown)
5. Success message: "Generated 40 unit QR codes"
6. Codes appear in list with preview thumbnails

### Manager: Print Single Unit Sign

1. In Unit Signs tab, find "Unit 4A"
2. Click "Print" button
3. Print dialog opens
4. Select format: "Full Page (8.5" × 11")"
5. Check options: ☑ Building name, ☑ Unit number, ☑ Instructions
6. Click "Print Preview"
7. New tab opens with print-friendly page
8. Browser print dialog appears (Cmd+P)
9. Print to printer or save as PDF

### Manager: Bulk Print All Units as Labels

1. Click "Bulk Print View" button
2. Select format: "Label Sheet (Avery 5160)"
3. New window opens with 4 pages of labels (10 per page, 40 total)
4. Click Print (browser dialog)
5. Load label sheets in printer
6. Print all 4 pages
7. Cut/peel labels and distribute to mailboxes

### Resident: Scan Unit QR at Home

1. Sees QR code on fridge
2. Opens camera app, scans code
3. Browser opens: `status.lindenheights.com/abc123?unit=4A&source=qr_unit`
4. Page loads with status
5. Clicks "Report issue"
6. Issue form opens with Unit field pre-filled: "4A" (grayed out)
7. Selects category, adds description
8. Submits
9. Manager receives email: "Issue reported from Unit 4A via QR code"

### Resident: Scan Public QR in Laundry Room

1. Sees poster in laundry room
2. Scans QR code
3. Page loads: `...?location=laundry&source=qr_public`
4. Sees laundry machines status highlighted
5. Clicks "Report issue"
6. Form opens with Location: "Laundry Room" pre-selected
7. Must manually enter unit number
8. Submits issue

---

## Edge Cases & Considerations

### 1. Duplicate QR Codes

**Problem**: Manager generates codes twice, creates duplicates

**Solution**:
- Check if QR code exists for unit before generating
- Show warning: "QR code for Unit 4A already exists. Regenerate?"
- "Regenerate" creates new URL with new tracking ID

### 2. Lost QR Codes

**Problem**: Resident loses printed QR code

**Solution**:
- QR codes remain in database even if printed copy is lost
- Manager can re-print anytime
- Track print history: "Last printed: 1/20/2025"

### 3. QR Code Expiration

**Question**: Should QR codes expire?

**Answer**: No for unit codes, optional for public
- Unit codes: Permanent (tied to physical unit)
- Public codes: Can be deactivated if sign is removed
- Access tokens (existing): 90-day expiration

### 4. Privacy Concerns

**Problem**: Unit number in URL could be intercepted

**Mitigation**:
- HTTPS only (encrypted in transit)
- Unit number doesn't reveal resident identity
- Only manager sees who scanned what
- Residents can always report anonymously by not using unit QR

### 5. High-Traffic Public Codes

**Problem**: Laundry room QR code gets 1000+ scans per month

**Solution**:
- Database handles high volume (simple counter increment)
- Consider caching for analytics
- Rate limiting on scan tracking endpoint (max 1 per minute per IP)

### 6. Multi-Building Properties

**Problem**: Units named identically across buildings (e.g., 712-4A vs 706-4A)

**Solution**:
- Unit format includes building: "712-4A"
- QR code label: "Building 712, Unit 4A"
- URL param: `?building=712&unit=4A`

### 7. Print Quality Issues

**Problem**: QR code doesn't scan if printed poorly

**Solution**:
- High error correction level (H = 30% damage tolerance)
- Minimum QR code size: 1" × 1" for print
- Provide print guidelines: "Use quality printer, avoid inkjet if smudged"
- Test scan before distributing

---

## Implementation Checklist

### Phase 1: Core Functionality
- [ ] Database migration: `qr_codes` table
- [ ] QR code generation library setup (qrcode npm package)
- [ ] API: Generate unit QR codes
- [ ] API: Generate location QR codes
- [ ] API: List QR codes
- [ ] API: Track QR scan
- [ ] Scan tracking on page load

### Phase 2: Manager UI
- [ ] QR Code Signs Manager component
- [ ] Unit Signs tab with list view
- [ ] Public Signs tab with list view
- [ ] Generate All Units button + flow
- [ ] Add Public Sign form
- [ ] QR code preview thumbnails
- [ ] Scan statistics display

### Phase 3: Print Layouts
- [ ] Print route: `/print/qr-sign/[id]/page.tsx`
- [ ] Full Page layout component
- [ ] Half Page layout component
- [ ] Postcard layout component
- [ ] Business Card layout component
- [ ] Label (Avery 5160) layout component
- [ ] Thermal Sticker layout component
- [ ] Print CSS optimization
- [ ] Print dialog/modal

### Phase 4: Bulk Operations
- [ ] Bulk print view route
- [ ] Label sheet generator (30 per page)
- [ ] Business card sheet (10 per page)
- [ ] Postcard sheet (2 per page)
- [ ] Progress indicator for bulk generation

### Phase 5: Context & Auto-Fill
- [ ] Parse `unit` param from URL
- [ ] Parse `location` param from URL
- [ ] Pass context to StatusPageClient
- [ ] Auto-fill unit in IssueForm
- [ ] Lock pre-filled fields
- [ ] Show context indicator ("Viewing as Unit 4A")

### Phase 6: Analytics
- [ ] Manager dashboard QR metrics widget
- [ ] Most/least used QR codes
- [ ] CSV export endpoint
- [ ] Adoption percentage calculation

### Phase 7: Testing & Polish
- [ ] Test all print layouts (physical print)
- [ ] Test QR scanning with multiple devices
- [ ] Test bulk generation (40+ codes)
- [ ] Test scan tracking accuracy
- [ ] Mobile-friendly print preview
- [ ] Error handling (generation fails, print fails)
- [ ] Loading states for bulk operations

---

## Open Questions

1. **Building configuration**: Where do we get unit lists? Hardcoded? Database table?
   - Current: Hardcoded in `seed.ts` buildings object
   - Proposal: Add `units` table or pull from `buildings` config

2. **QR code regeneration**: When should we allow regenerating?
   - Lost/damaged physical code
   - Security concern (URL leaked)
   - Tracking ID needs reset

3. **Print formats priority**: Which formats to implement first?
   - Proposal: Full Page → Label → Postcard → Others

4. **Thermal printer support**: What specific models?
   - Research: Dymo, Brother, Zebra compatibility
   - Standard: 2.25" × 1.25" labels

5. **Unit verification**: Should we verify unit ownership before showing pre-filled forms?
   - Current: No verification (trust QR code source)
   - Future: Optional PIN/verification step

6. **Public sign notifications**: Allow residents to subscribe to specific locations?
   - Example: "Notify me of laundry room issues"
   - Requires: Email/phone collection, verification flow

---

## Future Enhancements

### v1.3: Advanced Features
- **Custom branding**: Upload logo for QR signs
- **Multi-language**: Print signs in Spanish, Chinese, etc.
- **QR analytics dashboard**: Detailed charts, heatmaps
- **Notification subscriptions**: From public QR codes
- **Smart routing**: Public QR directs to relevant section (laundry → machines status)

### v1.4: Integration
- **Email distribution**: Auto-email QR codes to residents
- **SMS delivery**: Text QR code link to residents
- **Property management integration**: Import unit lists from Yardi, AppFolio, etc.
- **Third-party printing**: Integrate with VistaPrint, MOO for professional cards

---

## Success Metrics (90-Day Post-Launch)

**Adoption**:
- 70%+ of units have scanned their QR code
- 50%+ of issue reports come via QR code scan
- Public QR codes scanned 100+ times per month

**Satisfaction**:
- Manager: "QR codes save me 5 hours/month in follow-up calls"
- Residents: "QR code on my fridge makes reporting so easy"

**Efficiency**:
- 80% of issues include unit number (vs. 30% before)
- Response time improved by 20% (faster unit identification)

---

*Last Updated: January 26, 2025*
