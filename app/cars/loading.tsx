import { CarCardSkeleton } from '@/components/Loading'

export default function CarsLoading() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="text-center mb-12">
          <div className="h-12 bg-surface-card rounded-lg w-80 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-surface-card rounded-lg w-96 mx-auto animate-pulse" />
        </div>

        {}
        <div className="card-static p-6 mb-8 space-y-6">
          <div className="h-12 bg-surface-card rounded-lg animate-pulse" />
          <div className="flex gap-4">
            <div className="h-10 bg-surface-card rounded-full w-20 animate-pulse" />
            <div className="h-10 bg-surface-card rounded-full w-24 animate-pulse" />
            <div className="h-10 bg-surface-card rounded-full w-28 animate-pulse" />
          </div>
        </div>

        {}
        <div className="h-6 bg-surface-card rounded w-48 mb-6 animate-pulse" />

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

