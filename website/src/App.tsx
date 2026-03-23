import { useState, useCallback, useRef } from 'react';
import { GtfsSelector, fileTab, urlTab, mobilityDataCsv, transportDataGouvFr } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';
import type { GtfsSelectionResult } from 'react-gtfs-selector';
import * as Comlink from 'comlink';
import type { Route, Agency } from 'gtfs-sqljs';
import type { GtfsWorkerApi } from './gtfs.worker';
import { getProxyUrl } from './proxy';
import { RouteList } from './RouteList';
import './App.css';

const tabs = [fileTab, mobilityDataCsv, transportDataGouvFr, urlTab];

function createWorker() {
  const raw = new Worker(new URL('./gtfs.worker.ts', import.meta.url), {
    type: 'module',
  });
  return Comlink.wrap<GtfsWorkerApi>(raw);
}

export function App() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [gtfsUrl, setGtfsUrl] = useState<string | null>(null);
  const [gtfsRtUrls, setGtfsRtUrls] = useState<string[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const workerRef = useRef<Comlink.Remote<GtfsWorkerApi> | null>(null);

  const handleSelect = useCallback(async (result: GtfsSelectionResult) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    setRoutes(null);
    setAgencies([]);
    setGtfsUrl(null);
    setGtfsRtUrls([]);

    // Close previous instance in worker
    if (workerRef.current) {
      await workerRef.current.close();
    }

    // Create a fresh worker (or reuse)
    if (!workerRef.current) {
      workerRef.current = createWorker();
    }

    const worker = workerRef.current;
    const wasmUrl = import.meta.env.BASE_URL + 'sql-wasm-browser.wasm';

    const onProgress = Comlink.proxy(
      (info: { percentComplete: number; phase: string }) => {
        setProgress(info.percentComplete);
        setPhase(info.phase);
      },
    );

    try {
      if (result.type === 'url') {
        setTitle(result.title);
        setGtfsUrl(result.url);
        setGtfsRtUrls(result.gtfsRtUrls ?? []);
        const proxiedUrl = getProxyUrl(result.url);
        await worker.loadFromZip({ type: 'url', url: proxiedUrl }, wasmUrl, onProgress);
      } else {
        setTitle(result.fileName);
        const arrayBuffer = await result.blob.arrayBuffer();
        await worker.loadFromZip(
          Comlink.transfer({ type: 'data', data: arrayBuffer }, [arrayBuffer]),
          wasmUrl,
          onProgress,
        );
      }

      const fetchedRoutes = await worker.getRoutes();
      const fetchedAgencies = await worker.getAgencies();
      setRoutes(fetchedRoutes);
      setAgencies(fetchedAgencies);
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
        <div className="app__links">
          <a
            href="https://www.npmjs.com/package/react-gtfs-selector"
            className="app__github-link"
            aria-label="npm package"
          >
            <svg viewBox="0 0 780 250" width="42" height="14" aria-hidden="true">
              <path fill="#231F20" d="M240,250h100v-50h100V0H240V250z M340,50h50v100h-50V50z M480,0v200h100V50h50v150h50V50h50v150h50V0H480z M0,200h100V50h50v150h50V0H0V200z" strokeWidth="5" stroke="#f7f7f7" />
            </svg>
          </a>
          <a
            href="https://github.com/sysdevrun/react-gtfs-selector"
            className="app__github-link"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 16 16" width="28" height="28" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
        <p>Select a GTFS source to view transit routes</p>
      </header>

      <div className="app__selector">
        <GtfsSelector onSelect={handleSelect} tabs={tabs} />
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

          {gtfsUrl && (
            <div className="app__feed-urls">
              <div className="app__feed-url">
                <span className="app__feed-url-label">GTFS</span>
                <a href={gtfsUrl} className="app__feed-url-link">{gtfsUrl}</a>
              </div>
              {gtfsRtUrls.map((url) => (
                <div key={url} className="app__feed-url">
                  <span className="app__feed-url-label">GTFS-RT</span>
                  <a href={url} className="app__feed-url-link">{url}</a>
                </div>
              ))}
            </div>
          )}

          {agencies.length > 0 && (
            <div className="app__agencies">
              {agencies.map((agency) => (
                <div key={agency.agency_id} className="app__agency">
                  <span className="app__agency-name">
                    {agency.agency_url ? (
                      <a href={agency.agency_url} target="_blank" rel="noopener noreferrer">{agency.agency_name}</a>
                    ) : agency.agency_name}
                  </span>
                  <span className="app__agency-details">
                    {[agency.agency_timezone, agency.agency_phone].filter(Boolean).join(' \u00b7 ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          <RouteList routes={routes} />
        </div>
      )}
    </div>
  );
}
