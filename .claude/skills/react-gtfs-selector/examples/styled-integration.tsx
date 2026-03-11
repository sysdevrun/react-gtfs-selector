import { GtfsSelector } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';

// --- Approach 1: Default styles (just import the CSS) ---

function DefaultStyled() {
  return <GtfsSelector onSelect={(r) => console.log(r)} />;
}

// --- Approach 2: Default styles + custom className for overrides ---
//
// The className is added to the root element alongside `rgs-selector`.
// Use it for positioning or to override specific default styles.
//
// CSS example:
//   .my-picker { max-width: 800px; }
//   .my-picker .rgs-selector__tab--active { color: #e91e63; border-bottom-color: #e91e63; }
//   .my-picker .rgs-dropzone { border-color: #e91e63; }

function CustomClassName() {
  return (
    <GtfsSelector
      onSelect={(r) => console.log(r)}
      className="my-picker"
    />
  );
}

// --- Approach 3: Fully unstyled — no rgs- classes emitted ---
//
// When styled={false}, the component emits no `rgs-` class names.
// Style entirely through your own CSS using the className prop
// or by targeting data-testid attributes:
//   [data-testid="gtfs-selector"]      — root
//   [data-testid="source-search-input"] — search input
//   [data-testid="url-input"]          — URL input
//   [role="tablist"]                   — tab bar
//   [role="tab"]                       — individual tabs
//   [role="tabpanel"]                  — content area

function FullyUnstyled() {
  return (
    <GtfsSelector
      onSelect={(r) => console.log(r)}
      styled={false}
      className="my-custom-selector"
    />
  );
}

export { DefaultStyled, CustomClassName, FullyUnstyled };
