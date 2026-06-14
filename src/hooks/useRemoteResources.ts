import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Resource } from '../types';

export function useRemoteResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResources() {
      try {
        const result = await api.getResources({ limit: 200 });
        setResources(result.resources || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
        // Fallback to local data
        const { resources: localResources } = await import('../data/resources');
        setResources(localResources);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  return { resources, loading, error };
}

export function useRemoteResource(id: string) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResource() {
      try {
        const result = await api.getResource(id);
        setResource(result);
        setError(null);

        // Add to history if user is authenticated
        const token = api.getToken();
        if (token) {
          await api.addToHistory(id).catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
        // Fallback to local data
        const { resources } = await import('../data/resources');
        const localResource = resources.find((r) => r.id === id);
        setResource(localResource || null);
      } finally {
        setLoading(false);
      }
    }

    fetchResource();
  }, [id]);

  return { resource, loading, error };
}
