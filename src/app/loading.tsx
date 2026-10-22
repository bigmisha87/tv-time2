// Shown the instant a tab is tapped, while the real screen loads, so the app
// reacts immediately instead of freezing on the old screen.
export default function Loading() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded-md bg-surface" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg bg-surface" />
        ))}
      </div>
    </div>
  );
}
