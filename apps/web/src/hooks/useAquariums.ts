import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { Aquarium, ApiResponse, CreateAquariumDto } from '../types/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useAquariums = () => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const getAquariums = async (): Promise<Aquarium[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<Aquarium[]>>(
      `${API_URL}/aquariums`,
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
      `${API_URL}/aquariums/${id}`,
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
      `${API_URL}/aquariums`,
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
      `${API_URL}/aquariums/${id}`,
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
    await axios.delete(`${API_URL}/aquariums/${id}`, { headers });
  };

  return {
    getAquariums,
    getAquarium,
    createAquarium,
    updateAquarium,
    deleteAquarium,
  };
};
