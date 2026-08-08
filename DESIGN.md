---
name: Star Sorter
description: AI-curated bilingual index of personal GitHub stars
colors:
  ink: "#0a0a0a"
  paper: "#fafafa"
  card: "#ffffff"
  hairline: "#e5e5e5"
  hairline-strong: "#d4d4d4"
  ink-muted: "#525252"
  ink-faint: "#737373"
  ink-on-dark: "#d4d4d4"
  ink-on-dark-muted: "#a3a3a3"
  accent-amber: "#fbbf24"
  github-typescript: "#3178c6"
  github-javascript: "#f1e05a"
  github-python: "#3572a5"
  github-rust: "#dea584"
  github-go: "#00add8"
  github-default: "#9ca3af"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 600
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
components:
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
  card-hover:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline-strong}"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
  chip-inactive:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline-strong}"
  hero-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
---

# Design

## Overview

Star Sorter is a personal GitHub star index: a category-standard card grid (user's explicit choice over the rolled alternatives) executed at the craft level of Vercel's templates page. A near-black ink band introduces the collection with one line of facts; the white work area below carries a search field, category chips, and a sort toggle above a responsive grid of bordered white cards. The system is monochrome-neutral — ink, paper, hairline gray — with GitHub linguist language colors as the only chromatic accents, so the data itself provides the color.

## Colors

- **Ink `#0a0a0a`** — display text, active chips, active sort button, the header brand mark, the hero band.
- **Paper `#fafafa`** — page ground. **Card `#ffffff`** — cards, inputs, chips, header, footer.
- **Hairline `#e5e5e5` / `#d4d4d4`** — borders; the stronger hairline marks interactive edges (inputs, hover states).
- **Ink-muted `#525252` / ink-faint `#737373`** — secondary text. Both meet 4.5:1 on white.
- **On dark**: `#d4d4d4` for secondary text on the hero band, `#a3a3a3` for tertiary facts; both meet contrast on `#0a0a0a`.
- **Language accents**: a 8px dot and a 2px dot (card corner + language row) tinted by the GitHub linguist palette (`languageColor()` in `src/i18n.ts`); unknown languages fall back to `#9ca3af`.
- **Amber `#fbbf24`** — reserved exclusively for the synthetic-data notice pill.

## Typography

System sans stack (ui-sans-serif → PingFang SC / Hiragino / Microsoft YaHei for CJK). No webfont dependency; the stack renders Inter-grade on macOS and matches the platform on Windows/Android.

- Display: 30–36px, weight 600, tracking -0.025em, balanced.
- Body: 14px at 1.6 leading for summaries; muted 12px for meta and original descriptions (clamped to one line).
- Tabular numerals for star counts and dates. Star counts format as `34万` / `230k` per language.
- Heading hierarchy: the single `h1` carries the page; card titles are `h3` at 14px/600. No kickers, no eyebrows.

## Layout

- Max content width 1152px, px-4 on mobile / px-6 on desktop.
- Sticky header (h-14, white 85% + backdrop-blur) with brand mark left, GitHub link and language toggle right.
- Hero band: dark ink section, pt-14→20 / pb-12→16, headline + subline + one inline fact line (count · updated · AI note). No metric cards, no numbers grid.
- Filter bar: sticky under the header (top-14), paper 90% + blur; search field (max-w-sm on desktop, full-width stacked on mobile), sort segmented control, then horizontally scrollable category chips.
- Grid: 1 col mobile → 2 @sm → 3 @lg → 4 @xl, gap 16px. Cards equal height via flex column.
- Footer: centered two-line note on white, hairline top border.

## Elevation & Depth

- Shadows only on card hover: `shadow-lg` with `shadow-neutral-200/60` tint, plus a 0.5px upward translate. No resting shadows, no zero-blur block shadows, no colored halos.
- Hairline borders carry the resting structure; the hover border steps one grade (`neutral-200` → `neutral-300`).
- Sticky surfaces use 85–90% opacity + backdrop-blur over scrolling content.
- Avatar in the card preview scales to 1.05 on card hover. Motion is duration-200, and `prefers-reduced-motion` collapses all transitions/animations.

## Shapes

- Cards, inputs, buttons: 6–8px radius (lg). Chips: fully rounded pills.
- Card preview pane: 96px tall, neutral-100→50 gradient, 48px circular avatar centered, language dot at top-right.
- Focus: 2px ink outline with 2px offset on all interactive elements; visible on keyboard focus only.

## Components

- **RepoCard** (`src/components/RepoCard.tsx`): whole card is a GitHub link. Preview pane → title row (repo name, star count right) → AI summary (sparkle glyph + `line-clamp-2`, 14px) → original description (`line-clamp-1`, muted, only when it differs) → hairline-separated footer (language dot + name, short date right).
- **Chip** (in `App.tsx`): pill, count badge inside, `aria-pressed`. Active = ink fill/white text; inactive = white fill/hairline border/muted text.
- **Sort toggle**: two-button segmented control, same active/inactive language as chips, `aria-pressed`.
- **Search input**: search icon left, `type="search"`, wrapped in a `<label>`; ink border + 2px ink-tinted ring on focus.
- **EmptyState**: icon-free centered title + hint, optional retry button (error case only).
- **Loading**: eight pulse skeleton cards matching the card footprint; pulse respects reduced-motion.

## Do's and Don'ts

- Do let the data provide color: keep surfaces neutral, use linguist dots as the only chromatic accents.
- Do keep the AI summary as the card's lead text — it is the product's point — with the sparkle mark as the honest AI label.
- Do keep one `h1`, one hero band, and the fact line in sentence form; never add metric-card stats or kickers.
- Do use tabular numerals for stars and dates.
- Don't add emoji or Unicode glyphs; icons are drawn in a single 1.5px stroke set (`src/icons.tsx`).
- Don't introduce resting shadows, gradient text, glass effects, or colored borders on cards.
- Don't ship muted text below `neutral-500` on white for anything a reader needs (decorative icons exempt).
- Don't add web fonts; the system stack covers zh/en.
