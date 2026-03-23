import type { GtfsSource, GtfsSearchResult, GtfsTab } from '../types';
import { createSourceTab } from '../tabs';

const API_BASE = 'https://api.mobilitydatabase.org/v1';

interface MobilityDataSearchResult {
  id: string;
  data_type: string;
  provider: string;
  feed_name?: string | null;
  status: string;
  source_info?: {
    producer_url?: string;
    license_url?: string;
  };
  locations?: {
    country_code?: string;
    country?: string;
    subdivision_name?: string | null;
    municipality?: string | null;
  }[];
  latest_dataset?: {
    id?: string;
    hosted_url?: string;
  } | null;
}

interface MobilityDataSearchResponse {
  total: number;
  results: MobilityDataSearchResult[];
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
    if (loc.country) locationParts.push(loc.country);
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

export function createMobilityDataRawSource(options: MobilityDataSourceOptions): GtfsSource {
  return {
    id: 'mobility-data',
    label: 'Mobility Database (API)',
    available: true,

    async fetchDatasets(): Promise<GtfsSearchResult[]> {
      return [];
    },

    search(_datasets: GtfsSearchResult[], _query: string): GtfsSearchResult[] {
      return [];
    },

    async asyncSearch(query: string): Promise<GtfsSearchResult[]> {
      if (query.length < 2) return [];

      const params = new URLSearchParams({
        search_query: query,
        data_type: 'gtfs',
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

      const data: MobilityDataSearchResponse = await res.json();
      const results: GtfsSearchResult[] = [];
      for (const item of data.results) {
        const result = toSearchResult(item);
        if (result) results.push(result);
      }
      return results;
    },
  };
}

export function createMobilityDataSource(options: MobilityDataSourceOptions): GtfsTab {
  return createSourceTab(createMobilityDataRawSource(options));
}

export const mobilityDataSource: GtfsSource = {
  id: 'mobility-data',
  label: 'Mobility Database (API)',
  available: false,

  async fetchDatasets(): Promise<GtfsSearchResult[]> {
    return [];
  },

  search(_datasets: GtfsSearchResult[], _query: string): GtfsSearchResult[] {
    return [];
  },
};

/** Default instance (unavailable — needs an API token). */
export const mobilityData: GtfsTab = createSourceTab(mobilityDataSource);
