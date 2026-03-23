import * as Comlink from 'comlink';
import { GtfsSqlJs } from 'gtfs-sqljs';
import type { Route, Agency } from 'gtfs-sqljs';

export type LoadInput =
  | { type: 'url'; url: string }
  | { type: 'data'; data: ArrayBuffer };

let gtfs: GtfsSqlJs | null = null;

const workerApi = {
  async loadFromZip(
    input: LoadInput,
    locateFile: string,
    progressCallback?: (info: { percentComplete: number; phase: string }) => void,
  ): Promise<void> {
    // Close previous instance
    if (gtfs) {
      gtfs.close();
      gtfs = null;
    }

    type ProgressFn = (info: { percentComplete: number; phase: string }) => void;
    const options: {
      locateFile: (file: string) => string;
      onProgress?: ProgressFn;
    } = {
      locateFile: () => locateFile,
    };

    if (progressCallback) {
      options.onProgress = progressCallback;
    }

    const skipFiles = ['shapes.txt', 'trips.txt', 'stop_times.txt'];
    if (input.type === 'url') {
      gtfs = await GtfsSqlJs.fromZip(input.url, { ...options, skipFiles });
    } else {
      gtfs = await GtfsSqlJs.fromZipData(input.data, { ...options, skipFiles });
    }
  },

  getRoutes(): Route[] {
    if (!gtfs) throw new Error('GTFS not loaded');
    return gtfs.getRoutes();
  },

  getAgencies(): Agency[] {
    if (!gtfs) throw new Error('GTFS not loaded');
    return gtfs.getAgencies();
  },

  close(): void {
    if (gtfs) {
      gtfs.close();
      gtfs = null;
    }
  },
};

export type GtfsWorkerApi = typeof workerApi;

Comlink.expose(workerApi);
