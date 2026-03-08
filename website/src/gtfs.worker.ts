import * as Comlink from 'comlink';
import { GtfsSqlJs } from 'gtfs-sqljs';
import type { Route } from 'gtfs-sqljs';

let gtfs: GtfsSqlJs | null = null;

const workerApi = {
  async loadFromZip(
    data: string | ArrayBuffer,
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
    if (typeof data === 'string') {
      gtfs = await GtfsSqlJs.fromZip(data, { ...options, skipFiles });
    } else {
      // fromZip internally accepts ArrayBuffer despite string type signature
      gtfs = await (GtfsSqlJs as unknown as {
        fromZip: (data: ArrayBuffer, opts: typeof options & { skipFiles?: string[] }) => Promise<GtfsSqlJs>;
      }).fromZip(data, { ...options, skipFiles });
    }
  },

  getRoutes(): Route[] {
    if (!gtfs) throw new Error('GTFS not loaded');
    return gtfs.getRoutes();
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
