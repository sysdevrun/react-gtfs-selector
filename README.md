# react-gtfs-selector

[![npm](https://img.shields.io/npm/v/react-gtfs-selector)](https://www.npmjs.com/package/react-gtfs-selector)

A React component that lets users select a GTFS data source, either by dragging and dropping a local `.zip` file or by searching online GTFS feeds.

**[Live demo](https://sysdevrun.github.io/react-gtfs-selector/)**

| Import file | Online search |
|:-----------:|:-------------:|
| ![Import file tab](docs/images/import-file-tab.png) | ![Search tab](docs/images/search-tab.png) |

## Install

```bash
npm install react-gtfs-selector
```

## Usage

```tsx
import { GtfsSelector, fileTab, urlTab, mobilityDataCsv, transportDataGouvFr } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css'; // optional — bundled default styles

function App() {
  return (
    <GtfsSelector
      onSelect={(result) => {
        if (result.type === 'file') {
          console.log('Got file:', result.fileName, result.blob);
        } else {
          console.log('Got URL:', result.title, result.url);
        }
      }}
      tabs={[mobilityDataCsv, transportDataGouvFr, fileTab, urlTab]}
    />
  );
}
```

The `tabs` prop controls exactly which tabs appear and in what order. Each entry is a `GtfsTab` object with `id`, `label`, and `component`.

### Built-in tabs

- **`fileTab`** — drag & drop or click to browse for a GTFS `.zip` file
- **`urlTab`** — paste a direct GTFS feed URL
- **`mobilityDataCsv`** — search the Mobility Database (CSV, no token needed)
- **`transportDataGouvFr`** — search French public transit feeds
- **`mobilityData`** — Mobility Database API (unavailable by default, needs token)

### Examples

```tsx
// Only file import and URL input
<GtfsSelector onSelect={handleSelect} tabs={[fileTab, urlTab]} />

// Only Mobility Database search
<GtfsSelector onSelect={handleSelect} tabs={[mobilityDataCsv]} />

// Custom order: sources first, then file, then URL
<GtfsSelector onSelect={handleSelect} tabs={[mobilityDataCsv, transportDataGouvFr, fileTab, urlTab]} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelect` | `(result: GtfsSelectionResult) => void` | *required* | Callback when a source is selected |
| `tabs` | `GtfsTab[]` | *required* | Ordered list of tabs to display |
| `styled` | `boolean` | `true` | Set to `false` to disable default CSS class names |
| `className` | `string` | — | Additional CSS class on the root element |

## Callback result

```ts
type GtfsSelectionResult =
  | { type: 'file'; blob: Blob; fileName: string }
  | { type: 'url'; url: string; title: string; gtfsRtUrls?: string[] };
```

## [transport.data.gouv.fr](https://transport.data.gouv.fr) source

French public transit GTFS feeds. Datasets are cached in localStorage for 24h.

```tsx
import { GtfsSelector, transportDataGouvFr, fileTab } from 'react-gtfs-selector';

<GtfsSelector onSelect={handleSelect} tabs={[transportDataGouvFr, fileTab]} />
```

## Mobility Database sources

The CSV source works out of the box with no configuration:

```tsx
import { GtfsSelector, mobilityDataCsv, fileTab } from 'react-gtfs-selector';

<GtfsSelector onSelect={handleSelect} tabs={[mobilityDataCsv, fileTab]} />
```

To use the API source, pass a configured instance with your token:

```tsx
import { GtfsSelector, createMobilityDataSource, fileTab } from 'react-gtfs-selector';

const mobilityApi = createMobilityDataSource({ apiToken: 'your-token' });

<GtfsSelector onSelect={handleSelect} tabs={[mobilityApi, fileTab]} />
```

## Custom sources

Implement the `GtfsSource` interface and wrap it with `createSourceTab`:

```ts
import { createSourceTab, fileTab } from 'react-gtfs-selector';
import type { GtfsSource } from 'react-gtfs-selector';

const mySource: GtfsSource = {
  id: 'my-source',
  label: 'My GTFS Provider',
  available: true,
  async fetchDatasets() { /* ... */ },
  search(datasets, query) { /* ... */ },
};

const myTab = createSourceTab(mySource);

<GtfsSelector onSelect={handleSelect} tabs={[myTab, fileTab]} />
```

## Loading GTFS data

Once the user selects a source, use [`gtfs-sqljs`](https://www.npmjs.com/package/gtfs-sqljs) to load and query the GTFS data:

```tsx
import { GtfsSelector, fileTab, urlTab } from 'react-gtfs-selector';
import { GtfsSqlJs } from 'gtfs-sqljs';
import type { GtfsSelectionResult } from 'react-gtfs-selector';

function App() {
  const handleSelect = async (result: GtfsSelectionResult) => {
    let gtfs: GtfsSqlJs;

    if (result.type === 'url') {
      gtfs = await GtfsSqlJs.fromZip(result.url);
    } else {
      const data = await result.blob.arrayBuffer();
      gtfs = await GtfsSqlJs.fromZipData(data);
    }

    const routes = gtfs.getRoutes();
    console.log('Routes:', routes);

    gtfs.close();
  };

  return <GtfsSelector onSelect={handleSelect} tabs={[fileTab, urlTab]} />;
}
```

## Styling

Import `react-gtfs-selector/style.css` for default styles. All CSS classes are prefixed with `rgs-`. Pass `styled={false}` to opt out entirely and provide your own styles.

## Claude Code integration

This project includes a [Claude Code skill file](.claude/skills/react-gtfs-selector/SKILL.md) that provides Claude with detailed knowledge of the component API, source plugin pattern, and styling options. When working in a project that uses `react-gtfs-selector`, Claude Code will automatically suggest and guide integration.

## Development

```bash
npm install
npm test        # run tests
npm run build   # build the library
```

## License

MIT — Théophile Helleboid <contact@sys-dev-run.fr>
