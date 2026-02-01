export default function PedidosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-surface-card rounded w-32 mb-2" />
          <div className="h-5 bg-surface-card rounded w-56" />
        </div>
        <div className="h-10 bg-surface-card rounded w-32" />
      </div>

      {}
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-surface-card rounded-full w-24" />
        ))}
      </div>

      {}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-border">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-surface-card rounded flex-1" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-4 border-b border-surface-border">
            <div className="flex gap-4 items-center">
              <div className="h-4 bg-surface-card rounded flex-1" />
              <div className="h-4 bg-surface-card rounded flex-1" />
              <div className="h-4 bg-surface-card rounded flex-1" />
              <div className="h-6 bg-surface-card rounded w-20" />
              <div className="h-8 bg-surface-card rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

