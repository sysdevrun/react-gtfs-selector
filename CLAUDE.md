# CLAUDE.md — react-gtfs-selector

## Project overview

React component library for selecting GTFS transit data sources. Provides a tabbed UI with drag-and-drop file import and online feed search. Published as an npm module.

## Architecture

- **`src/types.ts`** — Core types: `GtfsSelectionResult`, `GtfsSearchResult`, `GtfsSource` interface
- **`src/sources/`** — Source plugins implementing `GtfsSource`
  - `transport-data-gouv-fr.ts` — French open transit data (fully implemented)
  - `mobility-data.ts` — Mobility Database (server-side search via `api.mobilitydatabase.org/v1/search`, requires API token)
- **`src/components/`** — React components
  - `GtfsSelector.tsx` — Main component with tabbed layout
  - `DropZone.tsx` — File drag-and-drop area
  - `SourceSearch.tsx` — Search UI for any `GtfsSource`
- **`src/style.css`** — Default styles (opt-out via `styled={false}`)
- **`src/index.ts`** — Library entry point

## Commands

- `npm test` — Run all tests (Vitest + React Testing Library + jsdom)
- `npm run build` — Type-check and build ESM + CJS output to `dist/`
- `npm run lint` — TypeScript type-checking only

## Key design decisions

- **Source plugin pattern**: Any online GTFS provider implements `GtfsSource` interface. This keeps the component extensible without modifying core code.
- **Sync vs async search**: Sources can use the default `fetchDatasets()` + `search()` pattern (fetch all upfront, filter locally) or provide an optional `asyncSearch(query)` method for server-side search with debouncing. The `SourceSearch` component handles both automatically.
- **Single callback**: `onSelect` receives a discriminated union (`type: 'file' | 'url'`) so consumers handle both cases in one place.
- **CSS opt-out**: Default styles ship with the component via `react-gtfs-selector/style.css`. All classes prefixed `rgs-`. Pass `styled={false}` to disable class names entirely.
- **transport.data.gouv.fr caching**: Datasets cached in localStorage for 24h to avoid repeated API calls.
- **Mobility Database**: Uses `createMobilityDataSource({ apiToken })` factory. Requires a Bearer token from `mobilitydatabase.org`. The default `mobilityData` export is unavailable; pass a configured instance via the `sources` prop.

## Testing

Tests are in `*.test.tsx` / `*.test.ts` files colocated with source. Uses Vitest with jsdom environment. The test setup polyfills `scrollIntoView` for jsdom compatibility.

## Changelog

Every user-facing change (feature, fix, breaking change) must be documented in `CHANGELOG.md` under the `[Unreleased]` section, following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## Release process

npm publication is triggered automatically when a GitHub release is created. Do not publish manually.
