import config from '../config/api';

export const registerUser = async (email: string, name: string) => {
  const response = await fetch(`${config.API_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  return response.json();
};

export const healthCheck = async () => {
  const response = await fetch(`${config.API_URL}/health`);
  return response.json();
};
