import type { ComponentType } from 'react';

/** Result passed to the onSelect callback */
export type GtfsSelectionResult =
  | { type: 'file'; blob: Blob; fileName: string }
  | { type: 'url'; url: string; title: string; gtfsRtUrls?: string[] };

/** Props passed to every tab component */
export interface GtfsTabComponentProps {
  onSelect: (result: GtfsSelectionResult) => void;
  styled: boolean;
}

/** A tab in the GtfsSelector — every tab has an id, label, and component */
export interface GtfsTab {
  id: string;
  label: string;
  component: ComponentType<GtfsTabComponentProps>;
}

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
  /** Message shown when the source is unavailable (defaults to "Unavailable") */
  unavailableMessage?: string;
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
