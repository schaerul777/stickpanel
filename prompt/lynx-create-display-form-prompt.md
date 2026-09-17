# Lynx Admin — Create Display Form Page

Build the "Add New Display" form. Use the referenced screenshot only for **layout, grouping, and field behavior** — section structure, field order, conditional show/hide logic, required-field marking (`*`), and inline validation states (e.g. the red-border "already taken" pattern). Do **not** copy its visual styling — apply Lynx Admin's existing design system (Geist, the established color tokens, and the existing kit components) throughout instead.

Page header: title + one-line instruction text below it ("Please fill out the required fields below. The fields marked with (*) are required."), matching the reference's pattern. Footer: Cancel (secondary) + Save (primary), pinned at the bottom.

---

## Condition variables used throughout

- **Specification**: `Roadside` | `Place-based` | `Fleet-based`
- **Type**: `DOOH` | `OOH`
- **Category**: options depend on Specification (and possibly Type) — see the flag in Section 3, this needs a real supplied list before shipping
- **Direction Facing**: toggle, off by default
- **Direction Facing Method**: `Custom Direction` | `Cardinal Direction` — only relevant once Direction Facing is on

---

## 1. General Information
- **Name** — text, always, required
- **SKU** — text, always, required

## 2. Specification
- **Specification** — card selector (Roadside / Place-based / Fleet-based), always, required, same visual pattern as the reference (image + label per card)
- **Type** — segmented control (DOOH / OOH), always, required
- **Category** — select, always, required. Options depend on the Specification/Type combination (e.g. Fleet-based specifically includes values like "Mobile LED" and "Mobile Showcase," which Section 5's Area field depends on). **This option list isn't covered by any reference doc — needs a real list supplied before implementation; placeholder options are fine for now but flag them as placeholders.**
- **Lighting** — select with 3 options: **No light / Front light / Back light**. Shown only when **Type = OOH**.

## 3. Dimension
- **Resolution** — Width + Height, pixel inputs, shown only when **Type = DOOH**, required when shown
- **Width** — meters, always, required
- **Height** — meters, always, required
- **Height from Ground** — meters, always required **except excluded entirely when Specification = Fleet-based**

## 4. Playback Configuration
Whole section shown only when **Type = DOOH**.
- **Ad Slot in a Single Loop** — number, required
- **Ad Duration per Slot** — number (seconds), required

## 5. Venue
Whole section shown only when **Type = DOOH**.
- **Venue Name** — free text, the specific human-readable name of the place (e.g. "Mall Kelapa Gading") — distinct from the standardized taxonomy fields below.
- **Venue** — select, populated from the **OpenOOH/IAB DOOH Venue Taxonomy v1.2.1 parent categories**: Transit, Retail, Outdoor, Health & Beauty, Point of Care, Education, Office Building, Entertainment, Government, Financial, Residential.
- **Sub-venue** — select, cascades from the selected Venue, populated from that parent's child categories per the same taxonomy (e.g. Venue = Retail → Sub-venue options: Fueling Station, Convenience Store, Grocery, Liquor Store, Mall, Cannabis Dispensary, Pharmacy, Parking Garage, Furniture, Apparel, Automotive, Laundromat, Vape Shop, Mass Merchandising, Consumer Electronic, Retail Other, Sporting Good, Pet Store, Office Supply, Home Renovation). Reference the full parent→child mapping at https://docs.lynxssp.com/venue-taxonomy for all 11 parent categories.
- **Placement** — select, shown only when **Specification = Place-based**, cascades from the selected Venue. **The taxonomy above stops at Sub-venue — it does not define a Placement level, so this option list also needs to be supplied separately** (e.g. "Entrance," "Food Court," "Escalator Area" for a Mall venue) rather than pulled from the taxonomy doc.

## 6. Location
Always shown, regardless of Type or Specification.
- **Location (Latitude & Longitude)** — search-style input with a lookup icon, always, required
- **Map View** — visual map, always rendered once a location is set. Needs to support multiple overlay layers depending on what's configured elsewhere on the form, not just a static pin:
  - Always: a pin at the Location coordinates
  - If Direction Facing is on: a direction indicator from the pin — for Custom Direction, a line/arrow to the Custom Direction point; for Cardinal Direction, an arrow at the specified angle, with Visibility Distance shown as a radius/arc in that direction
  - If Area applies (Section 6 continued below): an editable polygon overlay for the drawn coverage area
- **Toggle: Direction Facing** — off by default, always available
- **Direction Facing Method** — segmented control or radio (Custom Direction / Cardinal Direction), shown only when Direction Facing is on
  - **Custom Direction (Latitude & Longitude)** — a second coordinate point on the map; shown only when method = Custom Direction. The bearing from the display's own Location to this point defines the facing direction.
  - **Direction Angle** — shown only when method = Cardinal Direction. A compass-style input (0–360°).
  - **Visibility Distance (m)** — shown for **either** method, once Direction Facing is on — how far the display is effectively visible in the faced direction.
- **Address Notes** — textarea, always, required
- **Area** — shown only when **Specification = Fleet-based AND Category is Mobile LED or Mobile Showcase**. A polygon **drawn directly on the Map View above** (not a separate map or a named-region select) representing the coverage/service area for a mobile display. Needs a draw/edit polygon tool integrated into the same map component used for Location.

## 7. Schedule
- **Operating Days** — checkboxes Monday–Sunday, always, required. Add shortcut buttons above/beside the checkboxes: **Weekdays**, **Weekend**, **All** — each one-tap-selects the matching set without requiring individual clicks.
- **Operating Time** — Start at / End at time pickers, plus a **24/7 toggle, on by default**. When the 24/7 toggle is on, hide (or disable) the Start/End inputs entirely, since the display is always active. Turning it off reveals the specific time pickers.
- **Timezone** — select, always, required

## 8. Rate
- **Display Rate** — currency selector (defaulting to IDR, but selectable) + amount, per month, always, required

## 9. Display Images
- **Upload Image** — optional, always. Same format/size guidance as the reference: JPG/JPEG/PNG, minimum 300×300px, recommended 700×700px minimum.

## 10. Usage Settings
- **Allow Regular Campaign** — toggle, always shown, matching the reference (label + helper text: "Turn on if this billboard is available for direct booking or traditional campaign scheduling.")

## 11. Programmatic
- **CPM (Cost per Thousand Impression)** — optional, currency selector + amount, with input formatting (thousand separators applied live as the user types, matching the reference's "80,000,000" display format)
- **Impression Multiplier** — optional, numeric
- **Venue ID** — optional, text. Support an inline validation error state (red border + helper text below, e.g. "The Venue ID has already been taken"), same pattern as the reference.

## 12. Audiences
- **Potential Impression per Day** — optional. The reference shows this with the same muted/filled styling used elsewhere for system-derived values in this platform — confirm whether this should be read-only/auto-calculated (consistent with how other auto-derived values work elsewhere in Lynx Admin) or a plain manual input; building it as a normal editable field for now unless told otherwise.

---

## Notes on what needs to be supplied before this is fully implementable

- **Category** option list, filtered by Specification/Type — not covered by any reference doc.
- **Placement** option list, cascading from Venue — the taxonomy doc explicitly stops at Sub-venue, so this is a Lynx-specific list to be defined separately.

Everything else — Venue and Sub-venue specifically — has real, complete data available from the taxonomy doc referenced in Section 5.
