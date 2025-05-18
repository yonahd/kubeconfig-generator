import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export function useNamespaces() {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNamespaces = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/namespaces`);
        if (!response.ok) {
          throw new Error('Failed to fetch namespaces');
        }
        const data = await response.json();
        setNamespaces(data.namespaces);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch namespaces');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNamespaces();
  }, []);

  return { namespaces, isLoading, error };
} 