import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { Coral, ApiResponse, CreateCoralDto } from '../types/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useCorals = (aquariumId: string) => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const getCorals = async (): Promise<Coral[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<Coral[]>>(
      `${API_URL}/api/aquariums/${aquariumId}/corals`,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch corals');
    }

    return response.data.data;
  };

  const createCoral = async (data: CreateCoralDto): Promise<Coral> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<ApiResponse<Coral>>(
      `${API_URL}/api/aquariums/${aquariumId}/corals`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to create coral');
    }

    return response.data.data;
  };

  const updateCoral = async (id: string, data: Partial<CreateCoralDto>): Promise<Coral> => {
    const headers = await getAuthHeaders();
    const response = await axios.put<ApiResponse<Coral>>(
      `${API_URL}/api/aquariums/${aquariumId}/corals/${id}`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update coral');
    }

    return response.data.data;
  };

  const deleteCoral = async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/aquariums/${aquariumId}/corals/${id}`, { headers });
  };

  return {
    getCorals,
    createCoral,
    updateCoral,
    deleteCoral,
  };
};
