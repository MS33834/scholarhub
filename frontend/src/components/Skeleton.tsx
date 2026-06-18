import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | false
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'pulse',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width || '100%',
    height: typeof height === 'number' ? `${height}px` : height || '1rem',
  }

  const animationClass = animation === false ? '' : 'animate-pulse'
  const radiusClass = variant === 'circular' ? 'rounded-full' : 'rounded-[2px]'

  return <div className={`bg-rule ${radiusClass} ${animationClass} ${className}`} style={style} />
}

// Resource card skeleton
export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="border border-rule p-6 bg-paper">
      <Skeleton variant="text" width="60%" height="1.5rem" />
      <Skeleton variant="text" width="40%" height="1rem" className="mt-3" />
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="80%" height="0.875rem" />
      </div>
      <div className="mt-4 flex gap-3">
        <Skeleton variant="text" width="30%" height="0.75rem" />
        <Skeleton variant="text" width="20%" height="0.75rem" />
      </div>
    </div>
  )
}

// Resource list skeleton
interface ResourceListSkeletonProps {
  count?: number
}

export const ResourceListSkeleton: React.FC<ResourceListSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid gap-10">
      {Array.from({ length: count }).map((_, index) => (
        <ResourceCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Detail page skeleton
export const ResourceDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-column mx-auto px-6 sm:px-8 py-8">
      <Skeleton variant="text" width="70%" height="2rem" />
      <Skeleton variant="text" width="50%" height="1rem" className="mt-6" />
      <div className="mt-8 space-y-2">
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="60%" height="0.875rem" />
      </div>
      <div className="mt-8 flex gap-4">
        <Skeleton variant="rectangular" width="120px" height="40px" />
        <Skeleton variant="rectangular" width="120px" height="40px" />
        <Skeleton variant="rectangular" width="120px" height="40px" />
      </div>
    </div>
  )
}

// Search results skeleton
export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="px-6 sm:px-8 py-6">
      <Skeleton variant="rectangular" width="100%" height="48px" />
      <div className="mt-6 flex gap-4">
        <Skeleton variant="rectangular" width="150px" height="36px" />
        <Skeleton variant="rectangular" width="150px" height="36px" />
        <Skeleton variant="rectangular" width="150px" height="36px" />
      </div>
      <div className="mt-8">
        <ResourceListSkeleton count={8} />
      </div>
    </div>
  )
}

// Home page skeleton
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="mb-16">
        <Skeleton variant="text" width="60%" height="3rem" />
        <Skeleton variant="text" width="80%" height="1.5rem" className="mt-4" />
        <Skeleton variant="rectangular" width="100%" height="56px" className="mt-8" />
      </div>
      <div className="mb-16">
        <Skeleton variant="text" width="30%" height="1.5rem" />
        <div className="mt-6 grid gap-10">
          <Skeleton variant="rectangular" width="100%" height="200px" />
          <Skeleton variant="rectangular" width="100%" height="200px" />
          <Skeleton variant="rectangular" width="100%" height="200px" />
        </div>
      </div>
    </div>
  )
}
