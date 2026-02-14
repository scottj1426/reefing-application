import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { Aquarium, ApiResponse, CreateAquariumDto } from '../types/shared';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export const useAquariums = () => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const getAuthHeader = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const getAquariums = async (): Promise<Aquarium[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<Aquarium[]>>(
      `${API_URL}/api/aquariums`,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch aquariums');
    }

    return response.data.data;
  };

  const getAquarium = async (id: string): Promise<Aquarium> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<Aquarium>>(
      `${API_URL}/api/aquariums/${id}`,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch aquarium');
    }

    return response.data.data;
  };

  const createAquarium = async (data: CreateAquariumDto): Promise<Aquarium> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<ApiResponse<Aquarium>>(
      `${API_URL}/api/aquariums`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to create aquarium');
    }

    return response.data.data;
  };

  const updateAquarium = async (
    id: string,
    data: Partial<CreateAquariumDto>
  ): Promise<Aquarium> => {
    const headers = await getAuthHeaders();
    const response = await axios.put<ApiResponse<Aquarium>>(
      `${API_URL}/api/aquariums/${id}`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update aquarium');
    }

    return response.data.data;
  };

  const deleteAquarium = async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/aquariums/${id}`, { headers });
  };

  const uploadAquariumPhotos = async (id: string, files: File[]): Promise<Aquarium> => {
    try {
      const headers = await getAuthHeader();
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));

      const response = await axios.post<ApiResponse<Aquarium>>(
        `${API_URL}/api/aquariums/${id}/photos`,
        formData,
        { headers }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to upload aquarium photos');
      }

      return response.data.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to upload aquarium photos';
      throw new Error(message);
    }
  };

  const deleteAquariumPhoto = async (aquariumId: string, photoId: string): Promise<Aquarium> => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.delete<ApiResponse<Aquarium>>(
        `${API_URL}/api/aquariums/${aquariumId}/photos/${photoId}`,
        { headers }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to delete aquarium photo');
      }

      return response.data.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete aquarium photo';
      throw new Error(message);
    }
  };

  return {
    getAquariums,
    getAquarium,
    createAquarium,
    updateAquarium,
    deleteAquarium,
    uploadAquariumPhotos,
    deleteAquariumPhoto,
  };
};
