/**
 * A template (rather than a layout) remounts on every navigation, which is
 * exactly what the entrance animation needs: the incoming page rises into place
 * behind the sweep band, once, and never re-runs while you stay on the route.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
