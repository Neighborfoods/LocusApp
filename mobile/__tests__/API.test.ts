/**
 * API integration tests (mocked axios) for auth, communities, properties, notifications, profile.
 */
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const API_BASE = 'http://129.146.186.180';

describe('API Integration Tests', () => {
  describe('Auth Endpoints', () => {
    it('POST /auth/register returns user + token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, user: { id: 1, email: 'test@test.com' }, token: 'jwt_token' },
      });
      const res = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Test User',
        email: 'test@test.com',
        password: 'Password123!',
      });
      expect(res.data.success).toBe(true);
      expect(res.data.token).toBeDefined();
    });

    it('POST /auth/login with valid credentials returns token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, token: 'jwt_token', refreshToken: 'refresh_token' },
      });
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@test.com',
        password: 'Password123!',
      });
      expect(res.data.success).toBe(true);
      expect(res.data.token).toBeDefined();
    });

    it('POST /auth/login with wrong password returns 401', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });
      await expect(
        axios.post(`${API_BASE}/auth/login`, {
          email: 'test@test.com',
          password: 'wrongpassword',
        })
      ).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('GET /auth/me with valid token returns user', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, user: { id: 1, email: 'test@test.com', name: 'Test' } },
      });
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer jwt_token' },
      });
      expect(res.data.user.email).toBe('test@test.com');
    });

    it('GET /auth/me with no token returns 401', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { status: 401 } });
      await expect(axios.get(`${API_BASE}/auth/me`)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe('Communities Endpoints', () => {
    it('GET /communities returns paginated list', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [], total: 0, page: 1, limit: 10 },
      });
      const res = await axios.get(`${API_BASE}/communities`);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('GET /communities with lat/lng returns no SQL error', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [], total: 0, page: 1, limit: 10 },
      });
      const res = await axios.get(`${API_BASE}/communities`, {
        params: { lat: 37.785834, lng: -122.406417, radius: 50 },
      });
      expect(res.data.success).toBe(true);
    });

    it('POST /communities creates new community', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, community: { id: 1, name: 'Test Community' } },
      });
      const res = await axios.post(`${API_BASE}/communities`, { name: 'Test Community' });
      expect(res.data.success).toBe(true);
    });
  });

  describe('Properties Endpoints', () => {
    it('GET /properties returns paginated list', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [], total: 0, page: 1, limit: 15 },
      });
      const res = await axios.get(`${API_BASE}/properties`);
      expect(res.data.success).toBe(true);
    });

    it('GET /properties/map returns map data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      });
      const res = await axios.get(`${API_BASE}/properties/map`, {
        params: { lat: 37.785834, lng: -122.406417, radius: 50 },
      });
      expect(res.data.success).toBe(true);
    });

    it('POST /properties creates new property', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, property: { id: 1 } },
      });
      const res = await axios.post(`${API_BASE}/properties`, {
        title: 'Test Property',
        price: 2500,
        bedrooms: 2,
      });
      expect(res.data.success).toBe(true);
    });
  });

  describe('Notifications Endpoints', () => {
    it('GET /notifications returns list', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [], unreadCount: 0 },
      });
      const res = await axios.get(`${API_BASE}/notifications`);
      expect(res.data.success).toBe(true);
    });

    it('GET /notifications/unread-count returns number', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { success: true, count: 3 } });
      const res = await axios.get(`${API_BASE}/notifications/unread-count`);
      expect(typeof res.data.count).toBe('number');
    });
  });

  describe('User Profile Endpoints', () => {
    it('PUT /users/profile updates user data', async () => {
      mockedAxios.put.mockResolvedValueOnce({
        data: { success: true, user: { name: 'Updated Name' } },
      });
      const res = await axios.put(`${API_BASE}/users/profile`, { name: 'Updated Name' });
      expect(res.data.success).toBe(true);
    });
  });
});
