import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transportDataGouvFr } from './transport-data-gouv-fr';

const mockApiResponse = [
  {
    id: 'dataset-1',
    title: 'SNCF TER',
    type: 'public-transit',
    resources: [
      { format: 'GTFS', original_url: 'https://example.com/sncf.zip', url: 'https://fallback.com/sncf.zip' },
      { format: 'GTFS-RT', original_url: 'https://example.com/sncf-rt', url: '', features: ['vehicle_positions'] },
    ],
    offers: [{ nom_commercial: 'TER' }],
    covered_area: [{ nom: 'Île-de-France' }],
  },
  {
    id: 'dataset-2',
    title: 'Bus Data',
    type: 'public-transit',
    resources: [{ format: 'GTFS', original_url: '', url: 'https://example.com/bus.zip' }],
    offers: [],
    covered_area: [],
  },
  {
    id: 'dataset-3',
    title: 'Bike Sharing',
    type: 'bike-sharing',
    resources: [{ format: 'GBFS', original_url: '', url: '' }],
    offers: [],
    covered_area: [],
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('transportDataGouvFr', () => {
  it('has correct metadata', () => {
    expect(transportDataGouvFr.id).toBe('transport-data-gouv-fr');
    expect(transportDataGouvFr.available).toBe(true);
  });

  it('fetchDatasets filters for public-transit GTFS', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const results = await transportDataGouvFr.fetchDatasets();

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('dataset-1');
    expect(results[0].url).toBe('https://example.com/sncf.zip');
    expect(results[0].gtfsRtUrls).toEqual(['https://example.com/sncf-rt']);
    expect(results[1].id).toBe('dataset-2');
    expect(results[1].url).toBe('https://example.com/bus.zip');
  });

  it('uses cached data when available', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const cached = {
      ts: Date.now(),
      data: [{ id: 'cached', title: 'Cached', url: 'https://cached.com/gtfs.zip' }],
    };
    localStorage.setItem('react-gtfs-selector:transport-data-gouv-fr', JSON.stringify(cached));

    const results = await transportDataGouvFr.fetchDatasets();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cached');
  });

  it('search filters by title, area, and commercial name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const datasets = await transportDataGouvFr.fetchDatasets();

    expect(transportDataGouvFr.search(datasets, 'SN')).toHaveLength(1);
    expect(transportDataGouvFr.search(datasets, 'île')).toHaveLength(1);
    expect(transportDataGouvFr.search(datasets, 'TER')).toHaveLength(1);
    expect(transportDataGouvFr.search(datasets, 'x')).toHaveLength(0); // too short
  });
});
