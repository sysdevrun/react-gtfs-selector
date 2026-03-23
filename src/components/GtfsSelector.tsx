import { useState, useEffect } from 'react';
import type { GtfsTab, GtfsSelectionResult } from '../types';

export interface GtfsSelectorProps {
  /** Called when a GTFS source is selected (file dropped or URL picked) */
  onSelect: (result: GtfsSelectionResult) => void;
  /** Ordered list of tabs to display */
  tabs: GtfsTab[];
  /** Set to false to disable bundled CSS class names (default: true) */
  styled?: boolean;
  /** Additional CSS class on the root element */
  className?: string;
}

export function GtfsSelector({
  onSelect,
  tabs,
  styled = true,
  className,
}: GtfsSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? '');

  // Reset if active tab no longer exists
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const cls = (name: string) => (styled ? name : '');

  const active = tabs.find((t) => t.id === activeTab);
  const TabComponent = active?.component;

  return (
    <div className={`${cls('rgs-selector')} ${className ?? ''}`.trim()} data-testid="gtfs-selector">
      <div className={cls('rgs-selector__tabs')} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${cls('rgs-selector__tab')} ${activeTab === tab.id ? cls('rgs-selector__tab--active') : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cls('rgs-selector__panel')} role="tabpanel">
        {TabComponent && <TabComponent onSelect={onSelect} styled={styled} />}
      </div>
    </div>
  );
}
