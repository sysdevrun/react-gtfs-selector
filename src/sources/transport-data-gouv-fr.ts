import type { GtfsSource, GtfsSearchResult, GtfsTab } from '../types';
import { createSourceTab } from '../tabs';

interface Dataset {
  id: string;
  title: string;
  type: string;
  resources: { format: string; original_url: string; url: string; features?: string[] }[];
  offers: { nom_commercial?: string; nom_aom?: string }[];
  covered_area: { nom?: string }[];
}

const CACHE_KEY = 'react-gtfs-selector:transport-data-gouv-fr';
const ONE_DAY = 24 * 60 * 60 * 1000;
const API_URL = 'https://transport.data.gouv.fr/api/datasets';

function toSearchResult(d: Dataset): GtfsSearchResult | null {
  const gtfsResource = d.resources.find((r) => r.format === 'GTFS');
  if (!gtfsResource) return null;

  const gtfsRtUrls = d.resources
    .filter((r) => r.format.toLowerCase() === 'gtfs-rt')
    .map((r) => r.original_url || r.url);

  return {
    id: d.id,
    title: d.title,
    url: gtfsResource.original_url || gtfsResource.url,
    area: d.covered_area?.[0]?.nom,
    gtfsRtUrls: gtfsRtUrls.length > 0 ? gtfsRtUrls : undefined,
    extra: {
      offers: d.offers,
    },
  };
}

export const transportDataGouvFrSource: GtfsSource = {
  id: 'transport-data-gouv-fr',
  label: 'transport.data.gouv.fr',
  available: true,

  async fetchDatasets(): Promise<GtfsSearchResult[]> {
    // Check localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < ONE_DAY) {
          return data;
        }
      }
    } catch {
      /* ignore corrupt cache */
    }

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: Dataset[] = await res.json();

    const results: GtfsSearchResult[] = [];
    for (const d of raw) {
      if (d.type !== 'public-transit') continue;
      const result = toSearchResult(d);
      if (result) results.push(result);
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: results }));
    } catch {
      /* storage full */
    }

    return results;
  },

  search(datasets: GtfsSearchResult[], query: string): GtfsSearchResult[] {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const results: GtfsSearchResult[] = [];
    for (const d of datasets) {
      const offers = (d.extra?.offers ?? []) as { nom_commercial?: string; nom_aom?: string }[];
      if (
        d.title.toLowerCase().includes(q) ||
        offers.some((o) => o.nom_commercial?.toLowerCase().includes(q)) ||
        d.area?.toLowerCase().includes(q)
      ) {
        results.push(d);
      }
      if (results.length >= 30) break;
    }
    return results;
  },
};

export const transportDataGouvFr: GtfsTab = createSourceTab(transportDataGouvFrSource);
