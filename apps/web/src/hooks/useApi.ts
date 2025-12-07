import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { User, ApiResponse } from '../types/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const syncUser = async (): Promise<User> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<ApiResponse<User>>(
      `${API_URL}/api/users/sync`,
      {},
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to sync user');
    }

    return response.data.data;
  };

  const getCurrentUser = async (): Promise<User> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<User>>(
      `${API_URL}/api/users/me`,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get current user');
    }

    return response.data.data;
  };

  return {
    syncUser,
    getCurrentUser,
  };
};
