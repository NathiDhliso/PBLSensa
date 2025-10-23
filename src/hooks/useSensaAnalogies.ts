/**
 * Hook for managing analogies in Sensa Learn
 */

import { useState, useEffect } from 'react';
import { sensaApi, type Analogy } from '@/services/sensaApi';

export const useSensaAnalogies = (userId?: string, documentId?: string) => {
  const [analogies, setAnalogies] = useState<Analogy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAnalogies = async () => {
      try {
        setLoading(true);
        const data = await sensaApi.getAnalogies({ userId, documentId });
        setAnalogies(data.analogies);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalogies();
  }, [userId, documentId]);

  const createAnalogy = async (analogyData: {
    concept_id: string;
    user_experience_text: string;
    strength: number;
    type: string;
    reusable: boolean;
  }) => {
    try {
      const newAnalogy = await sensaApi.createAnalogy(analogyData);
      setAnalogies(prev => [...prev, newAnalogy]);
      return newAnalogy;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateAnalogy = async (analogyId: string, updates: Partial<Analogy>) => {
    try {
      const updated = await sensaApi.updateAnalogy(analogyId, updates);
      setAnalogies(prev => prev.map(a => a.id === analogyId ? updated : a));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteAnalogy = async (analogyId: string) => {
    try {
      await sensaApi.deleteAnalogy(analogyId);
      setAnalogies(prev => prev.filter(a => a.id !== analogyId));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { 
    analogies, 
    loading, 
    error, 
    createAnalogy, 
    updateAnalogy, 
    deleteAnalogy,
    refetch: () => {
      if (userId) {
        sensaApi.getAnalogies({ userId, documentId }).then(data => setAnalogies(data.analogies));
      }
    }
  };
};
