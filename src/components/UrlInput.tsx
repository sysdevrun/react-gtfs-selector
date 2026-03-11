import { useState, useCallback } from 'react';
import type { GtfsSelectionResult } from '../types';

export interface UrlInputProps {
  onSelect: (result: GtfsSelectionResult) => void;
  className?: string;
}

export function UrlInput({ onSelect, className }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;
      onSelect({ type: 'url', url: trimmed, title: trimmed });
    },
    [url, onSelect],
  );

  return (
    <form className={className} onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/gtfs.zip"
        aria-label="GTFS feed URL"
        data-testid="url-input"
      />
      <button type="submit">Load</button>
    </form>
  );
}
