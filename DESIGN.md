---
name: agent-desk
description: Agent-first instrument panel — neutral, scanable, the UI recedes so the data leads.
colors:
  ink-deep: "#020817"
  ink-primary: "#0f172a"
  paper: "#ffffff"
  paper-cool: "#f1f5f9"
  paper-cool-deep: "#1e293b"
  slate-muted: "#64748b"
  slate-muted-dark: "#94a3b8"
  border-faint: "#e2e8f0"
  border-dark: "#1e293b"
  ring-light: "#020817"
  ring-dark: "#cbd5e1"
  signal-red: "#ef4444"
  signal-red-deep: "#7f1d1d"
  primary-foreground-light: "#f8fafc"
  primary-foreground-dark: "#0f172a"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
  nav-link:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-primary}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.md}"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.paper-cool}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    height: "36px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    height: "36px"
    width: "36px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-header:
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.ink-primary}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  badge-secondary:
    backgroundColor: "{colors.paper-cool}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-link-active:
    backgroundColor: "{colors.paper-cool}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  kanban-column:
    backgroundColor: "{colors.paper-cool}"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.lg}"
    padding: "12px"
  kanban-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: agent-desk

## Overview

**Creative North Star: "The Instrument Panel"**

agent-desk is an instrument panel, not a canvas. The interface exists so an agent (and its human curator) can read working state at a glance and act on it without friction. Every visual decision answers one question: does this help the operator scan, decide, and act faster?

The system is deliberately quiet. A single neutral palette (slate) carries the entire interface — backgrounds, text, borders, and surfaces all live on one cool-gray axis. There is no decorative color, no gradient, no ornamentation. The only chromatic signal is destructive red, reserved for irreversible actions. A single subtle accent for active/focus states is the intended direction; the incumbent does not yet express it, and that absence is documented here as an open decision rather than filled with a guess.

Density is moderate. Cards, inputs, and buttons share a 36px height standard. Spacing follows a 4px grid. The layout caps at `max-w-6xl` (1152px) centered, because an instrument panel does not sprawl — it frames. Dark mode inverts the slate axis; it does not introduce a new palette.

**Key Characteristics:**
- Neutral slate palette, single axis, light and dark
- 36px control height standard across buttons, inputs, nav links
- 4px spacing grid (4, 8, 12, 16, 24, 32)
- Rounded corners from 4px (sm) to 12px (xl), never sharp, never pill
- Flat surfaces; depth conveyed by tonal shift, not shadow (directional — see Elevation)
- Sticky header with backdrop blur; content scrolls beneath
- Bilingual (ES/EN), system font stack, no custom fonts
- `data-testid` on every interactive element — the DOM is a control surface, not a display

## Colors

The palette is a single slate axis with one destructive signal. All neutrals share the same cool hue (210-222deg); they differ only in lightness.

### Primary
- **Ink Primary** (#0f172a): The darkest slate. Used for primary buttons, default badges, and the base text color in light mode. It is nearly black but carries a measurable blue undertone that keeps it from feeling inert.
- **Ink Deep** (#020817): The absolute darkest slate. Used for foreground text and focus rings in light mode. One step darker than primary to maintain contrast on white.

### Neutral
- **Paper** (#ffffff): The light background. Pure white, no warmth.
- **Paper Cool** (#f1f5f9): The secondary/muted/accent surface. Used for inactive nav links (hover), secondary buttons, kanban column backgrounds, and badge-secondary fills. The workhorse surface tone.
- **Paper Cool Deep** (#1e293b): The dark-mode equivalent of Paper Cool. Used for secondary surfaces, borders, and muted backgrounds in dark mode.
- **Slate Muted** (#64748b): Muted foreground text. Used for descriptions, metadata, timestamps, and inactive nav labels in light mode.
- **Slate Muted Dark** (#94a3b8): Muted foreground in dark mode.
- **Border Faint** (#e2e8f0): The default border color in light mode. Used on every bordered element (cards, inputs, kanban columns, dashboard rows).
- **Border Dark** (#1e293b): The default border color in dark mode.

### Signal
- **Signal Red** (#ef4444): Destructive actions only. Delete buttons, destructive button variant. Never used for emphasis, status, or decoration.
- **Signal Red Deep** (#7f1d1d): Destructive in dark mode.

### Named Rules
**The Single Signal Rule.** Destructive red is the only chromatic color in the system. It appears exclusively on irreversible actions. If a new status, priority, or category needs color, it gets a badge variant with a neutral fill — never a new hue.

**The One Accent Direction.** The system intends a single subtle chromatic accent for active/focus states (the `?` shortcuts hint in the Header already experiments with `primary/5` and `primary/30`). This accent is not yet codified as a token. When it lands, it must be one hue, used on <=10% of any screen, and reserved for state signaling — never decoration.

## Typography

**Body Font:** ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Label/Mono Font:** Same system stack; `font-mono` is used only for `<kbd>` elements in the shortcuts hint.

**Character:** The system uses the platform's native sans-serif. No custom fonts are loaded. This is deliberate: the instrument panel loads fast, renders identically across profiles, and never depends on a network request for type. The hierarchy is carried entirely by size and weight, not by family contrast.

### Hierarchy
- **Title** (700, 1.5rem / 24px, 1.2): Page titles (e.g., "Dashboard"). The largest text on screen, but still restrained.
- **Body** (400, 0.875rem / 14px, 1.25): Default text size for all content — task titles, event names, descriptions, dialog content. 14px is the base, not 16px; an instrument panel prioritizes density over reading comfort.
- **Label** (600, 0.75rem / 12px, 1): Badges, metadata, timestamps, column headers. Uppercase is not used; weight carries the hierarchy.
- **Nav Link** (500, 0.875rem / 14px, 1.25): Navigation items. Medium weight to distinguish from body without shouting.

### Named Rules
**The No-Import Rule.** Never load a custom font. The system stack is the system. A custom font would add a network dependency (violating zero-backend) and a visual personality the instrument panel does not want.

**The Weight-Not-Size Rule.** When two text elements need to feel different but share the same size, differentiate by weight (400 vs 500 vs 600 vs 700), not by adding another size step. The scale has four roles; resist a fifth.

## Layout

The layout is a single centered column capped at `max-w-6xl` (1152px) with `px-4` (16px) horizontal padding and `py-6` (24px) vertical padding. A sticky header (`h-14` / 56px, `z-40`, `backdrop-blur`) sits above; content scrolls beneath it.

The Dashboard uses a 2-column grid (`md:grid-cols-2`) with `gap-4` (16px). Cards stack to 1 column below the `md` breakpoint (768px). The Kanban board uses horizontal scroll (`overflow-x-auto`) with fixed-width columns (`w-72` / 288px) and `gap-4`. The Calendar view manages its own grid internally.

Spacing follows a 4px grid: 4, 8, 12, 16, 24, 32. Card internal padding is 24px (`p-6`). Card-to-card gap is 16px. Element-to-element gap inside cards is 8px (`space-y-2`).

The header collapses nav labels below `sm` (640px): icons remain, text hides. The shortcuts hint pill hides below `sm` as well.

### Named Rules
**The Frame Rule.** Content never spans wider than 1152px. An instrument panel frames its data; it does not let it sprawl. If a view needs more width, it scrolls horizontally (kanban) rather than breaking the frame.

## Elevation & Depth

The system is **flat by tone**. Depth is conveyed by background lightness, not by shadow. A kanban column sits on Paper Cool (#f1f5f9); a card sits on Paper (#ffffff) inside it. The tonal difference is the depth signal.

The incumbent implementation still carries shadcn's default shadows (`shadow`, `shadow-sm`) on buttons, cards, and inputs. These are legacy from the shadcn preset, not an intentional elevation vocabulary. The direction is to remove them and rely on tonal layering exclusively.

### Named Rules
**The Tone-Not-Shadow Rule.** Surfaces express depth by background lightness, not by `box-shadow`. A raised surface is one step lighter (or darker, in dark mode) than its container. Shadows may appear only as a transient state signal (drag overlay, focus) — never as rest-state decoration.

**The Shadow Exit Rule.** The remaining `shadow` and `shadow-sm` classes on buttons, cards, and inputs are scheduled for removal. New components must not add them.

## Shapes

Corner radii follow a four-step scale: 4px (sm), 6px (md), 8px (lg), 12px (xl). The default is 8px (`--radius: 0.5rem`), inherited by `rounded-lg`. Buttons and inputs use `rounded-md` (6px). Cards use `rounded-xl` (12px). Badges and nav links use `rounded-md` (6px). The shortcuts hint pill uses `rounded-full` — the only pill in the system, and it is a deliberate signal that keyboard help is a distinct affordance.

Borders are 1px, solid, using Border Faint (#e2e8f0) in light mode. Every bordered element shares the same border color; there is no per-component border variation.

### Named Rules
**The No-Pill Rule.** Pill shapes (`rounded-full`) are reserved for the shortcuts hint and nothing else. Buttons, badges, inputs, and cards use the radius scale. A pill on a button would read as decorative, and the instrument panel does not decorate.

## Components

### Buttons
- **Shape:** 6px radius (`rounded-md`), 36px height standard
- **Primary:** Ink Primary background, Paper foreground, 8px 16px padding. The default action button.
- **Hover:** Primary lightens to 90% opacity (`hover:bg-primary/90`) — a tonal shift, not a shadow lift.
- **Focus:** 1px ring in Ring Light color (`focus-visible:ring-1`).
- **Secondary:** Paper Cool background, Ink Primary text. For secondary actions in dialogs and forms.
- **Outline:** Paper background with Border Faint stroke. For tertiary actions and cancel buttons.
- **Ghost:** Transparent at rest, Paper Cool on hover. Used for icon buttons (header controls, inline delete) and nav links.
- **Icon:** 36x36px square, ghost variant. Used in header for theme/language/data toggles.

### Badges
- **Shape:** 6px radius, 12px height (`px-2.5 py-0.5`), 12px font, semibold
- **Default:** Ink Primary fill, Paper text. Used for counts and primary tags.
- **Secondary:** Paper Cool fill, Ink Primary text. Used for due dates and secondary metadata.
- **Outline:** Transparent fill, Border Faint stroke, Ink Deep text. Used for priority labels, status, and tags (`#tag`).
- **Destructive:** Signal Red fill, Paper text. Rare; only on error states.

### Cards / Containers
- **Corner:** 12px radius (`rounded-xl`)
- **Background:** Paper (#ffffff) in light, Ink Deep (#020817) in dark
- **Border:** 1px Border Faint
- **Shadow Strategy:** Currently `shadow` (legacy); direction is to remove per The Shadow Exit Rule
- **Internal Padding:** 24px (`p-6`) for header and content; content section uses `pt-0` to tighten against header
- **Structure:** CardHeader (title + description, `space-y-1.5`), CardContent (body), CardFooter (actions, `items-center`)

### Inputs / Fields
- **Shape:** 6px radius, 36px height, 12px horizontal padding
- **Background:** Transparent (inherits card/surface)
- **Border:** 1px Border Faint (same as `--input` token)
- **Focus:** 1px ring in Ring Light, outline removed
- **Placeholder:** Slate Muted text
- **Disabled:** 50% opacity, `cursor-not-allowed`

### Navigation
- **Style:** Horizontal flex in sticky header, 8px gap between items
- **Default:** Slate Muted text, transparent background, 6px radius, 12px horizontal padding
- **Active:** Paper Cool background (`bg-secondary`), Ink Primary text, `data-active` attribute for programmatic detection
- **Hover (inactive):** Paper Cool background (`bg-accent`), Ink Primary text
- **Mobile:** Labels hide below 640px; icons remain at 16px
- **Icons:** Lucide, 16px (`h-4 w-4`), inline before label

### Kanban Board
- **Columns:** Fixed 288px width (`w-72`), 16px gap, horizontal scroll, Paper Cool background at 30% opacity (`bg-muted/30`), 8px radius
- **Column Header:** 12px padding, border-bottom, semibold 14px state name (capitalized), Badge with count
- **Cards:** Paper background, 6px radius, 12px padding, 1px border. Title (14px medium), description (12px muted, 2-line clamp), badge row (priority, due date, tags, backlink count)
- **Drag State:** Active card opacity 40%; drag overlay gets `shadow-lg` (transient state signal — acceptable per The Tone-Not-Shadow Rule)
- **Delete Button:** Ghost icon, 24px, opacity 0 → 100% on group hover

### Dashboard Row
- **Shape:** 6px radius, 1px border, 8px padding
- **Layout:** Flex justify-between, title truncated (`truncate`), metadata in 12px muted
- **Used in:** Requires Attention, Upcoming Events, Active Tasks cards

## Do's and Don'ts

### Do:
- **Do** use the slate axis exclusively for all neutral surfaces. Background, text, border, and surface tones all come from the same hue family.
- **Do** express depth by tonal shift (lighter surface on darker container, or vice versa in dark mode).
- **Do** put `data-testid` on every interactive element and `aria-label` on every icon-only control. The DOM is a control surface for agents.
- **Do** use 14px as the base text size. The instrument panel prioritizes density.
- **Do** cap content width at 1152px (`max-w-6xl`). The frame is part of the design.
- **Do** reserve Signal Red exclusively for destructive actions.
- **Do** hide nav labels below 640px and keep icons. Mobile density matters.

### Don't:
- **Don't** add `shadow` or `shadow-sm` to new components. The incumbent shadows are legacy; depth comes from tone.
- **Don't** load custom fonts. The system stack is the system (zero-backend, no network requests).
- **Don't** introduce a second chromatic color. One signal (red) plus the intended single accent is the maximum.
- **Don't** use `rounded-full` on buttons, badges, inputs, or cards. The pill is reserved for the shortcuts hint.
- **Don't** add decorative gradients, glassmorphism, or ornamental backgrounds. The instrument panel does not decorate.
- **Don't** scrape the DOM for data. The UI is a view on `window.agentAPI`; visual patterns are for humans, not data extraction.
- **Don't** break the 4px spacing grid. Every gap, padding, and margin is a multiple of 4.
