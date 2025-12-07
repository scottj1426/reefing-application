import { useAuth0 } from '@auth0/auth0-react';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const getAuthHeaders = async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Keep this hook for potential future user-related API calls
  return {
    getAuthHeaders,
  };
};
