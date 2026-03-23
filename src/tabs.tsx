import { useCallback } from 'react';
import type { GtfsTab, GtfsTabComponentProps, GtfsSource, GtfsSearchResult } from './types';
import { DropZone } from './components/DropZone';
import { UrlInput } from './components/UrlInput';
import { SourceSearch } from './components/SourceSearch';

function FileTabComponent({ onSelect }: GtfsTabComponentProps) {
  const handleFile = useCallback(
    (blob: Blob, fileName: string) => {
      onSelect({ type: 'file', blob, fileName });
    },
    [onSelect],
  );

  return <DropZone onFile={handleFile} />;
}

function UrlTabComponent({ onSelect, styled }: GtfsTabComponentProps) {
  return <UrlInput onSelect={onSelect} className={styled ? 'rgs-url-input' : ''} />;
}

/** Built-in file import tab */
export const fileTab: GtfsTab = {
  id: 'file',
  label: 'Import file',
  component: FileTabComponent,
};

/** Built-in URL input tab */
export const urlTab: GtfsTab = {
  id: 'url',
  label: 'Load from URL',
  component: UrlTabComponent,
};

/** Wrap a GtfsSource into a GtfsTab that renders SourceSearch */
export function createSourceTab(source: GtfsSource): GtfsTab {
  function SourceTabComponent({ onSelect }: GtfsTabComponentProps) {
    const handleSelect = useCallback(
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

    return <SourceSearch source={source} onSelect={handleSelect} />;
  }

  return {
    id: source.id,
    label: source.label,
    component: SourceTabComponent,
  };
}
