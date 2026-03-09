import api from './client';
import { Community, Membership, WaitingListEntry, TransferRequest, PaginatedData } from '@types/models';

export interface CreateCommunityPayload {
  name: string;
  description?: string;
  type: 'urban' | 'suburban' | 'rural' | 'resort' | 'commercial';
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  is_public: boolean;
  lifestyle_tags?: string[];
  reserve_pct?: number;
}

export interface ApplyCommunityPayload {
  property_id: string;
  message?: string;
}

export const communitiesApi = {
  // List + discovery
  list: async (params?: {
    mine?: boolean;
    type?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<Community>> => {
    const searchParams = new URLSearchParams();
    if (params?.mine) searchParams.append('mine', 'true');
    if (params?.type) searchParams.append('type', params.type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const { data } = await api.get(`/communities?${searchParams}`);
    return { data: data.data ?? [], meta: data.meta };
  },

  nearby: async (lat: number, lng: number, radius = 50): Promise<Community[]> => {
    const { data } = await api.get(`/communities/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return data.data ?? [];
  },

  get: async (id: string): Promise<Community> => {
    const { data } = await api.get(`/communities/${id}`);
    return data.data;
  },

  create: async (payload: CreateCommunityPayload): Promise<Community> => {
    const { data } = await api.post('/communities', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateCommunityPayload>): Promise<Community> => {
    const { data } = await api.patch(`/communities/${id}`, payload);
    return data.data;
  },

  // Membership
  apply: async (id: string, payload: ApplyCommunityPayload): Promise<Membership> => {
    const { data } = await api.post(`/communities/${id}/apply`, payload);
    return data.data;
  },

  approveMember: async (id: string, userId: string): Promise<void> => {
    await api.post(`/communities/${id}/members/${userId}/approve`);
  },

  rejectMember: async (id: string, userId: string): Promise<void> => {
    await api.post(`/communities/${id}/members/${userId}/reject`);
  },

  leave: async (id: string): Promise<void> => {
    await api.post(`/communities/${id}/leave`);
  },

  getMembers: async (id: string): Promise<Membership[]> => {
    const { data } = await api.get(`/communities/${id}/members`);
    return data.data ?? [];
  },

  // Fund
  distributeIncome: async (id: string): Promise<void> => {
    await api.post(`/communities/${id}/fund/distribute`);
  },

  getFundSummary: async (id: string) => {
    const { data } = await api.get(`/communities/${id}/fund/summary`);
    return data.data;
  },

  getFundTransactions: async (id: string, page = 1, limit = 20) => {
    const { data } = await api.get(`/communities/${id}/fund/transactions?page=${page}&limit=${limit}`);
    return { data: data.data ?? [], meta: data.meta };
  },

  // Waiting list
  joinWaitingList: async (id: string): Promise<WaitingListEntry> => {
    const { data } = await api.post(`/communities/${id}/waiting-list`);
    return data.data;
  },

  getWaitingList: async (id: string): Promise<WaitingListEntry[]> => {
    const { data } = await api.get(`/communities/${id}/waiting-list`);
    return data.data ?? [];
  },

  // Transfer
  requestTransfer: async (fromId: string, toId: string, message?: string): Promise<TransferRequest> => {
    const { data } = await api.post(`/communities/${fromId}/transfer-request`, {
      to_community_id: toId,
      message,
    });
    return data.data;
  },
};
