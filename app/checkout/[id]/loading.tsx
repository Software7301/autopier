export default function CheckoutLoading() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {}
        <div className="text-center mb-12">
          <div className="h-10 bg-surface-card rounded w-64 mx-auto mb-4" />
          <div className="h-6 bg-surface-card rounded w-96 mx-auto" />
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {}
          <div className="card p-8 space-y-6">
            <div className="h-7 bg-surface-card rounded w-48 mb-6" />

            {}
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 bg-surface-card rounded w-32 mb-2" />
                <div className="h-12 bg-surface-card rounded" />
              </div>
            ))}

            <div className="h-7 bg-surface-card rounded w-48 mt-8 mb-6" />

            {}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-surface-card rounded-lg" />
              ))}
            </div>

            <div className="h-14 bg-primary/30 rounded-lg mt-8" />
          </div>

          {}
          <div className="card p-8 space-y-6">
            <div className="h-7 bg-surface-card rounded w-40 mb-6" />

            {}
            <div className="h-48 bg-surface-card rounded-lg mb-6" />

            {}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-surface-card rounded w-24" />
                  <div className="h-4 bg-surface-card rounded w-32" />
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border pt-4">
              <div className="flex justify-between">
                <div className="h-6 bg-surface-card rounded w-20" />
                <div className="h-6 bg-surface-card rounded w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

