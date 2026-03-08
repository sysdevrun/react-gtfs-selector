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
        <h1>
          react-gtfs-selector
          <a
            href="https://github.com/sysdevrun/react-gtfs-selector"
            className="app__github-link"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 16 16" width="28" height="28" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </h1>
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
