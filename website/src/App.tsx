import { useState, useCallback, useRef } from 'react';
import { GtfsSelector } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';
import type { GtfsSelectionResult } from 'react-gtfs-selector';
import { GtfsSqlJs } from 'gtfs-sqljs';
import type { Route } from 'gtfs-sqljs';
import { getProxyUrl } from './proxy';
import { RouteList } from './RouteList';
import './App.css';

export function App() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const gtfsRef = useRef<GtfsSqlJs | null>(null);

  const handleSelect = useCallback(async (result: GtfsSelectionResult) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    setRoutes(null);

    // Close previous instance
    if (gtfsRef.current) {
      gtfsRef.current.close();
      gtfsRef.current = null;
    }

    const locateFile = (file: string) => import.meta.env.BASE_URL + file;
    const onProgress = (info: { percentComplete: number; phase: string }) => {
      setProgress(info.percentComplete);
      setPhase(info.phase);
    };

    try {
      let gtfs: GtfsSqlJs;

      if (result.type === 'url') {
        setTitle(result.title);
        const proxiedUrl = getProxyUrl(result.url);
        gtfs = await GtfsSqlJs.fromZip(proxiedUrl, {
          locateFile,
          onProgress,
        });
      } else {
        setTitle(result.fileName);
        const arrayBuffer = await result.blob.arrayBuffer();
        // fromZip internally accepts ArrayBuffer despite string type signature
        gtfs = await (GtfsSqlJs as unknown as {
          fromZip: (data: ArrayBuffer, opts: Record<string, unknown>) => Promise<GtfsSqlJs>;
        }).fromZip(arrayBuffer, {
          locateFile,
          onProgress,
        });
      }

      gtfsRef.current = gtfs;
      setRoutes(gtfs.getRoutes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GTFS data');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>react-gtfs-selector</h1>
        <p>Select a GTFS source to view transit routes</p>
      </header>

      <div className="app__selector">
        <GtfsSelector onSelect={handleSelect} />
      </div>

      {loading && (
        <div className="app__loading">
          <p>Loading GTFS data&hellip;</p>
          <div className="app__progress">
            <div className="app__progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="app__progress-text">{Math.round(progress)}% {phase && `— ${phase.replace(/_/g, ' ')}`}</span>
        </div>
      )}

      {error && (
        <div className="app__error">
          <p>{error}</p>
        </div>
      )}

      {routes && (
        <div className="app__results">
          {title && <h2 className="app__results-title">{title}</h2>}
          <RouteList routes={routes} />
        </div>
      )}
    </div>
  );
}
