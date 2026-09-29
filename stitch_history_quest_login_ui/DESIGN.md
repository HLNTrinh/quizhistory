---
name: History Quest Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00311f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a31'
  on-tertiary-container: '#27c38a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  display-hero-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system drives a gamified examination and study platform for Vietnamese high school history students, teachers, and school administrators. The product bridges serious academic test preparation (the National High School Graduation Examination / Kỳ thi Tốt nghiệp THPT) with motivational progression mechanics found in modern role-playing and strategy games.

### Brand Personality & Tone
- **Authoritative yet Engaging:** Accurate, academically sound, and trustworthy, stripped of dry textbook monotony.
- **Heroic & Triumphant:** Learning is framed as an exploratory campaign or quest across eras. Milestones, streaks, and mastery evoke pride and momentum.
- **Respectful Modernity:** Incorporates stylized Vietnamese historical emblems—such as subtle radial geometry inspired by Đông Sơn bronze drums, parchment-tinted surfaces, and cartographic timeline nodes—without falling into kitsch or outdated traditionalism.

### Visual Style
A hybrid of **Modern EdTech SaaS** and **Tactile Micro-Gamification**:
- Interfaces feature crisp, modern surfaces, high legibility, and disciplined typographic hierarchy.
- Interactive gamification points (XP chips, quest markers, streak counters, rank insignias) employ subtle tactile 3D bottom bevels, metallic warm-gold sheen, and fluid micro-transitions to make study progress immediately tangible.

## Colors

The palette establishes an academic anchor through imperial deep navy, energized by heroic gold and jade accents. The design defaults to a crisp light theme to prioritize extended reading comfort during rigorous exam drills, while maintaining high-contrast clarity.

### Color Roles & Semantics
- **Primary (`#1E3A8A` - Royal Navy):** The structural core. Represents institutional authority, clarity, and primary navigation actions. Deep slate tints (`#0F172A`, `#1E293B`) provide foundation layers and high-contrast typography.
- **Secondary (`#F59E0B` - Bronze Gold):** The motivational catalyst. Reserved for XP gains, mastery stars, streak counters, legendary quest badges, and active quest waypoints. Supported by bright gold highlights (`#FBBF24`) and burnished borders (`#D97706`).
- **Tertiary (`#10B981` - Jade Emerald):** Used for correct answers, score improvements, mastered timeline modules, and positive progression.
- **Neutral (`#0F172A` - Slate Ink):** Delivers WCAG AAA contrast for body typography, complemented by muted slate (`#64748B`) for metadata, sub-labels, and auxiliary timelines.
- **Canvas & Surfaces:** Primary workspace canvas rests on warm-cream slate (`#F8FAFC` to `#F1F5F9`), while interactive quiz modules and scorecards sit on pure white (`#FFFFFF`) with subtle warm parchment borders (`#E2E8F0`).
- **System Feedback:** Crimson Red (`#EF4444`) signals incorrect test answers and critical alerts; Warm Ochre (`#F97316`) indicates review-flagged questions and timed countdown warnings.

## Typography

Typography prioritizes flawless Vietnamese diacritics rendering and prolonged reading endurance under timed test settings.

### Typeface Selection
- **Be Vietnam Pro (Primary & Headings):** Engineered specifically with crafted tone marks for Vietnamese orthography. Prevents clipping of stacked accents (nhược, đường, triều) across all viewport densities while providing solid geometric structure for headings and long-form historical excerpts.
- **Plus Jakarta Sans (Labels, Data & Gamified UI):** Clean, open letterforms paired with contemporary numeric clarity. Used for timers, leaderboard metrics, question pagination pills, and XP badges.

### Typographic Hierarchy Rules
- Vietnamese text requires a minimum line-height multiplier of 1.45x for body copy to prevent high-accent collisions between lines.
- Headings above 24px must use a tighter tracking (-0.015em) to maintain punchy presence.
- Numerical values in tests, timers, and point indicators must render with tabular figures (`tnum`) enabled to prevent layout jitter during live countdowns.

## Layout & Spacing

The layout is built around an 8px base rhythm that governs component paddings and responsive grids, keeping dense academic questionnaires digestible.

### Grid & Breakpoint Strategy
- **Desktop (1200px+):** 12-column fluid grid. Layout uses dual panels: a main timeline/test canvas (8 columns) paired with an persistent contextual battle/status rail (4 columns) showing live ranking, remaining time, and question maps.
- **Tablet (768px – 1199px):** 8-column layout. The utility rail transforms into a floating bottom sheet or persistent header summary.
- **Mobile (< 768px):** 4-column layout. Margins tighten to `margin-sm` (16px) with stacked single-question viewports to minimize scroll cognitive load during test sessions.

### Spacing Philosophy
- Inner test question containers use `space-lg` padding to isolate the reading target from distracting navigation.
- Answer options use `space-md` gaps to prevent accidental fat-finger selection on mobile devices.
- Grouped game rewards (badges, milestone dots) use `space-xs` and `space-sm` increments to appear as coherent visual clusters.

## Elevation & Depth

Visual depth distinguishes standard administrative/informational UI from high-reward game elements.

### Elevation Architecture
- **Layer 0 (Canvas Base):** Flat `#F8FAFC` background. Subtle low-contrast historical map watermark vectors and geometric Dong Son radial motifs may sit here at 3–5% opacity.
- **Layer 1 (Card & Module Surfaces):** Pure `#FFFFFF` surfaces bounded by a crisp 1px border (`#E2E8F0`) and an ambient, low-spread drop shadow: `0 2px 8px -2px rgba(15, 23, 42, 0.06)`. Used for test question containers, user profile blocks, and curriculum lists.
- **Layer 2 (Floating & Interactive HUD):** Question trackers, sticky action bars, and modal overlays: `0 12px 24px -6px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Gamified Elements & Reward Modals):** Tactile 3D layering. Milestone badges and key CTA buttons use a dual-layer strategy: a physical bottom border extrusion (2px to 4px of a darker shade, e.g., `#B45309` under a `#F59E0B` button) that depresses flush on click, combined with an ambient golden glow shadow (`0 8px 20px -4px rgba(245, 158, 11, 0.35)`).

## Shapes

The design system uses a pronounced rounded geometry to convey approachable gamification while maintaining the structural rigor of a testing platform.

### Corner Radius System
- **Base Elements (Inputs, Chips, Table Rows):** Standard 8px (`rounded-md` / 0.5rem) to ensure structured alignment.
- **Content Cards & Test Modules:** 16px to 24px (`rounded-xl` to `rounded-2xl`). This softens long examination papers and creates friendly container boundaries.
- **Interactive Badges & Quest Indicators:** Fully circular (9999px) for streak badges, rank insignias, and question number jump-links.
- **Gamified Progress Trackers:** Capsule/pill shapes with circular inner meters that evoke health and energy bars.

## Components

### Buttons
- **Primary Hero (Action / Submit Exam):** High-contrast navy or gold fill with bold label. Features a 3px tactile bottom lip (`box-shadow: 0 3px 0 #1E293B` or `0 3px 0 #D97706`). On active press, the button shifts down 2px with the lip flattening to 1px, providing a tactile game-controller feel.
- **Secondary (Next / Previous Question):** Clean white background, 1.5px slate border (`#CBD5E1`), Slate Navy text. Hover brings a soft slate wash (`#F1F5F9`).
- **Reward / Instant Claim:** Golden gradient (`#FBBF24` to `#F59E0B`) with subtle inner white highlight on top border.

### Question Multiple-Choice Cards
- Outlined white rounded cards (`rounded-xl`) with 1.5px `#E2E8F0` border.
- Left-aligned indicator index (A, B, C, D) encased in a rounded-lg squircle.
- **Selected State:** Border color switches to Navy (`#1E3A8A`), background fills with light blue tint (`#EFF6FF`).
- **Validated Correct State:** Jade Emerald border (`#10B981`), light mint surface (`#ECFDF5`), accompanied by a green victory check icon.
- **Validated Incorrect State:** Crimson Red border (`#EF4444`), light rose surface (`#FEF2F2`), showing strike-through notation.

### Chips & Gamification Badges
- **XP / Streak Chip:** Pill-shaped (`rounded-full`), warm amber background (`#FEF3C7`), deep amber text (`#92400E`), housing a flame or bronze drum star icon.
- **Era / Dynasty Tag:** Muted navy tag (`#F1F5F9` background, `#334155` text) indicating the historical period (e.g., "Nhà Lý", "Kháng chiến chống Pháp").

### Checkboxes & Radio Buttons
- Sized at 20px x 20px with a 2px stroke. Radios are circular; multi-select checkboxes use a 6px border radius.
- Smooth scale animation (0.85 to 1.0) with an energetic spring upon selection.

### Input Fields (Search, Student Code, Essay/Short Answer)
- 48px height with 12px horizontal padding.
- Border is 1.5px `#CBD5E1` on `#FFFFFF`. Focus transitions to a 2px `#1E3A8A` border with an auxiliary focus ring (`rgba(30, 58, 138, 0.15)`).

### Question Navigator Map (Grid Palette)
- Compact square/circular buttons (36px x 36px) laid out in a grid.
- Visual indicators denote status: Unvisited (muted gray), Answered (solid navy), Flagged for Review (warm orange top-right dot), Marked Uncertain (amber border).

### Timeline Quest Module
- A vertical or horizontal serpentine node-line resembling campaign maps in historical strategy games.
- Completed historical epochs light up in gold with Dong Son radial pattern outlines; locked eras remain monochromatic slate with a padlock glyph.