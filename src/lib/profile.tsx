import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ALL_MORPHOLOGIES } from './morphology';
import { GENDERS } from './gender';
import type { UserProfile } from './types';

const STORAGE_KEY = 'owz.profile.v1';

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  saveProfile: (profile: UserProfile) => Promise<void>;
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  saveProfile: async () => {},
  resetProfile: async () => {},
});

function parseProfile(raw: string | null): UserProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile> & { clothingSize?: string };
    if (
      parsed &&
      typeof parsed.budget === 'number' &&
      parsed.budget > 0 &&
      typeof parsed.morphology === 'string' &&
      (ALL_MORPHOLOGIES as string[]).includes(parsed.morphology)
    ) {
      return {
        gender:
          typeof parsed.gender === 'string' && (GENDERS as string[]).includes(parsed.gender)
            ? parsed.gender
            : 'femme',
        morphology: parsed.morphology,
        budget: parsed.budget,
        modestMode: parsed.modestMode === true,
        clothingSizes: Array.isArray(parsed.clothingSizes)
          ? parsed.clothingSizes.filter((s): s is string => typeof s === 'string')
          : typeof parsed.clothingSize === 'string' && parsed.clothingSize
            ? [parsed.clothingSize]
            : [],
        favoriteColors: Array.isArray(parsed.favoriteColors)
          ? parsed.favoriteColors.filter((c): c is string => typeof c === 'string')
          : [],
      } as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) setProfile(parseProfile(raw));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = useCallback(async (next: UserProfile) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const resetProfile = useCallback(async () => {
    setProfile(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ profile, loading, saveProfile, resetProfile }),
    [profile, loading, saveProfile, resetProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}
