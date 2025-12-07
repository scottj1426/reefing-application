import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import type { Equipment, ApiResponse, CreateEquipmentDto } from '../types/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useEquipment = (aquariumId: string) => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const getEquipment = async (): Promise<Equipment[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<ApiResponse<Equipment[]>>(
      `${API_URL}/aquariums/${aquariumId}/equipment`,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch equipment');
    }

    return response.data.data;
  };

  const createEquipment = async (data: CreateEquipmentDto): Promise<Equipment> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<ApiResponse<Equipment>>(
      `${API_URL}/aquariums/${aquariumId}/equipment`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to create equipment');
    }

    return response.data.data;
  };

  const updateEquipment = async (
    id: string,
    data: Partial<CreateEquipmentDto>
  ): Promise<Equipment> => {
    const headers = await getAuthHeaders();
    const response = await axios.put<ApiResponse<Equipment>>(
      `${API_URL}/aquariums/${aquariumId}/equipment/${id}`,
      data,
      { headers }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to update equipment');
    }

    return response.data.data;
  };

  const deleteEquipment = async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/aquariums/${aquariumId}/equipment/${id}`, { headers });
  };

  return {
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
};
