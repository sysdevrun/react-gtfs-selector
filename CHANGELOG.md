# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-03-09

### Added

- `mobilityDataCsv` source using the public CORS-enabled CSV from `files.mobilitydatabase.org`, no API token required
- CSV parsing via papaparse with localStorage caching (24h)

### Changed

- Renamed API-based Mobility Database tab to "Mobility Database (API)" for clarity

### Fixed

- CSS file not found when importing `react-gtfs-selector/style.css` (build output was named `index.css` instead of `style.css`)
- Dropdown menu clipped by `overflow: hidden` on `.rgs-selector` container

## [0.1.0] - 2025-03-08

### Added

- `GtfsSelector` component with tabbed layout for file import and online search
- `DropZone` component for drag-and-drop GTFS file import
- `SourceSearch` component supporting both sync and async search modes
- Source plugin pattern via `GtfsSource` interface
- `transport.data.gouv.fr` source with localStorage caching (24h)
- `Mobility Database` source with server-side search (`api.mobilitydatabase.org/v1/search`)
- Default CSS styles with `rgs-` prefix and opt-out via `styled={false}`
- Single `onSelect` callback with discriminated union (`type: 'file' | 'url'`)
- "Unavailable" state for disabled sources
- "Waiting for token" state for Mobility Database when no token is set
