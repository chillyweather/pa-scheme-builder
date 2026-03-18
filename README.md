# PA Schema Builder

A Figma plugin that generates comprehensive design system component specifications using AI. Select a component set in Figma, and the plugin extracts its structure, then uses Google Gemini to produce a complete, professional JSON specification covering design, accessibility, behavior, and content guidelines.

## How It Works

1. **Select** a `COMPONENT_SET` node in Figma
2. **Generate** — the plugin extracts component properties, variants, and states from Figma
3. **AI Enhancement** — extracted data is sent to Google Gemini, which fills in documentation fields (accessibility guidelines, behavior rules, content guidelines, etc.)
4. **Merge** — template defaults, AI output, and factual Figma data are merged (factual data always takes precedence)
5. **Export** — copy the final JSON spec

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Figma desktop app](https://figma.com/downloads/)
- Google AI Studio API key ([get one here](https://aistudio.google.com/))

## Setup

```bash
npm install
npm run build
```

This generates `manifest.json` and the `build/` directory.

### Install in Figma

1. Open the Figma desktop app and open any document.
2. Run `Import plugin from manifest…` via the Quick Actions search bar (`⌘/` or `Ctrl+/`).
3. Select the `manifest.json` file from this project root.

## Development

```bash
npm run watch    # Rebuild on file changes
npm run build    # One-time build with type checking
```

To debug, use `console.log()` in source files and open the Figma developer console via Quick Actions → `Open Console`.

## Configuration

On first run, open the plugin settings to enter your **Google AI Studio API key**. The key is stored in Figma client storage (not synced or shared).

### Available Gemini Models

| Model | Label |
| --- | --- |
| `gemini-3-flash-preview` | Standard (default) |
| `gemini-3.1-pro-preview` | Powerhouse |
| `gemini-3.1-flash-lite-preview` | Speedster |
| `gemini-2.5-pro` | Stable |
| `gemini-2.5-flash` | Balanced |

## Project Structure

```
pa-schema-builder/
├── src/
│   ├── main.ts               # Plugin backend — Figma API, node serialization, event orchestration
│   ├── ui.tsx                # Plugin UI — Preact components, token management, spec display
│   ├── schema.ts             # ComponentSpec TypeScript interface + deep merge utility
│   ├── types.ts              # Event name constants for main ↔ UI communication
│   ├── factual-extractor.ts  # Extracts variants, properties, and states from Figma nodes
│   └── gemini.ts             # Google Gemini API integration + system prompt
├── default_prompt.json       # Example component spec (used as generation template)
├── manifest.json             # Figma plugin manifest
└── build/                    # Compiled output (generated, do not edit)
```

## Output Format

The generated spec is a JSON object following the `ComponentSpec` schema defined in [src/schema.ts](src/schema.ts). It covers:

- Component metadata (name, description, category, status)
- Properties and variants (with types, options, defaults)
- States and their visual/behavioral descriptions
- Accessibility guidelines (WCAG 2.1 AA)
- Behavior and interaction rules
- Content and copy guidelines
- Design tokens and theming notes

## Tech Stack

- **TypeScript** + **Preact** for the plugin UI
- **[Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/)** for build tooling and Figma utilities
- **Google Gemini API** for AI-powered spec generation
