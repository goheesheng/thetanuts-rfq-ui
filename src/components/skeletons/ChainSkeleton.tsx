export default function ChainSkeleton() {
  return (
    <div className="border border-[var(--color-border)] p-4">
      <div className="flex gap-2 mb-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-6 w-16" />)}
      </div>
      <div className="space-y-1">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-2">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-5 w-16" />
            <div className="skeleton h-5 w-16" />
            <div className="skeleton h-5 w-16" />
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
