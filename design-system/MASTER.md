# UI/UX Pro Max - Design System (Casa-Shower)

## 1. Product Context
- **Product Type**: Event / Celebration (Shower)
- **Vibe**: Joyful, elegant, modern, accessible
- **Primary Platform**: Web (Next.js / React)

## 2. Global Style Pattern
- **Style Name**: Modern Soft Glass (Glassmorphism + Soft Shadows)
- **Shape Language**: Rounded, friendly (`rounded-2xl`, `rounded-full`)
- **Effects**: Soft purple glows, backdrop-blur for overlays

## 3. Color System (Morado / Purple)
- `background`: `slate-50` (Light) / `slate-950` (Dark)
- `primary`: `purple-600` (Light) / `purple-500` (Dark)
- `primary-foreground`: `white`
- `secondary`: `fuchsia-100` (Light) / `fuchsia-900` (Dark)
- `secondary-foreground`: `fuchsia-900` (Light) / `fuchsia-100` (Dark)
- `accent`: `amber-400` (for playful highlights)
- `muted`: `slate-100` / `slate-800`
- `border`: `slate-200` / `slate-800`

## 4. Typography
- **Heading Font**: `Outfit` or `Inter` (bold, geometric, clean)
- **Body Font**: `Inter` (highly legible)
- **Scale**:
  - H1: `text-4xl` to `text-6xl`, tracking tight `-tracking-tight`
  - Body: `text-base`, `leading-relaxed`

## 5. Interaction & Motion
- **Hover**: Scale up slightly `hover:scale-[1.02]`, transition `duration-200`
- **Active/Press**: Scale down `active:scale-[0.98]`
- **Loading**: Use shimmering skeletons instead of blocking spinners.
- **Feedback**: Clear success/error states (e.g., green/red toasts) with a minimum contrast ratio of 4.5:1.

## 6. Layout & Responsiveness
- **Mobile First**: Default to single column (`flex-col`).
- **Breakpoints**: 
  - `sm: 640px`
  - `md: 768px`
  - `lg: 1024px`
- **Spacing Rhythms**: Use `gap-4`, `gap-8`, `p-6`.

## 7. Anti-Patterns to Avoid
- `[AVOID]` Using emojis as primary navigation icons (Use SVG like Lucide).
- `[AVOID]` Hardcoded hex colors in components (Use semantic Tailwind classes).
- `[AVOID]` Poor contrast on purple backgrounds (Ensure text is white, not light grey).
- `[AVOID]` Missing focus rings on buttons or inputs.
