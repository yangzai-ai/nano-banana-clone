# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with TypeScript, showcasing the "Nano Banana" AI image editing product. It's a marketing/landing page with no backend functionality. The project uses:

- **Runtime**: Bun (preferred package manager)
- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui (New York style) + Radix UI
- **Styling**: Tailwind CSS with custom yellow/orange gradient theme
- **Icons**: Lucide React
- **Code Quality**: Biome for formatting/linting, TypeScript with strict mode
- **Deployment**: Netlify (configured in netlify.toml)

## Key Commands

```bash
# Development (with Turbopack, exposed on network via -H 0.0.0.0)
bun dev

# Production build
bun run build

# Start production server
bun start

# Type checking + Next.js linting
bun run lint

# Format code with Biome
bun run format
```

## Architecture Notes

### Special JSX Configuration

This project uses `same-runtime` for JSX transformation:
- `jsxImportSource` is set to `"same-runtime/dist"` in tsconfig.json
- The runtime script is loaded via `<Script>` tag in src/app/layout.tsx:30-33
- This is a custom JSX runtime, not React's default

### Hydration Strategy

The project has a custom `ClientBody` component (src/app/ClientBody.tsx) to handle hydration mismatches:
- Wraps children in src/app/layout.tsx
- Resets body className client-side to prevent extension-added classes from causing issues
- Uses `suppressHydrationWarning` on the `<body>` tag

### Component Structure

- **Page**: Single-page application in src/app/page.tsx (460 lines)
- **UI Components**: shadcn/ui components in src/components/ui/ (button, card, badge, accordion, dropdown-menu)
- **Styling**: Global styles in src/app/globals.css
- **Path Aliases**: `@/*` maps to `./src/*` (configured in tsconfig.json and components.json)

### Biome Configuration

Biome is configured with strict formatting but relaxed linting:
- A11y rules are mostly disabled (intentional for this landing page)
- `noUnusedVariables` is off
- Double quotes enforced for JavaScript/TypeScript
- Targets only `src/**/*.ts` and `src/**/*.tsx`

### Image Handling

Next.js image optimization is disabled (`unoptimized: true`). Allowed domains:
- source.unsplash.com
- images.unsplash.com
- ext.same-assets.com (showcase images)
- ugc.same-assets.com

### Design System

The landing page uses a consistent yellow-to-orange gradient theme:
- Primary colors: yellow-400, orange-500, red-500
- Gradient patterns: `from-yellow-500 to-orange-500`
- Background: `from-yellow-50 to-orange-50`
- Fonts: Geist Sans and Geist Mono (loaded via next/font/google)

## Adding shadcn/ui Components

When adding new shadcn/ui components:

```bash
bunx shadcn@latest add [component-name]
```

Configuration is in components.json with:
- Style: "new-york"
- Base color: "zinc"
- CSS variables enabled
- Components go to: @/components/ui
