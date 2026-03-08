import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mobilityData, createMobilityDataSource } from './mobility-data';

const mockApiResponse = {
  total: 3,
  results: [
    {
      id: 'mdb-100',
      data_type: 'gtfs',
      provider: 'Paris Metro',
      feed_name: 'Bus',
      status: 'active',
      source_info: { producer_url: 'https://example.com/paris-bus.zip' },
      locations: [
        { country_code: 'FR', country: 'France', subdivision_name: 'Île-de-France', municipality: 'Paris' },
      ],
      latest_dataset: { id: 'ds-1', hosted_url: 'https://hosted.example.com/paris-bus.zip' },
    },
    {
      id: 'mdb-200',
      data_type: 'gtfs_rt',
      provider: 'Lyon Transit',
      status: 'active',
      source_info: { producer_url: 'https://example.com/lyon-rt' },
      locations: [{ country_code: 'FR', country: 'France', subdivision_name: 'Auvergne-Rhône-Alpes' }],
      latest_dataset: null,
    },
    {
      id: 'mdb-300',
      data_type: 'gtfs',
      provider: 'No URL Transit',
      status: 'active',
      source_info: {},
      locations: [],
      latest_dataset: null,
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('mobilityData (default instance)', () => {
  it('is unavailable by default', () => {
    expect(mobilityData.id).toBe('mobility-data');
    expect(mobilityData.available).toBe(false);
  });

  it('fetchDatasets returns empty', async () => {
    expect(await mobilityData.fetchDatasets()).toEqual([]);
  });

  it('search returns empty', () => {
    expect(mobilityData.search([], 'test')).toEqual([]);
  });
});

describe('createMobilityDataSource', () => {
  it('creates an available source with asyncSearch', () => {
    const source = createMobilityDataSource({ apiToken: 'test-token' });
    expect(source.id).toBe('mobility-data');
    expect(source.available).toBe(true);
    expect(source.asyncSearch).toBeDefined();
  });

  it('asyncSearch calls the API with correct params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'my-token' });
    await source.asyncSearch!('Paris');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/v1/search?');
    expect(String(url)).toContain('search_query=Paris');
    expect(String(url)).toContain('data_type=gtfs');
    expect(String(url)).toContain('limit=30');
    expect((init as RequestInit).headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer my-token' }),
    );
  });

  it('asyncSearch maps results correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'test' });
    const results = await source.asyncSearch!('Paris');

    // mdb-300 has no URL, so it's filtered out
    expect(results).toHaveLength(2);

    expect(results[0]).toEqual({
      id: 'mdb-100',
      title: 'Paris Metro — Bus',
      url: 'https://hosted.example.com/paris-bus.zip',
      area: 'Paris, Île-de-France, France',
      extra: { status: 'active', data_type: 'gtfs' },
    });

    expect(results[1]).toEqual({
      id: 'mdb-200',
      title: 'Lyon Transit',
      url: 'https://example.com/lyon-rt',
      area: 'Auvergne-Rhône-Alpes, France',
      extra: { status: 'active', data_type: 'gtfs_rt' },
    });
  });

  it('asyncSearch returns empty for short queries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const source = createMobilityDataSource({ apiToken: 'test' });
    const results = await source.asyncSearch!('P');

    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('asyncSearch throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'bad-token' });
    await expect(source.asyncSearch!('Paris')).rejects.toThrow('HTTP 401');
  });

  it('prefers hosted_url over producer_url', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total: 1,
          results: [
            {
              id: 'mdb-1',
              data_type: 'gtfs',
              provider: 'Test',
              status: 'active',
              source_info: { producer_url: 'https://producer.com/feed.zip' },
              latest_dataset: { hosted_url: 'https://hosted.com/feed.zip' },
              locations: [],
            },
          ],
        }),
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'test' });
    const results = await source.asyncSearch!('Test');

    expect(results[0].url).toBe('https://hosted.com/feed.zip');
  });

  it('falls back to producer_url when no hosted_url', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total: 1,
          results: [
            {
              id: 'mdb-2',
              data_type: 'gtfs',
              provider: 'Test',
              status: 'active',
              source_info: { producer_url: 'https://producer.com/feed.zip' },
              latest_dataset: null,
              locations: [],
            },
          ],
        }),
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'test' });
    const results = await source.asyncSearch!('Test');

    expect(results[0].url).toBe('https://producer.com/feed.zip');
  });

  it('handles empty feed_name gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total: 1,
          results: [
            {
              id: 'mdb-3',
              data_type: 'gtfs',
              provider: 'Some Provider',
              feed_name: '',
              status: 'active',
              source_info: { producer_url: 'https://example.com/feed.zip' },
              locations: [],
            },
          ],
        }),
    } as Response);

    const source = createMobilityDataSource({ apiToken: 'test' });
    const results = await source.asyncSearch!('Some');

    // Empty feed_name should not appear in title
    expect(results[0].title).toBe('Some Provider');
  });
});
