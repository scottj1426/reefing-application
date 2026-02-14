import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { ApiResponse, User } from '../types/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useUser = () => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeader = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const getMe = async (): Promise<User> => {
    const headers = await getAuthHeader();
    const response = await axios.get<ApiResponse<User>>(`${API_URL}/api/users/me`, { headers });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch user');
    }

    return response.data.data;
  };

  const uploadProfileImage = async (file: File): Promise<User> => {
    const headers = await getAuthHeader();
    const formData = new FormData();
    formData.append('photo', file);

    const response = await axios.post<ApiResponse<User>>(
      `${API_URL}/api/users/me/photo`,
      formData,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to upload profile image');
    }

    return response.data.data;
  };

  const deleteProfileImage = async (): Promise<User> => {
    const headers = await getAuthHeader();
    const response = await axios.delete<ApiResponse<User>>(`${API_URL}/api/users/me/photo`, { headers });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to delete profile image');
    }

    return response.data.data;
  };

  return {
    getMe,
    uploadProfileImage,
    deleteProfileImage,
  };
};
