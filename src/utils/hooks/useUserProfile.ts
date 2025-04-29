// Updated useUserProfile.ts
import { useState, useEffect } from 'react';
import { useApi } from '../services/apiService';
import { useSnackbar } from '../../context/SnackbarContext';

export interface UserProfile {
  milestones: {
    sales: number;
    purchases: number;
  };
  _id: string;
  googleId: string;
  email: string;
  name: string;
  profileImage: string;
  isMerchant: boolean;
  rating: number;
  totalPoints: number;
  availablePoints: number;
  referralCount: number;
  isReferralCodeUsed: boolean;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getUserProfile } = useApi();
  const { showSnackbar } = useSnackbar();

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getUserProfile();
      
      if (response.ok) {
        setProfile(response.data);
      } else {
        const errorMessage = response.data?.message || 'Failed to fetch profile data';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { 
    profile, 
    isLoading, 
    error, 
    refetchProfile: fetchProfile 
  };
};