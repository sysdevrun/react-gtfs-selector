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
import { GtfsSelector } from 'react-gtfs-selector';
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
    />
  );
}
```

The component shows a **tabbed interface**:

1. **Import file** — drag & drop or click to browse for a GTFS `.zip` file
2. **transport.data.gouv.fr** — search French public transit GTFS feeds
3. **Mobility Data** — placeholder for future Mobility Database integration

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelect` | `(result: GtfsSelectionResult) => void` | *required* | Callback when a source is selected |
| `sources` | `GtfsSource[]` | built-in sources | Custom source list (pass `[]` to disable online search) |
| `styled` | `boolean` | `true` | Set to `false` to disable default CSS class names |
| `className` | `string` | — | Additional CSS class on the root element |

## Callback result

```ts
type GtfsSelectionResult =
  | { type: 'file'; blob: Blob; fileName: string }
  | { type: 'url'; url: string; title: string; gtfsRtUrls?: string[] };
```

## Custom sources

You can implement the `GtfsSource` interface to add your own GTFS feed providers:

```ts
import type { GtfsSource } from 'react-gtfs-selector';

const mySource: GtfsSource = {
  id: 'my-source',
  label: 'My GTFS Provider',
  available: true,
  async fetchDatasets() { /* ... */ },
  search(datasets, query) { /* ... */ },
};

<GtfsSelector onSelect={handleSelect} sources={[mySource]} />
```

## Styling

Import `react-gtfs-selector/style.css` for default styles. All CSS classes are prefixed with `rgs-`. Pass `styled={false}` to opt out entirely and provide your own styles.

## Development

```bash
npm install
npm test        # run tests
npm run build   # build the library
```

## License

MIT — Théophile Helleboid <contact@sys-dev-run.fr>
