import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UrlInput } from './UrlInput';

describe('UrlInput', () => {
  it('renders input and button', () => {
    render(<UrlInput onSelect={vi.fn()} />);

    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
  });

  it('calls onSelect with url result on submit', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UrlInput onSelect={onSelect} />);

    await user.type(screen.getByTestId('url-input'), 'https://example.com/gtfs.zip');
    await user.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSelect).toHaveBeenCalledWith({
      type: 'url',
      url: 'https://example.com/gtfs.zip',
      title: 'https://example.com/gtfs.zip',
    });
  });

  it('does not call onSelect when input is empty', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UrlInput onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('trims whitespace from URL', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UrlInput onSelect={onSelect} />);

    await user.type(screen.getByTestId('url-input'), '  https://example.com/feed  ');
    await user.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSelect).toHaveBeenCalledWith({
      type: 'url',
      url: 'https://example.com/feed',
      title: 'https://example.com/feed',
    });
  });

  it('applies className prop', () => {
    const { container } = render(<UrlInput onSelect={vi.fn()} className="my-class" />);
    expect(container.querySelector('form')?.className).toBe('my-class');
  });
});
