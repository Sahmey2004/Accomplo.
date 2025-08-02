import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage';
import { useOfflineAuth } from './useOfflineAuth';

interface Accomplishment {
  id: string;
  content: string;
  type: 'big' | 'small';
  category: string;
  month_year: string;
  created_at: string;
  profile_id: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useOfflineData() {
  const { user } = useOfflineAuth();
  const [accomplishments, setAccomplishments] = useLocalStorage<Accomplishment[]>(
    `${STORAGE_KEYS.ACCOMPLISHMENTS}_${user?.id || 'guest'}`, 
    []
  );
  const [profile, setProfile] = useLocalStorage<Profile | null>(
    `${STORAGE_KEYS.PROFILE}_${user?.id || 'guest'}`, 
    null
  );

  // Initialize profile when user logs in
  const initializeProfile = () => {
    if (user && !profile) {
      const newProfile: Profile = {
        id: `profile_${user.id}`,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(newProfile);
      return newProfile;
    }
    return profile;
  };

  // Add accomplishment
  const addAccomplishment = (accomplishment: Omit<Accomplishment, 'id' | 'created_at' | 'profile_id'>) => {
    if (!user) return null;
    
    const currentProfile = profile || initializeProfile();
    if (!currentProfile) return null;

    const newAccomplishment: Accomplishment = {
      ...accomplishment,
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      profile_id: currentProfile.id,
    };

    setAccomplishments(prev => [newAccomplishment, ...prev]);
    return newAccomplishment;
  };

  // Update profile
  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile) return null;
    
    const updatedProfile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Delete accomplishment
  const deleteAccomplishment = (id: string) => {
    setAccomplishments(prev => prev.filter(acc => acc.id !== id));
  };

  // Clear all data (for sign out)
  const clearData = () => {
    setAccomplishments([]);
    setProfile(null);
  };

  return {
    accomplishments,
    profile: profile || initializeProfile(),
    addAccomplishment,
    updateProfile,
    deleteAccomplishment,
    clearData,
    isLoading: false, // Always false for offline mode
  };
}