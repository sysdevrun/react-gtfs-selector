import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GtfsSelector } from './GtfsSelector';
import type { GtfsSource, GtfsSearchResult } from '../types';

const mockDatasets: GtfsSearchResult[] = [
  { id: '1', title: 'Network A', url: 'https://example.com/a.zip', area: 'Paris' },
];

const testSource: GtfsSource = {
  id: 'test',
  label: 'Test',
  available: true,
  fetchDatasets: vi.fn().mockResolvedValue(mockDatasets),
  search: vi.fn((_d, q) => (q.length >= 2 ? mockDatasets : [])),
};

describe('GtfsSelector', () => {
  it('renders with tabs', () => {
    render(<GtfsSelector onSelect={vi.fn()} sources={[testSource]} />);

    expect(screen.getByTestId('gtfs-selector')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Import file' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Test' })).toBeInTheDocument();
  });

  it('shows drop zone by default (Import file tab)', () => {
    render(<GtfsSelector onSelect={vi.fn()} sources={[testSource]} />);

    expect(screen.getByText(/Drag & drop a GTFS/)).toBeInTheDocument();
  });

  it('switches to source search tab', async () => {
    const user = userEvent.setup();
    render(<GtfsSelector onSelect={vi.fn()} sources={[testSource]} />);

    await user.click(screen.getByRole('tab', { name: 'Test' }));

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });
  });

  it('calls onSelect with file result on drop', () => {
    const onSelect = vi.fn();
    render(<GtfsSelector onSelect={onSelect} sources={[testSource]} />);

    const dropZone = screen.getByRole('button');
    const file = new File(['data'], 'gtfs.zip', { type: 'application/zip' });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onSelect).toHaveBeenCalledWith({
      type: 'file',
      blob: file,
      fileName: 'gtfs.zip',
    });
  });

  it('calls onSelect with url result on search selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GtfsSelector onSelect={onSelect} sources={[testSource]} />);

    await user.click(screen.getByRole('tab', { name: 'Test' }));

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('source-search-input'), 'Network');

    await waitFor(() => {
      expect(screen.getByText('Network A')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Network A'));

    expect(onSelect).toHaveBeenCalledWith({
      type: 'url',
      url: 'https://example.com/a.zip',
      title: 'Network A',
      gtfsRtUrls: undefined,
    });
  });

  it('applies custom className', () => {
    render(<GtfsSelector onSelect={vi.fn()} sources={[]} className="my-custom" />);
    expect(screen.getByTestId('gtfs-selector').className).toContain('my-custom');
  });
});
