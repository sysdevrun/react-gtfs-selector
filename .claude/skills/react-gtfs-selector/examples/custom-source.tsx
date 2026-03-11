import { GtfsSelector } from 'react-gtfs-selector';
import type { GtfsSource, GtfsSearchResult } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';

// --- Sync source: fetch all datasets upfront, filter locally ---

const myLocalSource: GtfsSource = {
  id: 'my-local-source',
  label: 'My Agency Feeds',
  available: true,

  async fetchDatasets(): Promise<GtfsSearchResult[]> {
    const res = await fetch('https://api.example.com/gtfs-feeds');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Array<{ id: string; name: string; url: string; region: string }> =
      await res.json();

    return data.map((feed) => ({
      id: feed.id,
      title: feed.name,
      url: feed.url,
      area: feed.region,
    }));
  },

  search(datasets: GtfsSearchResult[], query: string): GtfsSearchResult[] {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return datasets
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.area?.toLowerCase().includes(q),
      )
      .slice(0, 30);
  },
};

// --- Async source: server-side search with debouncing ---

const myApiSource: GtfsSource = {
  id: 'my-api-source',
  label: 'Transit Search API',
  available: true,

  // Required by the interface but unused for async sources
  async fetchDatasets() {
    return [];
  },
  search() {
    return [];
  },

  // SourceSearch uses this instead of fetchDatasets+search when present.
  // Automatically debounced at 300ms; triggers after 2+ characters typed.
  async asyncSearch(query: string): Promise<GtfsSearchResult[]> {
    if (query.length < 2) return [];

    const res = await fetch(
      `https://api.example.com/search?q=${encodeURIComponent(query)}&type=gtfs`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return data.results.map(
      (item: { id: string; name: string; downloadUrl: string; city: string }) => ({
        id: item.id,
        title: item.name,
        url: item.downloadUrl,
        area: item.city,
      }),
    );
  },
};

// --- Usage ---

function App() {
  return (
    <GtfsSelector
      onSelect={(result) => console.log('Selected:', result)}
      sources={[myLocalSource, myApiSource]}
    />
  );
}

export default App;
