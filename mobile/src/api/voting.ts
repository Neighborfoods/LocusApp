import api from './client';
import { Vote, VoteResultResponse, Ballot } from '@types/models';

export interface CreateVotePayload {
  title: string;
  description?: string;
  type: 'general' | 'property_related' | 'expense' | 'new_member' | 'rule_change' | 'purchase';
  target_property_id?: string;
  ends_at?: string; // ISO date
  min_quorum_pct?: number;
}

export const votingApi = {
  list: async (communityId: string, params?: {
    status?: 'active' | 'pending' | 'completed' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<Vote[]> => {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const { data } = await api.get(`/communities/${communityId}/votes?${sp}`);
    return data.data ?? [];
  },

  get: async (communityId: string, voteId: string): Promise<Vote> => {
    const { data } = await api.get(`/communities/${communityId}/votes/${voteId}`);
    return data.data;
  },

  create: async (communityId: string, payload: CreateVotePayload): Promise<Vote> => {
    const { data } = await api.post(`/communities/${communityId}/votes`, payload);
    return data.data;
  },

  cast: async (communityId: string, voteId: string, choice: 'yes' | 'no' | 'abstain'): Promise<Ballot> => {
    const { data } = await api.post(`/communities/${communityId}/votes/${voteId}/cast`, { choice });
    return data.data;
  },

  vetoAsOwner: async (communityId: string, voteId: string, reason: string): Promise<void> => {
    await api.post(`/communities/${communityId}/votes/${voteId}/veto`, { reason });
  },

  close: async (communityId: string, voteId: string): Promise<Vote> => {
    const { data } = await api.post(`/communities/${communityId}/votes/${voteId}/close`);
    return data.data;
  },

  getResults: async (communityId: string, voteId: string): Promise<VoteResultResponse> => {
    const { data } = await api.get(`/communities/${communityId}/votes/${voteId}/results`);
    return data.data;
  },
};
