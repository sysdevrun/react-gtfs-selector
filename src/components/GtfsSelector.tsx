import { useState, useCallback, useMemo } from 'react';
import type { GtfsSource, GtfsSelectionResult, GtfsSearchResult } from '../types';
import { DropZone } from './DropZone';
import { SourceSearch } from './SourceSearch';
import { UrlInput } from './UrlInput';

export interface GtfsSelectorProps {
  /** Called when a GTFS source is selected (file dropped or URL picked) */
  onSelect: (result: GtfsSelectionResult) => void;
  /**
   * Custom sources to use instead of the defaults.
   * Pass an empty array to disable online search entirely.
   */
  sources?: GtfsSource[];
  /** Set to false to disable bundled CSS class names (default: true) */
  styled?: boolean;
  /** Additional CSS class on the root element */
  className?: string;
}

type Tab = 'file' | string;

export function GtfsSelector({
  onSelect,
  sources,
  styled = true,
  className,
}: GtfsSelectorProps) {
  const allSources = useMemo(
    () => sources ?? [],
    [sources],
  );

  const [activeTab, setActiveTab] = useState<Tab>('file');

  const handleFile = useCallback(
    (blob: Blob, fileName: string) => {
      onSelect({ type: 'file', blob, fileName });
    },
    [onSelect],
  );

  const handleUrlSelect = useCallback(
    (result: GtfsSearchResult) => {
      onSelect({
        type: 'url',
        url: result.url,
        title: result.title,
        gtfsRtUrls: result.gtfsRtUrls,
      });
    },
    [onSelect],
  );

  const prefix = styled ? 'rgs' : '';
  const cls = (name: string) => (styled ? name : '');

  return (
    <div className={`${cls('rgs-selector')} ${className ?? ''}`.trim()} data-testid="gtfs-selector">
      <div className={cls('rgs-selector__tabs')} role="tablist">
        <button
          className={`${cls('rgs-selector__tab')} ${activeTab === 'file' ? cls('rgs-selector__tab--active') : ''}`}
          role="tab"
          aria-selected={activeTab === 'file'}
          onClick={() => setActiveTab('file')}
        >
          Import file
        </button>
        {allSources.map((source) => (
          <button
            key={source.id}
            className={`${cls('rgs-selector__tab')} ${activeTab === source.id ? cls('rgs-selector__tab--active') : ''}`}
            role="tab"
            aria-selected={activeTab === source.id}
            onClick={() => setActiveTab(source.id)}
          >
            {source.label}
          </button>
        ))}
        <button
          className={`${cls('rgs-selector__tab')} ${activeTab === 'url' ? cls('rgs-selector__tab--active') : ''}`}
          role="tab"
          aria-selected={activeTab === 'url'}
          onClick={() => setActiveTab('url')}
        >
          Load from URL
        </button>
      </div>

      <div className={cls('rgs-selector__panel')} role="tabpanel">
        {activeTab === 'file' ? (
          <DropZone onFile={handleFile} />
        ) : activeTab === 'url' ? (
          <UrlInput onSelect={onSelect} className={cls('rgs-url-input')} />
        ) : (
          (() => {
            const source = allSources.find((s) => s.id === activeTab);
            return source ? (
              <SourceSearch source={source} onSelect={handleUrlSelect} />
            ) : null;
          })()
        )}
      </div>
    </div>
  );
}
