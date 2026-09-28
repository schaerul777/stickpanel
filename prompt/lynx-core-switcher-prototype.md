{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 Add a "Core Switcher" to the existing StickPanel admin panel so the sidebar menu and pages are filtered by the active core. This is a prototype, so keep it front-end only (no backend, no auth).\
\
## 1. Core definitions\
\
Create a single config (e.g. `coreConfig`) that is the source of truth for the menu of each core:\
\
- CORE 2 \uc0\u8594  Operations, Sales, Master, Account\
- CORE 3 \uc0\u8594  Master, Inventory, QC, Deal Testing, Account\
- CORE 4 \uc0\u8594  Master, Account (plus any feature menus I add later; keep the config easy to extend)\
\
Rules:\
- Operations and Sales belong ONLY to CORE 2.\
- Inventory, QC, and Deal Testing belong ONLY to CORE 3.\
- The existing Master submenus and pages belong ONLY to CORE 3.\
- Master and Account exist in every core, but each core has its own separate version. CORE 2 Master, CORE 4 Master, and the Account pages of each core should be simple placeholder pages: page title, breadcrumb, and an empty state saying "Master data for CORE X will be available here". Do not reuse CORE 3's Master submenus in other cores.\
- Keep the existing menu order, icons, expand/collapse behavior, and active-state styling exactly as they are now. Only filter which items are shown.\
\
## 2. Switcher UI (bottom of sidebar)\
\
- Use the existing profile card at the bottom of the sidebar ("Ops Team / Online") as the trigger.\
- Show the active core as a small badge or subtitle inside the card, e.g. "Ops Team \'b7 CORE 3".\
- Add a small chevron-up-down icon on the right side of the card. Clicking anywhere on the card opens a popover that opens upward.\
- Popover content:\
  - Header label: "Switch Core"\
  - A list of 3 options: CORE 2, CORE 3, CORE 4. Each has a short name/description line (leave the description as an easy-to-edit placeholder), and a check icon on the active one.\
  - A divider, then the existing profile actions (e.g. Account settings and Log out) if present.\
- Style: match the current purple sidebar theme. The popover is a white card with rounded corners, a soft shadow, and a hover state on each row. Close on outside click and on Esc.\
- Keyboard accessible (arrow keys to move, Enter to select). Use `aria-label`s.\
\
## 3. Switching behavior\
\
- Selecting a core immediately:\
  1. Updates the sidebar to show only that core's menu items.\
  2. Navigates to that core's default landing page (CORE 2 \uc0\u8594  Operations > Redeem Transactions, CORE 3 \u8594  Inventory landing page, CORE 4 \u8594  Master).\
  3. Collapses all expanded menu groups except the one containing the landing page.\
- If the user is on a page that doesn't exist in the newly selected core, redirect to that core's default landing page instead of showing a broken or blank view.\
- Persist the selected core in localStorage and restore it on reload (default: CORE 2 on first load).\
- Add a short (150\'96200ms) fade transition on the menu list when switching so it doesn't feel jarring.\
- Add the current core to the URL structure or route state if it's easy (e.g. `/core-2/operations/redeem-transactions`) so page reloads land on the right core.\
\
## 4. Extra details\
\
- Show a tiny badge next to the "StickPanel" logo in the sidebar header with the active core name (e.g. "CORE 2"), so the context is always visible.\
- Breadcrumbs should include the core as the first level: "CORE 2 / Operations / Redeem Transactions".\
- Update the browser tab title to include the active core.\
- If the sidebar is collapsed, the profile card shows only the avatar, and the popover still works.\
- Don't change any existing page content, table, tabs, or actions. This task only adds the switcher and the menu filtering.\
\
## Acceptance checklist\
- [ ] Switching to CORE 2 shows: Operations, Sales, Master, Account\
- [ ] Switching to CORE 3 shows: Master, Inventory, QC, Deal Testing, Account\
- [ ] Switching to CORE 4 shows: Master, Account\
- [ ] CORE 3 Master keeps its current submenus; CORE 2 and CORE 4 Master are placeholders\
- [ ] Selected core survives a page reload\
- [ ] No leftover menu items or active states from the previous core}