import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage';
import { useToast } from './use-toast';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface OfflineAuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const OfflineAuthContext = createContext<OfflineAuthContextType | undefined>(undefined);

export function OfflineAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEYS.USER, null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('accomplo_all_users') || '[]');
      const userExists = existingUsers.find((u: any) => u.email === email);
      
      if (userExists) {
        setLoading(false);
        return { error: { message: 'User already exists with this email' } };
      }
      
      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: {
          display_name: metadata?.display_name || email.split('@')[0],
          avatar_url: metadata?.avatar_url || null,
        }
      };
      
      // Store user credentials (in real app, never store passwords in plain text!)
      const userCredentials = { email, password, user: newUser };
      existingUsers.push(userCredentials);
      localStorage.setItem('accomplo_all_users', JSON.stringify(existingUsers));
      
      // Set current user
      setUser(newUser);
      setLoading(false);
      
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: { message: 'Failed to create account' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const existingUsers = JSON.parse(localStorage.getItem('accomplo_all_users') || '[]');
      const userCredentials = existingUsers.find((u: any) => u.email === email && u.password === password);
      
      if (!userCredentials) {
        setLoading(false);
        return { error: { message: 'Invalid email or password' } };
      }
      
      setUser(userCredentials.user);
      setLoading(false);
      
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: { message: 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      // Clear user-specific data
      localStorage.removeItem(STORAGE_KEYS.ACCOMPLISHMENTS);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to sign out' } };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }
    
    try {
      // Update password in storage
      const existingUsers = JSON.parse(localStorage.getItem('accomplo_all_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.user.id === user.id);
      
      if (userIndex !== -1) {
        existingUsers[userIndex].password = newPassword;
        localStorage.setItem('accomplo_all_users', JSON.stringify(existingUsers));
      }
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to update password' } };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
  };

  return <OfflineAuthContext.Provider value={value}>{children}</OfflineAuthContext.Provider>;
}

export function useOfflineAuth() {
  const context = useContext(OfflineAuthContext);
  if (context === undefined) {
    throw new Error('useOfflineAuth must be used within an OfflineAuthProvider');
  }
  return context;
}