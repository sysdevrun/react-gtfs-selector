import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  it('renders the drop zone with instructions', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByText(/Drag & drop a GTFS .zip file/)).toBeInTheDocument();
  });

  it('calls onFile when a valid .zip file is selected via input', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);

    const file = new File(['fake-zip-content'], 'gtfs.zip', { type: 'application/zip' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file, 'gtfs.zip');
  });

  it('shows error for non-zip files dropped', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);

    const dropZone = screen.getByRole('button');
    const file = new File(['not-a-zip'], 'data.txt', { type: 'text/plain' });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Please provide a .zip file');
    expect(onFile).not.toHaveBeenCalled();
  });

  it('calls onFile when a .zip file is dropped', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);

    const dropZone = screen.getByRole('button');
    const file = new File(['zip-data'], 'feed.zip', { type: 'application/zip' });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledWith(file, 'feed.zip');
  });

  it('shows active state on drag enter and resets on drag leave', () => {
    render(<DropZone onFile={vi.fn()} />);
    const dropZone = screen.getByRole('button');

    fireEvent.dragEnter(dropZone);
    expect(dropZone.className).toContain('rgs-dropzone--active');
    expect(screen.getByText('Drop your GTFS file here')).toBeInTheDocument();

    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain('rgs-dropzone--active');
  });
});
