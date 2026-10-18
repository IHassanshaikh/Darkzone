# DESIGN OVERRIDES (these win over docs/DESIGN.md)
Visual changes only. Never change logic, labels, routes or store code. Keep every label from docs/UI_SPEC.md.
From docs/DESIGN.md keep: typography families, spacing scale, component structure, flat hairline-border style. Its navy/blue brand colors are REPLACED by the forest-green brand below.

## 1. Brand (forest green, warm)
Header and sidebar: deep forest #1F3D2B with white text. Primary action buttons: #2F4A2B (hover #243A21), white text, 8px radius. Focus ring: 2px #6B8F5E.
App background: warm cream #F6F3EA. Cards: #FFFDF7 with 1px #E4DFD0 border, radius 12px, very light shadow. Text #1C2A1F, muted #5F6B5E.
Active sidebar item: pill with #2F5A3A background.

## 2. Status colors (fixed, never use for brand)
Red #DC2626 high risk (tint #FEE2E2). Amber #D97706 warning (tint #FEF3C7). Safe green #16A34A (tint #DCFCE7) always shown with a check icon and the text "Safe" or "OK". Purple #7C3AED (tint #F5F3FF) only for Dark Zone and Silent Risk.
Never rely on color alone: every status has an icon and a text label.

## 3. Projector readability
Body 16px, table text 15px, small text 14px, labels 12px minimum, metric numbers 40px bold. Tabular numbers for numeric values.

## 4. Fonts (must work offline)
Headings and metrics: Hanken Grotesk. Body and tables: Public Sans. Install with npm (@fontsource-variable/hanken-grotesk and @fontsource-variable/public-sans; if a package is missing use @fontsource/hanken-grotesk and @fontsource/public-sans) and import in main.jsx. No Google Fonts CDN. Add woff2 to the workbox globPatterns in vite.config.js so fonts are precached. Fallback: system-ui, sans-serif.

## 5. Buttons
"Send Field Team", "Approve", "Extract details", "Sync now": primary forest-green buttons. "Mark Verified Safe": outline button with the safe-green check icon. "Reject": red outline. Tabs and links use forest green.

## 6. Dark Zone hero treatment
Dark Zone cards and priority rows: background #F5F3FF, 1px #A78BFA border, 3px left accent #7C3AED. Silent Risk tag is a purple pill. On the map: purple circle with dashed border and a slow CSS pulse ring (disabled when prefers-reduced-motion). Tooltip: "Potential Dark Zone · Silence ratio ≥ 0.6". Dark Zone is the only purple element in the app.

## 7. Do NOT add (they appear in reference mockups but are not in our app)
SOS or Request button, Citizen role, Camp Resident screen, fake statistics (People Served, Total Camps, Field Teams counts), weather, drone/recon buttons, broadcast or SitRep export, UTC clock, search bar, new sidebar items.

## 8. Volunteer pages
Below 768px: single column, 48px tall buttons and toggles, sticky offline banner "Offline mode" with "Sync now".