export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="spinner mx-auto" />
        <p className="text-text-secondary">Carregando...</p>
      </div>
    </div>
  )
}

export function CarCardSkeleton() {
  return (
    <div className="card-static overflow-hidden animate-pulse">
      {}
      <div className="h-56 bg-surface-hover" />

      {}
      <div className="p-6 space-y-4">
        <div>
          <div className="h-3 bg-surface-hover rounded w-20 mb-2" />
          <div className="h-6 bg-surface-hover rounded w-3/4" />
        </div>

        <div className="flex gap-4">
          <div className="h-4 bg-surface-hover rounded w-16" />
          <div className="h-4 bg-surface-hover rounded w-16" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <div>
            <div className="h-3 bg-surface-hover rounded w-16 mb-1" />
            <div className="h-8 bg-surface-hover rounded w-32" />
          </div>
          <div className="h-10 bg-surface-hover rounded w-24" />
        </div>
      </div>
    </div>
  )
}

