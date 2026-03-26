export default function OrderPanelSkeleton() {
  return (
    <div className="border border-[var(--color-border)] p-4 space-y-3">
      <div className="skeleton h-6 w-32" />
      <div className="flex gap-2">
        <div className="skeleton h-8 flex-1" />
        <div className="skeleton h-8 flex-1" />
      </div>
      <div className="space-y-2">
        {[1,2,3,4].map(i => (
          <div key={i}>
            <div className="skeleton h-4 w-20 mb-1" />
            <div className="skeleton h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
