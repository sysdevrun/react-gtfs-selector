/** Result passed to the onSelect callback */
export type GtfsSelectionResult =
  | { type: 'file'; blob: Blob; fileName: string }
  | { type: 'url'; url: string; title: string; gtfsRtUrls?: string[] };

/** A single search result shown in the dropdown */
export interface GtfsSearchResult {
  id: string;
  title: string;
  url: string;
  area?: string;
  gtfsRtUrls?: string[];
  extra?: Record<string, unknown>;
}

/** Interface that each GTFS source must implement */
export interface GtfsSource {
  /** Unique identifier for this source */
  id: string;
  /** Human-readable label shown in the tab */
  label: string;
  /** Whether this source is ready to use */
  available: boolean;
  /** Fetch all datasets (may use caching internally) */
  fetchDatasets(): Promise<GtfsSearchResult[]>;
  /** Filter datasets by query string */
  search(datasets: GtfsSearchResult[], query: string): GtfsSearchResult[];
  /**
   * Optional server-side search. When provided, SourceSearch will use this
   * instead of fetchDatasets + search for a debounced async search experience.
   */
  asyncSearch?(query: string): Promise<GtfsSearchResult[]>;
}
