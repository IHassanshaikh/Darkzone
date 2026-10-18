---
name: ReliefOS Command
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#25005a'
  on-tertiary-container: '#9863ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Hanken Grotesk
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-metric:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-metric-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  data-tabular:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an operational interface engineered for high-consequence crisis response environments. Drawing inspiration from institutional bodies such as UN OCHA, the Red Cross, and FEMA, the visual tone balances institutional authority, calm precision, and rapid glanceability under crisis fatigue.

The visual style merges structured operational modernism with tactical utility:
- **Calm, High-Information Architecture**: Interfaces prioritize dense data throughput, eliminating gratuitous ornamentation, decorative shadows, or distracting micro-interactions.
- **Mission Critical Legibility**: Data displays are engineered for long-range wall-projector visibility in field command centers as well as daylight outdoor tablet use.
- **Strict Visual Hierarchy**: Structural chrome employs a deep maritime slate, while the core canvas utilizes clinical, clean neutrals to give absolute priority to emergency status indicators.

## Colors

The palette establishes an unambiguous hierarchy between structural chrome, interactive elements, and humanitarian operational telemetry.

### Core Foundation
- **Primary (`#0F172A`)**: Deep Navy Slate anchor. Reserved for primary structural chrome, tactical navigation rails, situational headers, and authoritative typography.
- **Secondary (`#2563EB`)**: Operational Blue. Dedicated to interactive controls, primary action flows, dispatched route markers, and active state indicators.
- **Tertiary (`#7C3AED`)**: Dark Zone Violet. Reserved exclusively for anomalies, disconnected grids, uncontacted sectors, and communications blackouts. It must never be applied to generic UI accents or unrelated interactive states.
- **Neutral (`#64748B`)**: Balanced Slate. Governs metadata, tabular timestamps, secondary framing, and structural grid dividers.

### Canvas & Surface Architecture
- **Canvas Base**: `#F8FAFC` (Clinical Cool Off-White). Maximizes contrast against projector washouts.
- **Card Surface**: `#FFFFFF` (Solid Pure White). Provides clean containment for clustered operational telemetry.
- **Surface Borders**: `#E2E8F0` (Structural Light Slate). Ghost delineations that structure dense tables without adding visual weight.

### Semantic Status Palette
- **Critical / High Risk**: `#DC2626` (Red). Structural collapses, medical stockouts, urgent evacuations.
- **Warning / Degraded**: `#D97706` (Amber). Approaching hazard perimeters, supply chain delays, capacity alerts.
- **Nominal / Safe**: `#16A34A` (Green). Verified corridors, secured airfields, resolved distress signals.
- **Dark Zone / Disconnected**: `#7C3AED` with deep background tier `#EDE9FE`. Visual indicator for zero-connectivity pockets, unregistered populations, and unverified reconnaissance sectors.

## Typography

Typography is calibrated for institutional authority and split-second operational ingestion:

- **Hanken Grotesk**: Drives display elements, top-level sector banners, and oversized operational metrics. Its sharp geometric construction retains definition when cast via ambient-lit field projectors.
- **Public Sans**: Serves as the functional workhorse for body telemetry, tabular grids, lists, form controls, and situational summaries. Engineered to remain legible across high-density layouts and reduced screen backlights.
- **Tabular Alignment**: All numeric values, geographic coordinates, casualties, inventory counts, and UTC timestamps must apply OpenType tabular lining figures (`font-variant-numeric: tabular-nums; tnum: 1`) to eliminate character jitter during real-time data syncs.
- **Field Metadata**: Micro labels, tracking tags, and tactical priority indicators use uppercase styling (`label-caps`) with expanded tracking for immediate identification.

## Layout & Spacing

The layout utilizes a fluid, grid-bound structure built for situational multi-window monitoring and command operations:

### Grid Architecture
- **Desktop (Command Station & Projector)**: 12-column dynamic grid, 24px (`1.5rem`) gutters, 32px (`2rem`) outer margin. Supports persistent 280px operational sidebars and dynamic geospatial-to-tabular splits (60/40 or 70/30 split ratios).
- **Tablet (Field Triage Unit)**: 8-column layout, 16px (`1rem`) gutters, 24px (`1.5rem`) margins. Navigation shifts to a collapsible drawer or persistent bottom command bar.
- **Mobile (First Responder)**: 4-column layout, 16px (`1rem`) gutters, 16px (`1rem`) margins. Stacked single-column operational triage blocks.

### Spacing Discipline
- **Information Density**: Padding within data cards and list groups remains tightly calibrated using `space-sm` (8px) and `space-md` (16px) to maximize visible data above the fold.
- **Spatial Separation**: Functional groupings are decoupled using `space-lg` (24px) or `space-xl` (32px) margins to prevent operational misreads under high stress.

## Elevation & Depth

This design system deliberately eschews deep blurred drop shadows and atmospheric neomorphism, both of which degrade on budget projector screens and glare-heavy mobile tablets. Hierarchy is reinforced through surface planes, contrast banding, and crisp low-contrast borders:

- **Level 0 (Field Canvas)**: Pure base plane (`#F8FAFC`). Holds structural grid divisions and broad map tiles.
- **Level 1 (Operational Tiles & Cards)**: Solid white (`#FFFFFF`) interior surface with an omnipresent 1px hairline border (`#E2E8F0`). Flat elevation with zero ambient shadow.
- **Level 2 (Active Focus & Overlays)**: Floated contextual popovers, active dispatch modules, and flyout filters. Utilizes a hairline border (`#CBD5E1`) paired with an ultra-subtle, high-stability shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Tactical Modals & Alerts)**: Critical dispatch verification dialogs and Dark Zone perimeter overrides. Floated over a high-contrast scrim (`rgba(15, 23, 42, 0.65)`), anchored with a 1px border (`#94A3B8`) and an elevated structural drop: `0 20px 25px -5px rgba(15, 23, 42, 0.15)`.
- **Command Chrome Inversion**: The structural sidebar and top mission chronometer leverage an inverted dark field (`#0F172A`) to visually isolate platform controls from localized mission data.

## Shapes

The design system maintains a calibrated, low-radius silhouette (`roundedness: 1`) that preserves clean lines and professional authority:

- **Core Elements (`0.25rem` / 4px)**: Standard buttons, text input fields, operational table cells, status tags, and metric containers rely on compact 4px corners to maintain an orderly data footprint.
- **Structural Modules (`0.5rem` / 8px)**: Triage cards, alert panels, tactical map viewports, and floating flyout drawers employ an 8px radius (`rounded-lg`) to soften panel perimeters without appearing informal.
- **Full Radius (Pill)**: Used exclusively for priority badges, status state indicators, and counter badges to distinguish transient operational labels from actionable rectangular buttons.

## Components

### Buttons
- **Primary Operational Action**: Background `#2563EB`, text `#FFFFFF`, 4px radius, 0 1px 2px rgba(0, 0, 0, 0.05). Hover: `#1D4ED8`. Focus: 2px ring `#93C5FD` with 2px offset.
- **Destructive / High Alert Action**: Background `#DC2626`, text `#FFFFFF`, 4px radius. Used for emergency broadcasts, route evacuations, or lockouts. Hover: `#B91C1C`.
- **Secondary Chrome Action**: Background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`. Hover: `#F1F5F9`.
- **Tertiary / Utility**: Ghost surface, text `#64748B`, hover background `#F1F5F9`, hover text `#0F172A`.

### Badges, Status Indicators & Priority Tags
- **Critical (High Risk)**: Background `#FEF2F2`, text `#991B1B`, border 1px solid `#F87171`. Pill shape (`9999px`), uppercase `label-caps` typography, leading 6px pulsing dot.
- **Warning (Degraded Ops)**: Background `#FFFBEB`, text `#92400E`, border 1px solid `#FCD34D`.
- **Safe (Nominal)**: Background `#F0FDF4`, text `#166534`, border 1px solid `#86EFAC`.
- **Dark Zone Anomaly**: Background `#F5F3FF`, text `#5B21B6`, border 1px solid `#A78BFA`. Applied strictly to telemetry tiles indicating communication dropouts, unknown territory, or unregistered relief cohorts.

### Cards & Mission Tiles
- Base background `#FFFFFF`, border 1px solid `#E2E8F0`, corner radius 8px (`0.5rem`).
- Header includes a 40px fixed action band with uppercase tracking headers (`#64748B`), an actionable context menu, and an optional left-side accent line (3px solid `#DC2626` or `#7C3AED`) to designate situational severity.
- Internal padding is set to a strict 16px (`1rem`), with tabular key-value rows partitioned via hairline dividers (`#F1F5F9`).

### Tables & Data Grids
- Clean tabular rows with a fixed row height of 40px (compact) or 48px (standard).
- Table headers: `#F8FAFC`, uppercase `label-caps`, text `#475569`, border-bottom 1px solid `#CBD5E1`.
- Row borders: Hairline border-bottom 1px solid `#E2E8F0`. Hover row state: `#F8FAFC`.
- All quantitative fields right-aligned with Public Sans tabular numerals.

### Form Inputs & Selectors
- Background `#FFFFFF`, 1px solid `#CBD5E1`, 4px radius, 8px vertical by 12px horizontal padding.
- Text: `#0F172A`, placeholder: `#94A3B8`.
- Focus state: Border color `#2563EB` with a distinct `0 0 0 1px #2563EB` focus ring.
- Error state: Border color `#DC2626` with supportive micro-copy in red below the input.

### Checkboxes & Radios
- Size: 16px by 16px.
- Inactive: Border 1.5px solid `#94A3B8`, surface `#FFFFFF`.
- Selected: Background `#2563EB`, check/radio glyph in pure `#FFFFFF`. Corner radius: Checkboxes 3px, Radios full circle.

### Mission-Specific: Metric Callout Blocks
- Designed for field projectors. Features a large, bold `Hanken Grotesk` tabular metric (`headline-metric` or `display-hero`), anchored above a concise two-word description in uppercase `label-caps`.
- Optional trailing delta indicators (+12%, -48m) rendered in bold Public Sans, enclosed in semantic background chips.