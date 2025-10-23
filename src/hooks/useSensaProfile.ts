/**
 * Hook for managing user profile in Sensa Learn
 */

import { useState, useEffect } from 'react';
import { sensaApi, type UserProfile } from '@/services/sensaApi';

export const useSensaProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await sensaApi.getProfile(userId);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    try {
      const updated = await sensaApi.updateProfile(userId, updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { profile, loading, error, updateProfile };
};
