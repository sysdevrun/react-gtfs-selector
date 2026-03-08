import type { GtfsSource, GtfsSearchResult } from '../types';

const API_BASE = 'https://api.mobilitydatabase.org/v1';

interface MobilityDataSearchResult {
  id: string;
  data_type: string;
  provider: string;
  feed_name?: string;
  status: string;
  source_info?: {
    producer_url?: string;
    license_url?: string;
  };
  locations?: { country_code?: string; subdivision_name?: string; municipality?: string }[];
  latest_dataset?: {
    id?: string;
    hosted_url?: string;
  };
}

export interface MobilityDataSourceOptions {
  /** Bearer token for the Mobility Database API */
  apiToken: string;
}

function toSearchResult(item: MobilityDataSearchResult): GtfsSearchResult | null {
  const url =
    item.latest_dataset?.hosted_url ||
    item.source_info?.producer_url;
  if (!url) return null;

  const locationParts: string[] = [];
  if (item.locations?.length) {
    const loc = item.locations[0];
    if (loc.municipality) locationParts.push(loc.municipality);
    if (loc.subdivision_name) locationParts.push(loc.subdivision_name);
    if (loc.country_code) locationParts.push(loc.country_code);
  }

  const title = item.feed_name
    ? `${item.provider} — ${item.feed_name}`
    : item.provider;

  return {
    id: item.id,
    title,
    url,
    area: locationParts.length > 0 ? locationParts.join(', ') : undefined,
    extra: {
      status: item.status,
      data_type: item.data_type,
    },
  };
}

export function createMobilityDataSource(options: MobilityDataSourceOptions): GtfsSource {
  return {
    id: 'mobility-data',
    label: 'Mobility Database',
    available: true,

    async fetchDatasets(): Promise<GtfsSearchResult[]> {
      // Server-side search source — no upfront dataset fetch needed
      return [];
    },

    search(_datasets: GtfsSearchResult[], _query: string): GtfsSearchResult[] {
      // Server-side search source — local filtering not used
      return [];
    },

    async asyncSearch(query: string): Promise<GtfsSearchResult[]> {
      if (query.length < 2) return [];

      const params = new URLSearchParams({
        search_query: query,
        data_type: 'gtfs,gtfs_rt',
        limit: '30',
        offset: '0',
      });

      const res = await fetch(`${API_BASE}/search?${params}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.apiToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Mobility Database API error: HTTP ${res.status}`);
      }

      const raw: MobilityDataSearchResult[] = await res.json();
      const results: GtfsSearchResult[] = [];
      for (const item of raw) {
        const result = toSearchResult(item);
        if (result) results.push(result);
      }
      return results;
    },
  };
}

/** Default instance (unavailable — needs an API token). */
export const mobilityData: GtfsSource = {
  id: 'mobility-data',
  label: 'Mobility Database',
  available: false,

  async fetchDatasets(): Promise<GtfsSearchResult[]> {
    return [];
  },

  search(_datasets: GtfsSearchResult[], _query: string): GtfsSearchResult[] {
    return [];
  },
};
