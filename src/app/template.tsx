// A template re-mounts on every navigation, so the page content fades in
// each time a screen changes (styles in globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
