import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { GtfsSource, GtfsSearchResult } from '../types';

interface SourceSearchProps {
  source: GtfsSource;
  onSelect: (result: GtfsSearchResult) => void;
}

export function SourceSearch({ source, onSelect }: SourceSearchProps) {
  const [datasets, setDatasets] = useState<GtfsSearchResult[]>([]);
  const [loading, setLoading] = useState(!source.asyncSearch);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [asyncResults, setAsyncResults] = useState<GtfsSearchResult[]>([]);
  const [asyncSearching, setAsyncSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  const isAsync = !!source.asyncSearch;

  // Fetch all datasets upfront for sync sources
  useEffect(() => {
    if (isAsync) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    source
      .fetchDatasets()
      .then((data) => {
        if (!cancelled) {
          setDatasets(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, isAsync]);

  // Debounced async search for sources with asyncSearch
  useEffect(() => {
    if (!isAsync || !source.asyncSearch) return;
    if (query.length < 2) {
      setAsyncResults([]);
      return;
    }

    let cancelled = false;
    setAsyncSearching(true);

    const timer = setTimeout(() => {
      source
        .asyncSearch!(query)
        .then((results) => {
          if (!cancelled) {
            setAsyncResults(results);
            setAsyncSearching(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(String(err));
            setAsyncSearching(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, isAsync, query]);

  const filtered = useMemo(() => {
    if (isAsync) return asyncResults;
    return source.search(datasets, query);
  }, [isAsync, asyncResults, source, datasets, query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [filtered]);

  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const item = resultsRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (result: GtfsSearchResult) => {
      onSelect(result);
      setQuery('');
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(filtered[activeIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [open, filtered, activeIndex, handleSelect],
  );

  if (!source.available) {
    return (
      <div className="rgs-source-search rgs-source-search--unavailable">
        <p className="rgs-source-search__placeholder">
          {source.label} — {source.unavailableMessage ?? 'Unavailable'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rgs-source-search">
        <p className="rgs-source-search__loading">Loading datasets from {source.label}...</p>
      </div>
    );
  }

  if (error && !isAsync) {
    return (
      <div className="rgs-source-search">
        <p className="rgs-source-search__error" role="alert">
          Failed to load datasets: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rgs-source-search" ref={containerRef}>
      <input
        className="rgs-source-search__input"
        type="text"
        placeholder={`Search ${source.label}...`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={`Search GTFS datasets on ${source.label}`}
        data-testid="source-search-input"
      />
      {open && query.length >= 2 && (
        <ul className="rgs-source-search__results" ref={resultsRef} role="listbox">
          {asyncSearching ? (
            <li className="rgs-source-search__empty">Searching...</li>
          ) : error ? (
            <li className="rgs-source-search__empty rgs-source-search__error" role="alert">
              Search failed: {error}
            </li>
          ) : filtered.length === 0 ? (
            <li className="rgs-source-search__empty">No dataset found</li>
          ) : (
            filtered.map((result, idx) => (
              <li
                key={result.id}
                className={`rgs-source-search__item ${idx === activeIndex ? 'rgs-source-search__item--active' : ''}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(idx)}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <span className="rgs-source-search__item-title">{result.title}</span>
                {result.area && (
                  <span className="rgs-source-search__item-area">{result.area}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
