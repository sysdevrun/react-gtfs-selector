import { useState, useCallback, useRef } from 'react';

interface DropZoneProps {
  onFile: (blob: Blob, fileName: string) => void;
  className?: string;
}

export function DropZone({ onFile, className }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
        setError('Please provide a .zip file');
        return;
      }
      setError(null);
      onFile(file, file.name);
    },
    [onFile],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  return (
    <div
      className={`rgs-dropzone ${dragging ? 'rgs-dropzone--active' : ''} ${className ?? ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
      }}
      aria-label="Drop a GTFS zip file here or click to browse"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        data-testid="file-input"
      />
      <div className="rgs-dropzone__content">
        <div className="rgs-dropzone__icon" aria-hidden="true">
          {dragging ? '\u{1F4E5}' : '\u{1F4C1}'}
        </div>
        <p className="rgs-dropzone__text">
          {dragging
            ? 'Drop your GTFS file here'
            : 'Drag & drop a GTFS .zip file here, or click to browse'}
        </p>
        {error && <p className="rgs-dropzone__error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
