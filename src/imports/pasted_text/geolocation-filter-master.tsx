Build a "Geolocation Filter" master data page for the StickPoint Admin Panel — a CRUD interface for managing geographical targeting filters used in campaigns.
Context: Geolocation Filters are master data that define specific geographic areas (City, District, Province) for campaign targeting. When creating campaigns, users can select pre-configured location filters to target drivers in specific regions. This ensures consistent geographical data across the system and simplifies campaign location selection.
Navigation Structure:
Sidebar: Add new parent menu item "Master" (between "Sales" and "Account")
Icon: Database or Layers (from Lucide icons)
Master submenu items (expandable/collapsible):
Geolocation Filter (active/highlighted) - icon: MapPin or Map
Cities (future/placeholder) - icon: Building2
Expanded state shows indented submenu:
Master [ChevronDown]  → Geolocation Filter (highlighted if active)  → Cities
Collapsed state shows only "Master" with ChevronRight
Click "Master" label toggles expand/collapse
Active submenu item has primary blue background or left border indicator

GEOLOCATION FILTER LIST PAGE
Page Header:
Breadcrumb: Master / Geolocation Filter
Title: "Geolocation Filter" (large, bold)
Subtitle: "Manage geographic targeting filters for campaigns"
Top-right actions:
"Add Filter" button (primary blue, with + icon)

Filters & Search Bar:
Search Input:
Full-width search with magnifying glass icon
Placeholder: "Search by city name, district, or province..."
Debounced search (300ms delay)
Searches across all columns (City Name, District, City, Province)
Filter Row:
Province Filter: Dropdown multi-select
Options: All / DKI Jakarta / Jawa Barat / Jawa Tengah / Jawa Timur / Banten / Sumatera Utara / etc.
Shows selected count badge if filtered
City Filter: Dropdown multi-select (depends on Province selection)
Options: All / Jakarta / Bandung / Surabaya / Semarang / Medan / etc.
Cascading: filters based on selected provinces
District Filter: Dropdown (optional, for more granular filtering)
Options loaded dynamically based on City selection
"Clear All Filters" link on right
Quick Tabs (optional alternative to dropdowns):
All (count badge)
Jakarta Region (count)
Bandung Region (count)
Surabaya Region (count)
Other Regions (count)
Active Filters Display:
Shows applied filters as dismissible chips below search
Example: "Province: DKI Jakarta ✕" | "City: Jakarta Selatan ✕"
Click X to remove individual filter

Main Data Table:
Table Columns:
ID (optional, for reference)
Auto-increment number or UUID
Format: "GEO-001", "GEO-002", etc.
Monospace font, gray color
Helps with debugging and references
City Name* (primary identifier)
Bold text, larger font (14px)
This is the filter name/label users see when selecting
Examples:
"Jakarta Selatan"
"Bandung"
"Surabaya"
Clickable to open edit modal
Truncate with "..." if too long, full text on hover
District
Text, normal weight
Examples: "Kebayoran Baru", "Dago", "Gubeng", "Kelapa Gading"
City
Text with city icon
Examples: "Jakarta Selatan", "Bandung", "Surabaya"
Can be parent city or specific area
Province
Badge or text
Examples: "DKI Jakarta", "Jawa Barat", "Jawa Timur"
Created Date
Format: "Feb 25, 2025"
Gray text
Shows relative time on hover: "5 days ago"
Actions (dropdown three-dot menu)
"Edit" (opens edit modal)
Divider
"Delete" (red, with confirmation if used in campaigns)
Table Features:
Sortable columns: City Name (alphabetical), District, City, Province, Created Date
Default sort: City Name alphabetical (A-Z)
Hover state: Row highlights on hover
Row click: Opens edit modal (or detail view if complex)
Selection banner: When rows selected:
"X filters selected"
Buttons: "Clear", "Delete Selected"
Pagination: "Showing 1-25 of 143 filters", Previous/Next, page numbers
Rows per page: 25, 50, 100
Empty row state: Shows "—" for optional fields
Column visibility toggle: Show/hide columns via dropdown button
Table Visual Example:
┌────────────────────────────────────────────────────────────────────────────┐
│ City Name                      │ District       │ City     │ Province │
├────────────────────────────────────────────────────────────────────────────┤
│ Jakarta Selatan    │ Kebayoran Baru │ Jakarta  │ DKI      │
│ Bandung                │ Dago           │ Bandung  │ Jabar    │
│ Surabaya              │ Gubeng         │ Surabaya │ Jatim    │
└────────────────────────────────────────────────────────────────────────────┘


ADD/EDIT GEOLOCATION FILTER MODAL
Modal Title:
"Add New Geolocation Filter" (when creating)
"Edit Geolocation Filter: [City Name]" (when editing)
Modal Width: 600px Layout: Single-column form

Form Fields:
Section 1: Location Selection (Primary)
City Name* (required)


Searchable Dropdown (Combobox)
Data Source: Master City table (another master data)
Display Format in Dropdown:
 Jakarta SelatanJakarta PusatJakarta UtaraJakarta BaratJakarta TimurBandungSurabayaSemarangMedan...


Features:
Real-time search/filter as user types
Shows matching results highlighted
Keyboard navigation (arrow keys, Enter to select)
Shows "No results found" if search returns empty
Optional: "Add New City" button at bottom of dropdown
Opens quick-create modal for Master City
After creating, auto-selects new city in this field
Selected State:
Shows selected city with icon
"Change" button to re-open dropdown
Validation:
Required field
Must select from existing Master City data
Shows error if empty on submit
Helper Text: "Select the primary city for this geolocation filter"
Auto-populated Fields (from Master City):

District (auto-filled, editable)
Free text input
City (auto-filled, read-only or editable)
Free text input
Province (auto-filled, read-only recommended)
Free text input
Visual Form Layout:
┌──────────────────────────────────────────────────────┐
│ Add New Geolocation Filter                      [✕]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Location Information                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                      │
│ City Name *                                          │
│ [Select city...                            ▼]       │
│ └─ Search results:                                   │
│    Jakarta Selatan                                   │
│    Jakarta Pusat                                     │
│    Bandung                                           │
│    [+ Add New City]                                  │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Selected: Jakarta Selatan           [Change]   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ District (optional)                                  │
│ [Kebayoran Baru                        ]            │
│ Specific district or sub-area                       │
│                                                      │
│ City                                                 │
│     │
│                                                      │
│ Province                                             │
│ │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│                                                      │
│                                                      │
│                           [Cancel]  [Save Filter]   │
└──────────────────────────────────────────────────────┘


Modal Footer:
Left side:
"Cancel" button (outline, gray)
Closes modal
Shows confirmation if there are unsaved changes
Right side:
"Save Filter" button (primary blue)
When creating: Adds new filter to database
When editing: Updates existing filter
Loading state: "Saving..." with spinner
After save: Success message + closes modal + refreshes table
Validation:
Required field validation on submit
All fields cannot be empty
Shows error messages in red below fields
Highlights invalid fields with red border
Cannot submit until all required fields valid
Check for duplicates: Warn if exact same City Name + District already exists
Success State:
After saving: Toast notification
"✓ Geolocation filter created successfully"
"✓ Geolocation filter updated successfully"
Table auto-refreshes to show new/updated entry
New entry highlighted briefly (subtle animation)
Error State:
If save fails: Error toast
"✕ Failed to save filter. Please try again."
Form remains open with data intact
Error message shown at top of form

DELETE CONFIRMATION MODAL
Modal Title: "Delete Geolocation Filter?" Width: 500px
Content:
Warning Icon: Red triangle with exclamation mark
Message:
"Are you sure you want to delete this geolocation filter?"
Filter Details:
City Name: Jakarta Selatan
District: Kebayoran Baru
Province: DKI Jakarta
Warning Text:
"⚠ Warning: Are you sure you want to remove this geolocation?"
Footer:
"Cancel" button (outline)
"Delete Filter" button (red, disabled until checkbox checked)
Loading state: "Deleting..." with spinner
After delete: Success toast + removes from table
Success State:
Toast: "✓ Geolocation filter deleted successfully"
Table auto-refreshes
Removed entry fades out (animation)

EMPTY STATES
No Filters (First Time):
Icon: MapPin with plus sign
Text: "No geolocation filters yet"
Subtext: "Create your first filter to start organizing campaign locations"
"Add Filter" button (primary, large)
No Search Results:
Icon: Search with X
Text: "No filters found"
Subtext: "Try adjusting your search or filters"
"Clear Search" button
No Filters After Filtering:
Icon: Filter with slash
Text: "No filters match your criteria"
Subtext: "Try selecting different province or city"
"Clear Filters" button

DESIGN SPECIFICATIONS
Sidebar Menu Structure:
Master parent menu with expand/collapse
Indented submenu items (16px left padding)
Color Scheme:
Same as existing admin panel (Geist font, shadcn/ui)
Action buttons follow standard pattern
Validation: Red (#EF4444) for errors, Green (#10B981) for success
Typography:
Font: Geist for UI, Geist Mono for IDs
Page title: 24px, font-weight 800
Section headers: 14px, font-weight 700, uppercase
Table headers: 11px, font-weight 700, uppercase, letter-spacing 0.05em
Table data: 14px, font-weight 400
City Name column: 14px, font-weight 600 (slightly bolder)
Components:
shadcn/ui: Button, Input, Label, Badge, Card, Table, Dialog, Select (Combobox for searchable), Checkbox, Textarea, Tabs
Searchable dropdown: Custom combobox component (shadcn/ui Command component)
Form UX:
Auto-focus on first field when modal opens
Tab navigation between fields
Enter key submits form (if valid)
Escape key closes modal (with confirmation if dirty)
Real-time validation on blur
Show success checkmarks on valid fields (optional)
Table UX:
Sticky header on scroll
Zebra striping (subtle, optional)
Row hover highlights entire row
Click anywhere on row to edit (not just actions column)
Keyboard navigation: Arrow keys to move between rows, Enter to edit
Responsive:
Desktop-first (master data is typically desktop-only)
Table becomes horizontally scrollable on tablet/mobile
Modal becomes full-screen on mobile
Form fields stack vertically on mobile
Action buttons stack on mobile

DATA EXAMPLES
Sample Geolocation Filters:
ID
City Name
District
City
Province
Created
By
GEO-001
Jakarta Selatan
Kebayoran Baru
Jakarta
DKI Jakarta
Feb 25
Ahmad
GEO-002
Jakarta Pusat
Menteng
Jakarta
DKI Jakarta
Feb 25
Ahmad
GEO-003
Bandung
Dago
Bandung
Jawa Barat
Feb 24
Dewi
GEO-004
Bandung
Cihampelas
Bandung
Jawa Barat
Feb 24
Dewi
GEO-005
Surabaya
Gubeng
Surabaya
Jawa Timur
Feb 23
Rudi
GEO-006
Surabaya
Wonokromo
Surabaya
Jawa Timur
Feb 23
Rudi
GEO-007
Semarang
Simpang Lima
Semarang
Jawa Tengah
Feb 22
Siti
GEO-008
Medan
Medan Baru
Medan
Sumatera Utara
Feb 21
Ahmad
GEO-009
Yogyakarta
Malioboro
Yogyakarta
DI Yogyakarta
Feb 20
Dewi
GEO-010
Denpasar
Sanur
Denpasar
Bali
Feb 19
Rudi

Master City Data Source (for dropdown):
Jakarta Selatan
Jakarta Pusat
Jakarta Utara
Jakarta Barat
Jakarta Timur
Bandung
Bekasi
Depok
Tangerang
Tangerang Selatan
Bogor
Surabaya
Semarang
Medan
Yogyakarta
Denpasar
Makassar
Palembang
[and more Indonesian cities...]
Indonesian Provinces (38 total):
DKI Jakarta
Jawa Barat
Jawa Tengah
Jawa Timur
Banten
DI Yogyakarta
Sumatera Utara
Sumatera Barat
Sumatera Selatan
Riau
Kepulauan Riau
Jambi
Bengkulu
Lampung
Bangka Belitung
Aceh
Kalimantan Barat
Kalimantan Tengah
Kalimantan Selatan
Kalimantan Timur
Kalimantan Utara
Sulawesi Utara
Sulawesi Tengah
Sulawesi Selatan
Sulawesi Tenggara
Gorontalo
Sulawesi Barat
Maluku
Maluku Utara
Papua
Papua Barat
Papua Tengah
Papua Pegunungan
Papua Selatan
Papua Barat Daya
Bali
Nusa Tenggara Barat
Nusa Tenggara Timur

INTERACTIONS & BEHAVIORS
Master Menu:
Click "Master" → Expands submenu (smooth animation)
Click again → Collapses submenu
Click submenu item → Navigates to page, keeps Master expanded
Active page indicator: Blue background + left border on active submenu item
Remember expansion state in localStorage (remains expanded after page refresh if user had it open)
Table:
Click row → Opens edit modal
Click checkbox → Selects row, enables bulk actions
Click column header → Sorts by that column
Double-click City Name → Quick inline edit (advanced feature)
Hover row → Shows action icons
Right-click row → Context menu with actions (optional)
Search:
Debounced: Waits 300ms after last keystroke before searching
Shows loading spinner in search input during search
Highlights matching text in results (optional)
Clears with X icon button in input
Dropdown (City Name selection):
Opens on click or focus
Type to search/filter
Arrow keys to navigate results
Enter to select highlighted result
Escape to close without selecting
Shows "Loading..." while fetching cities from API
Shows "No results" if search returns empty
Scrollable if many results
Highlights matching text in city names
Form Validation:
Validates on blur (when field loses focus)
Shows errors immediately
Prevents submission if errors exist
Scrolls to first error on submit attempt
Shows field-level error messages
Form-level error summary at top (if multiple errors)

