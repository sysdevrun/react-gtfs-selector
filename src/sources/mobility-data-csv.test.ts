import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mobilityDataCsv } from './mobility-data-csv';

const CSV_HEADER =
  'id,data_type,entity_type,location.country_code,location.subdivision_name,location.municipality,provider,is_official,name,note,feed_contact_email,static_reference,urls.direct_download,urls.authentication_type,urls.authentication_info,urls.api_key_parameter_name,urls.latest,urls.license,location.bounding_box.minimum_latitude,location.bounding_box.maximum_latitude,location.bounding_box.minimum_longitude,location.bounding_box.maximum_longitude,location.bounding_box.extracted_on,status,features,redirect.id,redirect.comment';

function makeCsv(rows: string[]): string {
  return [CSV_HEADER, ...rows].join('\n');
}

const GTFS_ROW =
  'mdb-100,gtfs,,FR,Île-de-France,Paris,Paris Metro,True,Bus Network,,,,https://example.com/paris.zip,0,,,https://files.example.com/mdb-100/latest.zip,,48.8,48.9,2.3,2.4,2026-01-01,active,Shapes,,';

const GTFS_RT_ROW =
  'mdb-200,gtfs_rt,"sa|tu|vp",FR,Île-de-France,,Paris Metro,True,Realtime,,,mdb-100,https://example.com/paris-rt,0,,,,,,,,,,,,';

const GTFS_NO_URL =
  'mdb-300,gtfs,,US,California,Los Angeles,LA Transit,False,,,,,,,,,,,,,,,,,,,';

const GTFS_DEPRECATED =
  'mdb-400,gtfs,,DE,,Berlin,BVG,True,Berlin Transit,,,,https://example.com/bvg.zip,0,,,https://files.example.com/mdb-400/latest.zip,,,,,,,deprecated,,,';

const GTFS_AUTH_REQUIRED =
  'mdb-500,gtfs,,GB,,London,TfL,True,London Buses,,,,https://example.com/tfl.zip,1,https://tfl.gov.uk/api,api_key,https://files.example.com/mdb-500/latest.zip,,,,,,,active,,,';

const GTFS_NO_NAME =
  'mdb-600,gtfs,,JP,Tokyo,,Tokyo Metro,True,,,,,https://example.com/tokyo.zip,0,,,https://files.example.com/mdb-600/latest.zip,,,,,,,active,,,';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('mobilityDataCsv', () => {
  it('has correct metadata', () => {
    expect(mobilityDataCsv.id).toBe('mobility-data-csv');
    expect(mobilityDataCsv.label).toBe('Mobility Database');
    expect(mobilityDataCsv.available).toBe(true);
    expect(mobilityDataCsv.asyncSearch).toBeUndefined();
  });

  it('fetchDatasets parses CSV and returns GTFS results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_ROW, GTFS_RT_ROW])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 'mdb-100',
      title: 'Paris Metro — Bus Network',
      url: 'https://files.example.com/mdb-100/latest.zip',
      area: 'Paris, Île-de-France, FR',
      gtfsRtUrls: ['https://example.com/paris-rt'],
      extra: {
        countryCode: 'FR',
        isOfficial: true,
        features: 'Shapes',
      },
    });
  });

  it('filters out rows without a download URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_NO_URL])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results).toHaveLength(0);
  });

  it('filters out deprecated feeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_DEPRECATED])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results).toHaveLength(0);
  });

  it('filters out feeds requiring authentication', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_AUTH_REQUIRED])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results).toHaveLength(0);
  });

  it('uses provider as title when name is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_NO_NAME])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Tokyo Metro');
  });

  it('prefers urls.latest over urls.direct_download', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_ROW])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results[0].url).toBe('https://files.example.com/mdb-100/latest.zip');
  });

  it('falls back to urls.direct_download when urls.latest is empty', async () => {
    const row =
      'mdb-700,gtfs,,FR,,,Test Provider,True,Test Feed,,,,https://example.com/direct.zip,0,,,,,,,,,,active,,,';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([row])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results[0].url).toBe('https://example.com/direct.zip');
  });

  it('uses cached data when available', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const cached = {
      ts: Date.now(),
      data: [{ id: 'cached', title: 'Cached', url: 'https://cached.com/gtfs.zip' }],
    };
    localStorage.setItem('react-gtfs-selector:mobility-data-csv', JSON.stringify(cached));

    const results = await mobilityDataCsv.fetchDatasets();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cached');
  });

  it('ignores expired cache', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_ROW])),
    } as Response);
    const cached = {
      ts: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      data: [{ id: 'old', title: 'Old', url: 'https://old.com/gtfs.zip' }],
    };
    localStorage.setItem('react-gtfs-selector:mobility-data-csv', JSON.stringify(cached));

    const results = await mobilityDataCsv.fetchDatasets();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(results[0].id).toBe('mdb-100');
  });

  it('throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(mobilityDataCsv.fetchDatasets()).rejects.toThrow('HTTP 500');
  });

  it('links GTFS-RT feeds via static_reference', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeCsv([GTFS_ROW, GTFS_RT_ROW])),
    } as Response);

    const results = await mobilityDataCsv.fetchDatasets();
    expect(results[0].gtfsRtUrls).toEqual(['https://example.com/paris-rt']);
  });

  describe('search', () => {
    const datasets = [
      { id: '1', title: 'Paris Metro — Bus', url: 'https://a.com', area: 'Paris, FR' },
      { id: '2', title: 'London Transport', url: 'https://b.com', area: 'London, GB' },
      { id: '3', title: 'Berlin BVG', url: 'https://c.com', area: 'Berlin, DE' },
    ];

    it('returns empty for short queries', () => {
      expect(mobilityDataCsv.search(datasets, 'P')).toHaveLength(0);
    });

    it('searches by title', () => {
      const results = mobilityDataCsv.search(datasets, 'Paris');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('searches by area', () => {
      const results = mobilityDataCsv.search(datasets, 'London');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('is case insensitive', () => {
      expect(mobilityDataCsv.search(datasets, 'berlin')).toHaveLength(1);
    });

    it('limits results to 30', () => {
      const many = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        title: `Feed ${i}`,
        url: `https://example.com/${i}`,
      }));
      const results = mobilityDataCsv.search(many, 'Feed');
      expect(results).toHaveLength(30);
    });
  });
});
