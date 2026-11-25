import { useCallback, useEffect, useRef, useState } from 'react';
import { soundPreferenceUseCases } from '@/di/container';
import {
  DEFAULT_SOUND_PREFERENCE,
  type SoundPreference,
} from '@/model/entities/soundPreference';
import { DomainError } from '@/model/errors';
import type { ISoundPreferenceUseCases } from '@/usecase/iSoundPreferenceUseCases';

export type SoundPreferenceState = {
  preference: SoundPreference;
  soundEnabled: boolean;
  loading: boolean;
  error: string | null;
};

export type SoundPreferenceActions = {
  handleSetSoundEnabled: (enabled: boolean) => Promise<boolean>;
  handleToggleSound: () => Promise<boolean>;
};

export function useSoundPreferenceViewModel(
  useCase: ISoundPreferenceUseCases = soundPreferenceUseCases
): [SoundPreferenceState, SoundPreferenceActions] {
  const [preference, setPreference] = useState<SoundPreference>(
    DEFAULT_SOUND_PREFERENCE
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const hasUserUpdatedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    void useCase
      .getSoundPreference()
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
            setError('Não foi possível carregar a preferência de som.');
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

  const handleSetSoundEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      hasUserUpdatedRef.current = true;
      setError(null);
      try {
        const saved = await useCase.setSoundEnabled(enabled);
        if (isMountedRef.current) {
          setPreference(saved);
        }
        return true;
      } catch (err: unknown) {
        if (isMountedRef.current) {
          if (err instanceof DomainError) {
            setError(err.message);
          } else {
            setError('Não foi possível salvar a preferência de som.');
          }
        }
        return false;
      }
    },
    [useCase]
  );

  const handleToggleSound = useCallback(async (): Promise<boolean> => {
    return handleSetSoundEnabled(!preference.enabled);
  }, [handleSetSoundEnabled, preference.enabled]);

  const state: SoundPreferenceState = {
    preference,
    soundEnabled: preference.enabled,
    loading,
    error,
  };

  const actions: SoundPreferenceActions = {
    handleSetSoundEnabled,
    handleToggleSound,
  };

  return [state, actions];
}
