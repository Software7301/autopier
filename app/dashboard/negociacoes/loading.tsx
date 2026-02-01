export default function NegociacoesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-surface-card rounded w-40 mb-2" />
          <div className="h-5 bg-surface-card rounded w-64" />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-card rounded-xl" />
              <div>
                <div className="h-8 bg-surface-card rounded w-12 mb-2" />
                <div className="h-4 bg-surface-card rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-surface-card rounded-full w-28" />
        ))}
      </div>

      {}
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-card rounded-full" />
                <div>
                  <div className="h-5 bg-surface-card rounded w-32 mb-2" />
                  <div className="h-4 bg-surface-card rounded w-48" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 bg-surface-card rounded-full w-28" />
                <div className="h-10 bg-surface-card rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

