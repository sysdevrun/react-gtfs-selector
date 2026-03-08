import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SourceSearch } from './SourceSearch';
import type { GtfsSource, GtfsSearchResult } from '../types';

const mockDatasets: GtfsSearchResult[] = [
  { id: '1', title: 'SNCF TER Auvergne', url: 'https://example.com/sncf.zip', area: 'Auvergne' },
  { id: '2', title: 'TCL Lyon', url: 'https://example.com/tcl.zip', area: 'Lyon' },
  { id: '3', title: 'STAR Rennes', url: 'https://example.com/star.zip', area: 'Rennes' },
];

function createMockSource(overrides: Partial<GtfsSource> = {}): GtfsSource {
  return {
    id: 'test-source',
    label: 'Test Source',
    available: true,
    fetchDatasets: vi.fn().mockResolvedValue(mockDatasets),
    search: vi.fn((datasets: GtfsSearchResult[], query: string) => {
      if (query.length < 2) return [];
      const q = query.toLowerCase();
      return datasets.filter(
        (d) => d.title.toLowerCase().includes(q) || d.area?.toLowerCase().includes(q),
      );
    }),
    ...overrides,
  };
}

describe('SourceSearch', () => {
  it('shows loading state then input', async () => {
    const source = createMockSource();
    render(<SourceSearch source={source} onSelect={vi.fn()} />);

    expect(screen.getByText(/Loading datasets/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });
  });

  it('shows error if fetchDatasets fails', async () => {
    const source = createMockSource({
      fetchDatasets: vi.fn().mockRejectedValue(new Error('Network error')),
    });
    render(<SourceSearch source={source} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load datasets');
    });
  });

  it('shows "Coming soon" for unavailable sources', () => {
    const source = createMockSource({ available: false });
    render(<SourceSearch source={source} onSelect={vi.fn()} />);

    expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
  });

  it('searches and displays results', async () => {
    const user = userEvent.setup();
    const source = createMockSource();
    render(<SourceSearch source={source} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('source-search-input'), 'Lyon');

    await waitFor(() => {
      expect(screen.getByText('TCL Lyon')).toBeInTheDocument();
    });
  });

  it('calls onSelect when a result is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const source = createMockSource();
    render(<SourceSearch source={source} onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('source-search-input'), 'Lyon');

    await waitFor(() => {
      expect(screen.getByText('TCL Lyon')).toBeInTheDocument();
    });

    await user.click(screen.getByText('TCL Lyon'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', title: 'TCL Lyon', url: 'https://example.com/tcl.zip' }),
    );
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const source = createMockSource();
    render(<SourceSearch source={source} onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId('source-search-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('source-search-input');
    await user.type(input, 'SN');

    await waitFor(() => {
      expect(screen.getByText('SNCF TER Auvergne')).toBeInTheDocument();
    });

    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', title: 'SNCF TER Auvergne' }),
    );
  });
});
