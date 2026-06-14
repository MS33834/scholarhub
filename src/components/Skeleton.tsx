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
  const baseStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width || '100%',
    height: typeof height === 'number' ? `${height}px` : height || '1.5rem',
    backgroundColor: 'var(--skeleton-bg, #e0e0e0)',
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
  }

  const animationClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-wave' : ''

  return <div className={`skeleton ${animationClass} ${className}`} style={baseStyles} />
}

// Resource card skeleton
export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="resource-card-skeleton">
      <div className="skeleton-header">
        <Skeleton variant="text" width="60%" height="1.5rem" />
        <Skeleton variant="text" width="40%" height="1rem" className="mt-2" />
      </div>
      <div className="skeleton-content">
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="100%" height="0.875rem" className="mt-2" />
        <Skeleton variant="text" width="80%" height="0.875rem" className="mt-2" />
      </div>
      <div className="skeleton-footer">
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
    <div className="resource-list-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <ResourceCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Detail page skeleton
export const ResourceDetailSkeleton: React.FC = () => {
  return (
    <div className="resource-detail-skeleton">
      <div className="skeleton-title">
        <Skeleton variant="text" width="70%" height="2rem" />
      </div>
      <div className="skeleton-meta">
        <Skeleton variant="text" width="50%" height="1rem" />
      </div>
      <div className="skeleton-abstract">
        <Skeleton variant="text" width="100%" height="0.875rem" />
        <Skeleton variant="text" width="100%" height="0.875rem" className="mt-2" />
        <Skeleton variant="text" width="100%" height="0.875rem" className="mt-2" />
        <Skeleton variant="text" width="60%" height="0.875rem" className="mt-2" />
      </div>
      <div className="skeleton-actions">
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
    <div className="search-results-skeleton">
      <div className="skeleton-search-bar">
        <Skeleton variant="rectangular" width="100%" height="48px" />
      </div>
      <div className="skeleton-filters">
        <Skeleton variant="rectangular" width="150px" height="36px" />
        <Skeleton variant="rectangular" width="150px" height="36px" />
        <Skeleton variant="rectangular" width="150px" height="36px" />
      </div>
      <ResourceListSkeleton count={8} />
    </div>
  )
}

// Home page skeleton
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="home-page-skeleton">
      <div className="skeleton-hero">
        <Skeleton variant="text" width="60%" height="3rem" />
        <Skeleton variant="text" width="80%" height="1.5rem" className="mt-4" />
        <Skeleton variant="rectangular" width="100%" height="56px" className="mt-8" />
      </div>
      <div className="skeleton-section">
        <Skeleton variant="text" width="30%" height="1.5rem" />
        <div className="skeleton-cards mt-6">
          <Skeleton variant="rectangular" width="100%" height="200px" />
          <Skeleton variant="rectangular" width="100%" height="200px" className="mt-4" />
          <Skeleton variant="rectangular" width="100%" height="200px" className="mt-4" />
        </div>
      </div>
    </div>
  )
}
