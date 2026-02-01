export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {}
      <div>
        <div className="h-8 bg-surface-card rounded w-48 mb-2" />
        <div className="h-5 bg-surface-card rounded w-72" />
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-surface-card rounded w-24" />
              <div className="w-10 h-10 bg-surface-card rounded-lg" />
            </div>
            <div className="h-8 bg-surface-card rounded w-20 mb-2" />
            <div className="h-4 bg-surface-card rounded w-32" />
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="h-6 bg-surface-card rounded w-40 mb-6" />
          <div className="h-64 bg-surface-card rounded" />
        </div>
        <div className="card p-6">
          <div className="h-6 bg-surface-card rounded w-40 mb-6" />
          <div className="h-64 bg-surface-card rounded" />
        </div>
      </div>

      {}
      <div className="card p-6">
        <div className="h-6 bg-surface-card rounded w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-card rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-surface-card rounded w-32 mb-2" />
                <div className="h-3 bg-surface-card rounded w-24" />
              </div>
              <div className="h-6 bg-surface-card rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

