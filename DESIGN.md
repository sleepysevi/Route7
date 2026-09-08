---
name: Route7
description: A mobile-first Cebu jeepney transit companion for quick route decisions.
colors:
  midnight-base: "#0b0c10"
  midnight-deep: "#07070a"
  surface-panel: "#14161d"
  surface-hover: "#1c1f2a"
  route-signal: "#ff4757"
  route-signal-hover: "#ff2e43"
  route7-yellow: "#ffbe0b"
  route-green: "#10b981"
  body-white: "#f8fafc"
  utility-slate: "#94a3b8"
  dim-slate: "#64748b"
  border-subtle: "rgba(255,255,255,0.08)"
  border-active: "rgba(255,71,87,0.4)"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontWeight: 800
    lineHeight: "0.9"
    letterSpacing: "-3px"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: "1.25"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "0.025em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  pill: "9999px"
spacing:
  xs: "0.375rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.route-signal}"
    textColor: "{colors.body-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.route-signal-hover}"
    textColor: "{colors.body-white}"
    rounded: "{rounded.pill}"
  input-search:
    backgroundColor: "#12141c"
    textColor: "{colors.body-white}"
    rounded: "{rounded.md}"
    padding: "0.625rem 2.5rem"
  card-glass:
    backgroundColor: "rgba(26,29,39,0.6)"
    textColor: "{colors.body-white}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  nav-active:
    backgroundColor: "{colors.route-signal}"
    textColor: "{colors.body-white}"
    rounded: "{rounded.md}"
    padding: "0.375rem 1rem"
---

# Design System: Route7

## Overview

**Creative North Star: "Pocket Transit Console"**

Route7 is a compact, dependable instrument for making a transit decision while moving through Cebu. The interface treats route codes, search, filters, stops, maps, and emergency contacts as working controls rather than decorative content. Its dark field keeps attention on the route signal, while the interface stays dense enough to scan on a phone and structured enough to orient a visitor.

The visual language is a commuter tool with a local pulse: coral marks active route decisions, yellow carries the Route7 identity and navigational highlights, and translucent panels create a layered console over a deep midnight base. Motion is brief and purposeful, reserved for entering the app, revealing state, focusing the map, and showing route context.

**Key Characteristics:**
- Mobile-first, high-contrast transit utility
- Layered glass surfaces over a midnight field
- Coral action signals with a yellow brand accent
- Dense cards, chips, and route controls designed for fast scanning
- Warm local voice without corporate polish

## Colors

The palette is a dark operational field with two deliberate signals: coral for action and route state, yellow for identity and orientation.

### Primary
- **Coral Route Signal** (#ff4757): Primary action, active navigation, selected routes, focus, and meaningful state changes.
- **Route Signal Hover** (#ff2e43): Deeper coral for hover and pressed emphasis.

### Secondary
- **Route7 Yellow** (#ffbe0b): Brand mark, map orientation, guide emphasis, and directional highlights.
- **Route Green** (#10b981): Positive route or start-state information, especially in route timelines and filters.

### Neutral
- **Midnight Base** (#0b0c10): App canvas and persistent dark field.
- **Midnight Deep** (#07070a): Lowest background tone and footer depth.
- **Surface Panel** (#14161d): Primary glass-panel tonal anchor.
- **Surface Hover** (#1c1f2a): Hover and raised surface tone.
- **Body White** (#f8fafc): Primary readable text and high-priority labels.
- **Utility Slate** (#94a3b8): Supporting copy and secondary controls.
- **Dim Slate** (#64748b): Low-priority metadata and map attribution.
- **Subtle Border** (rgba(255,255,255,0.08)): Quiet separation on dark surfaces.

### Named Rules
**The Two Signal Rule.** Coral communicates action and route state; yellow communicates Route7 identity and orientation. Do not swap their jobs casually.

## Typography

**Display Font:** Syne (with sans-serif fallback)
**Body Font:** DM Sans (with system sans-serif fallbacks)

**Character:** Syne gives the product name a distinctive, slightly expressive local mark. DM Sans keeps search, route names, labels, and emergency information compact and legible under pressure.

### Hierarchy
- **Display** (800, clamp(52px, 14vw, 84px), 0.9): Splash-screen Route7 wordmark with tight tracking.
- **Headline** (700, 18px, 1.25): Route names and compact content headings.
- **Title** (700, 16px, approximately 1.25): Card and section titles inside dense work surfaces.
- **Body** (400-500, 14-15px, 1.5): Search context, descriptions, and supporting copy.
- **Label** (600-800, 10-12px, 1.25): Tabs, route codes, chips, metadata, and uppercase utility labels.

### Named Rules
**The Route First Rule.** Route codes and destinations should win the first scan; supporting copy stays smaller and quieter.

## Layout

The app uses a centered workspace with a maximum width of 72rem and responsive horizontal padding of 1rem on small screens and 1.5rem from the `sm` breakpoint upward. Main content uses a compact vertical rhythm, generally 1.25rem between sections and 1.5rem to 2rem inside major surfaces.

The primary routes surface stacks search, map, result status, and route cards in a single mobile column. At wider widths, cards can switch to a two- or three-column grid while the map and search controls remain prominent. Horizontal filter chips scroll rather than wrap when space is tight. Navigation labels compress on small screens while icons remain available.

## Elevation & Depth

This is a layered glass utility. Depth comes primarily from translucent dark surfaces, backdrop blur, tonal changes, and restrained shadows rather than heavy ornament. Cards lift slightly on hover; active routes receive a coral ring and glow; splash content uses ambient blurred color to establish focus without competing with the search action.

### Shadow Vocabulary
- **Glass card hover** (`0 10px 25px -5px rgba(0,0,0,0.4), 0 0 15px -3px rgba(255,71,87,0.1)`): Slight lift and route-signal atmosphere on interactive cards.
- **Primary action** (`0 10px 25px rgba(255,71,87,0.35)`): Separates the main entry action from the splash surface.
- **Map popup** (`0 12px 30px rgba(0,0,0,0.6)`): Keeps map annotations readable over tiles.

### Named Rules
**The Layered Utility Rule.** Blur and tonal layering should clarify working surfaces; they should never obscure route information.

## Shapes

The shape language is soft but controlled: rounded-xl inputs and controls, rounded-2xl cards and panels, rounded-3xl map and empty-state containers, and pill-shaped chips for filters and quick tags. Borders are thin and low-contrast, usually white at 8-10% opacity. Route timeline markers use circles for starts and square corners for ends, making direction legible without extra copy.

## Components

### Buttons
- **Shape:** Compact rounded controls from 0.5rem to pill radius, with icons where the action benefits from quick recognition.
- **Primary:** Coral gradient or coral fill, white text, compact label typography, and a shadow that separates the action from the dark field.
- **Hover / Focus:** Slight scale or tonal lift for primary actions; coral border or ring for focused fields and selected controls.
- **Secondary / Ghost:** Translucent white surfaces or quiet slate text, with subtle borders and stronger contrast on hover.

### Chips
- **Style:** Pill-shaped route filters and quick-search tags with a translucent color wash, thin border, compact label, and optional count.
- **State:** Active chips use the group color as a solid fill; inactive chips preserve the color as a low-opacity background and border.

### Cards / Containers
- **Corner Style:** Rounded-2xl route cards and rounded-3xl map or empty-state panels.
- **Background:** Translucent dark glass over the midnight canvas.
- **Shadow Strategy:** Tonal layering at rest; restrained shadow and a 2px upward lift on hover; coral ring and glow for selection.
- **Border:** Low-opacity white at rest, stronger white or coral on hover and active state.
- **Internal Padding:** Generally 1rem for cards and 0.75rem to 1rem for control panels.

### Inputs / Fields
- **Style:** Dark inset field (#12141c), rounded-xl, subtle white border, and a coral leading icon for search.
- **Focus:** Coral border and a 1px coral ring; splash search adds a wider coral focus halo.
- **Error / Disabled:** No dedicated visual system is established; retain the same readable dark-field contrast when added.

### Navigation
- **Style:** Sticky, translucent dark header with a low-contrast bottom border and backdrop blur.
- **States:** Active tabs use coral fill and white text; inactive tabs use slate text and a quiet white hover surface.
- **Mobile:** Compact icon-plus-label tabs with labels reduced at small widths; the guide action retains an icon-first treatment.

### Signature Component: Route Timeline
The collapsible route timeline turns stop data into a vertical decision path. Green marks the start, coral marks the end, and slate marks intermediate stops. START and END labels reinforce the visual markers without relying on color alone.

## Do's and Don'ts

### Do:
- **Do** preserve coral for actions, selection, route emphasis, and focus states.
- **Do** use the yellow Route7 accent sparingly for identity and orientation.
- **Do** keep route codes, destinations, stop counts, and emergency actions easy to scan.
- **Do** use translucent dark panels, subtle borders, and blur to create layered depth.
- **Do** test every surface at 375px before treating the desktop layout as complete.

### Don't:
- **Don't** replace the compact commuter-tool voice with marketing-style hero copy.
- **Don't** flatten the hierarchy by giving metadata the same weight as route decisions.
- **Don't** add heavy borders, bright multi-color decoration, or ornamental cards that compete with the map and route data.
- **Don't** use rounded containers without a functional grouping or interaction reason.
- **Don't** rely on color alone for route timeline meaning; keep START, END, labels, and shape differences.
