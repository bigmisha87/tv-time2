import Link from "next/link";

export interface Crumb {
  label: string;
  /** Omit on the final (current) crumb so it renders as plain text. */
  href?: string;
}

/** A simple `Parent / Child` trail. Safe to use in server components. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1.5 text-sm"
    >
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted/50">/</span>}
          {it.href ? (
            <Link
              href={it.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {it.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground" aria-current="page">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
