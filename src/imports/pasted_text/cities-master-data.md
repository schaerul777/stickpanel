Build a "Cities" master data page for the StickPoint Admin Panel — a CRUD interface for managing city data with geographic coordinates and metadata.
Context: Cities master data provides the foundational geographic information used across the system. This data feeds into Geolocation Filters, campaign targeting, driver locations, and location-based analytics. Each city has precise coordinates (center point and bounding box) for map integration, plus metadata like abbreviations for efficient data display.
Navigation Structure:
Sidebar: Under existing "Master" parent menu
Master submenu items:
Geolocation Filter
Cities (active/highlighted when on this page) - icon: Building2 or MapPin
Position: Second item in Master submenu

CITIES LIST PAGE
Page Header:
Breadcrumb: Master / Cities
Title: "Cities" (large, bold)
Subtitle: "Manage city master data with geographic coordinates"
Top-right actions:
"Add City" button (primary blue, with + icon)

Filters & Search Bar:
Search Input:
Full-width search with magnifying glass icon
Placeholder: "Search by city name, abbreviation, or province..."
Debounced search (300ms delay)
Searches across: City Name, Abbreviation, Province
Filter Row:
Province Filter: Dropdown multi-select
Options: All / DKI Jakarta / Jawa Barat / Jawa Tengah / Jawa Timur / Banten / Sumatera Utara / etc.
Shows selected count badge if multiple selected
Country Filter: Dropdown (for future expansion)
Options: All / Indonesia (ID) / [Future countries]
Default: Shows only Indonesia
Coordinate Status Filter: Dropdown
Options: All / Complete Coordinates / Missing Center / Missing Boundaries / Incomplete
"Complete" = has all 6 coordinate values
"Missing Center" = missing Lat/Long
"Missing Boundaries" = missing Top Left or Bottom Right
"Incomplete" = missing any coordinate field
"Clear All Filters" link on right
Active Filters Display:
Shows applied filters as dismissible chips below search
Example: "Province: Jawa Barat ✕" | "Status: Complete Coordinates ✕"
Click X to remove individual filter

Main Data Table:
Table Columns:
UUID (optional, hidden by default, can be shown via column visibility toggle)


Auto-generated unique identifier
Format: "550e8400-e29b-41d4-a716-446655440000" (UUID v4)
Monospace font, small size (11px)
Truncated with "..." and copy icon on hover
Full UUID visible on hover tooltip
Copy icon copies full UUID to clipboard
Primarily for technical reference and API integration
City Name* (primary identifier)


Bold text, larger font (14px, font-weight 600)
Examples: "Jakarta Selatan", "Bandung", "Surabaya", "Semarang"
Clickable to open edit modal
Truncate with "..." if too long (>30 chars), full text on hover
Abbreviation


Small badge or monospace text
Examples: "JKT", "BDG", "SBY", "SMG"
Usually 2-4 characters
Uppercase
Shows "—" if not set
Helps with compact displays and data exports
Province


Text
Examples: "DKI Jakarta", "Jawa Barat", "Jawa Timur"
Country


Text with flag icon
Default: "🇮🇩 Indonesia (ID)"
Shows country code in gray: "ID"
Future-proof for international expansion
Center Coordinates


Shows Latitude, Longitude
Format: "-6.2088, 106.8456" (decimal degrees)
Monospace font
Copy icon on hover (copies coordinates)
Click to view on map (opens map modal with marker)
Shows "—" if not set
Top-Left Coordinates


Shows Latitude, Longitude
Format: "-6.2088, 106.8456" (decimal degrees)
Monospace font
Copy icon on hover (copies coordinates)
Click to view on map (opens map modal with marker)
Shows "—" if not set
Bottom-Right Coordinates


Shows Latitude, Longitude
Format: "-6.2088, 106.8456" (decimal degrees)
Monospace font
Copy icon on hover (copies coordinates)
Click to view on map (opens map modal with marker)
Shows "—" if not set
Created Date


Format: "Feb 25, 2025"
Gray text
Actions (dropdown three-dot menu OR inline buttons)

 Inline Buttons (Recommended):


"Edit" button (outline, small, pencil icon)
"View UUID" button (outline, small, eye icon)
"Delete" button (outline, small, red, trash icon)
Table Features:
Sortable columns: City Name (A-Z), Province, Abbreviation, Created Date, Coordinates Status
Default sort: City Name alphabetical (A-Z)
Hover state: Row highlights, shows inline action buttons
Row click: Opens edit modal
Selection banner: When rows selected:
"X cities selected"
Buttons: "Clear", "Export Selected", "Update Coordinates", "Delete"
Pagination: "Showing 1-25 of 247 cities", Previous/Next, page numbers
Rows per page: 25, 50, 100
Column visibility toggle: Show/hide UUID, Coordinates, Boundaries, etc.
Expandable rows (optional): Click expand icon to show full coordinate details inline
Table Visual Example:
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ City Name       │ Abbr │ Province    │ Country  │ Center Lat  │  Center Long  │ Top Left  │ Bottom Right  │Actions │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Jakarta Selatan │ JKTS │ DKI Jakarta │ 🇮🇩 ID  │ -6.2615 | 106.8106│ [Edit]  │
│ ☐ │ Bandung         │ BDG  │ Jawa Barat  │ 🇮🇩 ID  │ -6.9175 | 107.6191│ [Edit]  │
│ ☐ │ Surabaya        │ SBY  │ Jawa Timur  │ 🇮🇩 ID  │ -7.2575 | 112.7521│ [Edit]  │
└──────────────────────────────────────────────────────────────────────────────────────────┘


ADD/EDIT CITY MODAL
Modal Title:
"Add New City" (when creating)
"Edit City: [City Name]" (when editing)
Modal Width: 700px (wider to accommodate coordinate fields) Layout: Two-column form for coordinate fields, single-column for basic info

Form Structure:
Section 1: Basic Information
City Name* (required)
Text input, full width
Placeholder: "e.g., Jakarta Selatan, Bandung, Surabaya"
Validation: Required, min 2 characters, max 100 characters
Auto-capitalizes first letter of each word
Helper text: "Official city or municipality name"
Province* (required)
Searchable Dropdown
Options: All 38 Indonesian provinces
Format: "DKI Jakarta", "Jawa Barat", "Jawa Timur", etc.
Searchable/filterable as user types
Validation: Required, must select from list
Helper text: "Select the province for this city"
Country* (required, but pre-filled)
Dropdown with country selection
Default: Indonesia (ID) - pre-selected, disabled
Flag icon: 🇮🇩 Indonesia
Shows country code: "ID"
Future-proof: Can enable and add more countries later
Helper text: "Currently only Indonesia is supported"
Abbreviation (optional but recommended)
Text input, small width (80px)
Placeholder: "e.g., JKT, BDG, SBY"
Auto-converts to uppercase
Validation: 2-5 characters, alphanumeric only
Helper text: "Short code for compact displays (2-5 characters)"
Examples shown: Jakarta → JKT, Bandung → BDG, Surabaya → SBY
Center Latitude (Lat) (required)
Number input (decimal)
Placeholder: "e.g., -6.2088" (Jakarta example)
Format: Decimal degrees
Validation: -90 to 90
Precision: Up to 6 decimal places
Width: 150px
Center Longitude (Long) (required)
Number input (decimal)
Placeholder: "e.g., 106.8456" (Jakarta example)
Format: Decimal degrees
Validation: -180 to 180
Precision: Up to 6 decimal places
Width: 150px
Top Left Coordinate (required):
Latitude (number input, 150px)
Placeholder: "e.g., -6.1000"
Validation: -90 to 90
Longitude (number input, 150px)
Placeholder: "e.g., 106.7000"
Validation: -180 to 180
Bottom Right Coordinate (required):


Latitude (number input, 150px)
Placeholder: "e.g., -6.4000"
Validation: -90 to 90
Longitude (number input, 150px)
Placeholder: "e.g., 106.9000"
Validation: -180 to 180



Modal Footer:
Left side:
"Cancel" button (outline, gray)
Closes modal
Shows confirmation if there are unsaved changes
Right side:
"Save City" button (primary blue)
Creates new city OR updates existing
Loading state: "Saving..." with spinner
After save: Success toast + closes modal + refreshes table
Validation:
Required fields: City Name, Province, Country
City Name cannot be empty
Province must be selected from dropdown
Abbreviation: if provided, must be 2-5 characters
Coordinates: if provided, must be valid decimal numbers within range
Bounding box: if provided, all 4 values required (can't have partial bounds)
Shows validation errors in red below fields
Cannot submit until required fields valid
Duplicate Check:
Warns if city name already exists in same province.

VIEW UUID MODAL
Triggered by: Clicking "View UUID" action in table OR UUID field in edit form
Modal Title: "City UUID Details" Width: 500px
Content:
City Information Card:
City Name (large, bold)
Province, Country
Status: Active
UUID Display:
Large monospace text: "550e8400-e29b-41d4-a716-446655440000"
Copy button (copies to clipboard)
QR code (optional, for mobile scanning)
Actions:
"Copy UUID" button (primary)
"Close" button

DELETE CONFIRMATION MODAL
Modal Title: "Delete City?" Width: 500px
Content:
Warning Icon: Red triangle with exclamation
Message:
"Are you sure you want to delete this city?"
City Details:
City Name: Bandung
Province: Jawa Barat
UUID: 550e8400-e29b-41d4-a716-446655440000
Impact Warning:
If city is referenced in Geolocation Filters:
"⚠ Warning: This city is used in X geolocation filter(s)."
"Deleting this city will affect these filters. They will need to select a different city."
Shows list of affected filters (first 5, then "and X more")
If city is NOT referenced:
"This city is not currently used in any geolocation filters."
Checkbox:
"I understand this action cannot be undone and may affect existing filters"
Must check to enable delete button
Footer:
"Cancel" button (outline)
"Delete City" button (red, disabled until checkbox checked)
After delete: Success toast + removes from table

EMPTY STATES
No Cities:
Icon: Building2 with plus sign
Text: "No cities in database yet"
Subtext: "Add your first city to start building your location database"
"Add City" button (primary, large)
No Search Results:
Icon: Search with X
Text: "No cities found"
Subtext: "Try adjusting your search or filters"
"Clear Search" button
No Coordinates Set:
In table: Shows "—" or gray icon
Tooltip: "No coordinates set. Click Edit to add location data."

DESIGN SPECIFICATIONS
Color Scheme:
Same as admin panel (Geist font, shadcn/ui)
Coordinate status colors:
Complete: Green (#10B981)
Partial: Amber (#F59E0B)
Missing: Gray (#6B7280)
UUID display: Monospace font (Geist Mono), gray color
Map markers: Blue for center, Purple outline for bounds
Typography:
Font: Geist for UI, Geist Mono for UUIDs and coordinates
City names: 14px, font-weight 600
Coordinates: 12px, font-mono, tabular numbers
UUID: 11px, font-mono, gray color
Icons:
Lucide icons: Building2, MapPin, Map, Globe, Copy, Eye, Trash, Edit, Download, Upload, Check, X
Flag emoji: 🇮🇩 for Indonesia
Coordinate icons: 📍 (center), 🗺️ (bounds)
Components:
shadcn/ui: Button, Input, Label, Badge, Card, Table, Dialog, Select, Checkbox, Textarea
Map component: Google Maps API or Leaflet React
Number input: Custom component with decimal validation
UUID display: Copyable text with click-to-copy
Form Layout:
Basic info: Full width fields
Coordinates: 2-column grid (Lat/Long pairs)
Visual alignment: Labels top-aligned, fields aligned horizontally
Helper text: 12px, gray, below each field group
Validation:
Real-time validation on blur
Coordinate range validation
Required field highlighting
Error messages in red below fields
Success checkmarks on valid fields (optional)
Responsive:
Desktop-first (master data typically desktop)
Coordinate fields stack vertically on mobile
Map modals become full-screen on mobile
Table horizontally scrollable on mobile

INTERACTIONS
UUID Actions:
Click "View UUID" → Opens UUID details modal
Hover UUID (in table) → Shows full UUID in tooltip
Click copy icon → Copies UUID to clipboard + shows toast "UUID copied"
Table:
Click row → Opens edit modal
Click UUID column (if visible) → Opens UUID modal
Hover coordinates → Shows copy icon
Click status icon → Shows tooltip with details

