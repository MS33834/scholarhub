import { ResourceCard } from './ResourceCard'
import type { Resource } from '@/types'

interface VirtualResourceListProps {
  resources: Resource[]
}

export function VirtualResourceList({ resources }: VirtualResourceListProps) {
  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  )
}
