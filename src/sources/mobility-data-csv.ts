import Papa from 'papaparse';
import type { GtfsSource, GtfsSearchResult } from '../types';

const CSV_URL = 'https://files.mobilitydatabase.org/feeds_v2.csv';
const CACHE_KEY = 'react-gtfs-selector:mobility-data-csv';
const ONE_DAY = 24 * 60 * 60 * 1000;

/** Raw row from feeds_v2.csv */
interface CsvRow {
  id: string;
  data_type: string;
  entity_type: string;
  'location.country_code': string;
  'location.subdivision_name': string;
  'location.municipality': string;
  provider: string;
  is_official: string;
  name: string;
  note: string;
  feed_contact_email: string;
  static_reference: string;
  'urls.direct_download': string;
  'urls.authentication_type': string;
  'urls.authentication_info': string;
  'urls.api_key_parameter_name': string;
  'urls.latest': string;
  'urls.license': string;
  'location.bounding_box.minimum_latitude': string;
  'location.bounding_box.maximum_latitude': string;
  'location.bounding_box.minimum_longitude': string;
  'location.bounding_box.maximum_longitude': string;
  'location.bounding_box.extracted_on': string;
  status: string;
  features: string;
  'redirect.id': string;
  'redirect.comment': string;
}

function parseCsv(text: string): CsvRow[] {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}

function buildResults(rows: CsvRow[]): GtfsSearchResult[] {
  // Index GTFS-RT rows by their static_reference for linking
  const rtByStaticRef = new Map<string, string[]>();
  for (const row of rows) {
    if (row.data_type !== 'gtfs_rt') continue;
    if (!row.static_reference) continue;
    const refs = row.static_reference.split('|');
    for (const ref of refs) {
      const trimmed = ref.trim();
      if (!trimmed) continue;
      const urls = rtByStaticRef.get(trimmed) ?? [];
      const rtUrl = row['urls.direct_download'];
      if (rtUrl) urls.push(rtUrl);
      rtByStaticRef.set(trimmed, urls);
    }
  }

  const results: GtfsSearchResult[] = [];
  for (const row of rows) {
    if (row.data_type !== 'gtfs') continue;
    if (row.status === 'deprecated' || row.status === 'inactive') continue;

    const url = row['urls.latest'] || row['urls.direct_download'];
    if (!url) continue;

    // Require no authentication (type 0 or empty)
    const authType = row['urls.authentication_type'];
    if (authType && authType !== '0') continue;

    const locationParts: string[] = [];
    if (row['location.municipality']) locationParts.push(row['location.municipality']);
    if (row['location.subdivision_name']) locationParts.push(row['location.subdivision_name']);
    if (row['location.country_code']) locationParts.push(row['location.country_code']);

    const title = row.name
      ? `${row.provider} — ${row.name}`
      : row.provider;

    const gtfsRtUrls = rtByStaticRef.get(row.id);

    results.push({
      id: row.id,
      title,
      url,
      area: locationParts.length > 0 ? locationParts.join(', ') : undefined,
      gtfsRtUrls: gtfsRtUrls && gtfsRtUrls.length > 0 ? gtfsRtUrls : undefined,
      extra: {
        countryCode: row['location.country_code'],
        isOfficial: row.is_official === 'True',
        features: row.features || undefined,
      },
    });
  }

  return results;
}

export const mobilityDataCsv: GtfsSource = {
  id: 'mobility-data-csv',
  label: 'Mobility Database',
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

    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const rows = parseCsv(text);
    const results = buildResults(rows);

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
      if (
        d.title.toLowerCase().includes(q) ||
        d.area?.toLowerCase().includes(q)
      ) {
        results.push(d);
      }
      if (results.length >= 30) break;
    }
    return results;
  },
};
