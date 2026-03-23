import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GtfsSelector } from './GtfsSelector';
import { fileTab, urlTab, createSourceTab } from '../tabs';
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

const testTab = createSourceTab(testSource);

describe('GtfsSelector', () => {
  it('renders with tabs', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[fileTab, testTab]} />);

    expect(screen.getByTestId('gtfs-selector')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Import file' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Test' })).toBeInTheDocument();
  });

  it('shows drop zone by default when fileTab is first', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[fileTab, testTab]} />);

    expect(screen.getByText(/Drag & drop a GTFS/)).toBeInTheDocument();
  });

  it('switches to source search tab', async () => {
    const user = userEvent.setup();
    render(<GtfsSelector onSelect={vi.fn()} tabs={[fileTab, testTab]} />);

    await user.click(screen.getByRole('tab', { name: 'Test' }));

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });
  });

  it('calls onSelect with file result on drop', () => {
    const onSelect = vi.fn();
    render(<GtfsSelector onSelect={onSelect} tabs={[fileTab, testTab]} />);

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
    render(<GtfsSelector onSelect={onSelect} tabs={[fileTab, testTab]} />);

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
    render(<GtfsSelector onSelect={vi.fn()} tabs={[fileTab]} className="my-custom" />);
    expect(screen.getByTestId('gtfs-selector').className).toContain('my-custom');
  });

  it('renders tabs in the order provided', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[testTab, urlTab, fileTab]} />);

    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons[0]).toHaveTextContent('Test');
    expect(tabButtons[1]).toHaveTextContent('Load from URL');
    expect(tabButtons[2]).toHaveTextContent('Import file');
  });

  it('first tab in array is active by default', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[urlTab, fileTab]} />);

    expect(screen.getByTestId('url-input')).toBeInTheDocument();
  });

  it('omitting fileTab hides file import', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[testTab, urlTab]} />);

    expect(screen.queryByRole('tab', { name: 'Import file' })).not.toBeInTheDocument();
  });

  it('omitting urlTab hides URL input', () => {
    render(<GtfsSelector onSelect={vi.fn()} tabs={[fileTab, testTab]} />);

    expect(screen.queryByRole('tab', { name: 'Load from URL' })).not.toBeInTheDocument();
  });
});
