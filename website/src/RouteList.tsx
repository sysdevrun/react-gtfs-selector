import type { Route } from 'gtfs-sqljs';

const ROUTE_TYPE_LABELS: Record<number, string> = {
  0: 'Tram',
  1: 'Metro',
  2: 'Rail',
  3: 'Bus',
  4: 'Ferry',
  5: 'Cable tram',
  6: 'Aerial lift',
  7: 'Funicular',
  11: 'Trolleybus',
  12: 'Monorail',
};

function normalizeColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const c = color.replace(/^#/, '');
  return `#${c}`;
}

function sortRoutes(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => {
    if (a.route_sort_order != null && b.route_sort_order != null) {
      return a.route_sort_order - b.route_sort_order;
    }
    if (a.route_sort_order != null) return -1;
    if (b.route_sort_order != null) return 1;
    return (a.route_short_name || '').localeCompare(b.route_short_name || '', undefined, { numeric: true });
  });
}

export function RouteList({ routes }: { routes: Route[] }) {
  const sorted = sortRoutes(routes);

  return (
    <div className="route-list">
      <h2>{routes.length} route{routes.length !== 1 ? 's' : ''}</h2>
      <div className="route-list__items">
        {sorted.map((route) => {
          const bg = normalizeColor(route.route_color, '#6b7280');
          const fg = normalizeColor(route.route_text_color, '#ffffff');
          const typeLabel = ROUTE_TYPE_LABELS[route.route_type] ?? `Type ${route.route_type}`;

          return (
            <div key={route.route_id} className="route-list__item">
              <span
                className="route-list__badge"
                style={{ backgroundColor: bg, color: fg }}
              >
                {route.route_short_name || '?'}
              </span>
              <div className="route-list__info">
                <span className="route-list__name">{route.route_long_name || route.route_short_name}</span>
                <span className="route-list__type">{typeLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
