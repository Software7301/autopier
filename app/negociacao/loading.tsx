export default function NegociacaoLoading() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="text-center mb-12">
          <div className="h-12 bg-surface-card rounded-lg w-80 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-surface-card rounded-lg w-full max-w-2xl mx-auto animate-pulse" />
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="card p-8">
              <div className="w-16 h-16 bg-surface-card rounded-2xl mb-6 animate-pulse" />
              <div className="h-7 bg-surface-card rounded w-40 mb-3 animate-pulse" />
              <div className="h-5 bg-surface-card rounded w-full mb-2 animate-pulse" />
              <div className="h-5 bg-surface-card rounded w-3/4 mb-6 animate-pulse" />
              <div className="h-5 bg-surface-card rounded w-32 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

