import { useCallback, useEffect, useRef, useState } from 'react';
import { themePreferenceUseCases } from '@/di/container';
import type { ThemePreference } from '@/model/entities/themePreference';
import { DomainError } from '@/model/errors';
import type { IThemePreferenceUseCases } from '@/usecase/iThemePreferenceUseCases';

export type ThemePreferenceState = {
  preference: ThemePreference;
  loading: boolean;
  error: string | null;
};

export type ThemePreferenceActions = {
  handleSetThemePreference: (preference: ThemePreference) => Promise<boolean>;
};

export function useThemePreferenceViewModel(
  useCase: IThemePreferenceUseCases = themePreferenceUseCases
): [ThemePreferenceState, ThemePreferenceActions] {
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const hasUserUpdatedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    void useCase
      .getThemePreference()
      .then((loaded) => {
        if (isMountedRef.current && !hasUserUpdatedRef.current) {
          setPreference(loaded);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMountedRef.current && !hasUserUpdatedRef.current) {
          if (err instanceof DomainError) {
            setError(err.message);
          } else {
            setError('Não foi possível carregar a preferência de tema.');
          }
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [useCase]);

  const handleSetThemePreference = useCallback(
    async (next: ThemePreference): Promise<boolean> => {
      hasUserUpdatedRef.current = true;
      setError(null);
      try {
        const saved = await useCase.setThemePreference(next);
        if (isMountedRef.current) {
          setPreference(saved);
        }
        return true;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          if (err instanceof DomainError) {
            setError(err.message);
          } else {
            setError('Não foi possível salvar a preferência de tema.');
          }
        }
        return false;
      }
    },
    [useCase]
  );

  const state: ThemePreferenceState = {
    preference,
    loading,
    error,
  };

  const actions: ThemePreferenceActions = {
    handleSetThemePreference,
  };

  return [state, actions];
}
