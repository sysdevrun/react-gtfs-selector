import type { GtfsSource, GtfsSearchResult } from '../types';

export const mobilityData: GtfsSource = {
  id: 'mobility-data',
  label: 'Mobility Data',
  available: false,

  async fetchDatasets(): Promise<GtfsSearchResult[]> {
    // TODO: Implement Mobility Database API integration
    // See https://database.mobilitydata.org/
    return [];
  },

  search(_datasets: GtfsSearchResult[], _query: string): GtfsSearchResult[] {
    return [];
  },
};
