// Campaign API functions
import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:5135/api';

export interface Campaign {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget: number;
  actualCost: number;
  budgetVariance: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  totalAdverts: number;
  completedAdverts: number;
  activeAdverts: number;
}

export interface CampaignListItem {
  id: string;
  clientName: string;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget: number;
  actualCost: number;
  budgetVariance: number;
  totalAdverts: number;
  completedAdverts: number;
  activeAdverts: number;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  clientId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget: number;
}

export interface UpdateCampaignRequest {
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget: number;
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
}

export interface ClientListItem {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  totalCampaigns: number;
  activeCampaigns: number;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Campaign API calls
export async function getCampaigns(status?: string, clientId?: string): Promise<CampaignListItem[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (clientId) params.append('clientId', clientId);
  
  const query = params.toString();
  return apiRequest(`/campaigns${query ? `?${query}` : ''}`);
}

export async function getCampaignById(id: string): Promise<Campaign> {
  return apiRequest(`/campaigns/${id}`);
}

export async function createCampaign(campaign: CreateCampaignRequest): Promise<Campaign> {
  return apiRequest('/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });
}

export async function updateCampaign(id: string, campaign: UpdateCampaignRequest): Promise<Campaign> {
  return apiRequest(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(campaign),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiRequest(`/campaigns/${id}`, { method: 'DELETE' });
}

// Client API calls
export async function getClients(): Promise<ClientListItem[]> {
  return apiRequest('/clients');
}

export async function getClientById(id: string): Promise<Client> {
  return apiRequest(`/clients/${id}`);
}

export async function createClient(client: CreateClientRequest): Promise<Client> {
  return apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
}

export async function updateClient(id: string, client: CreateClientRequest): Promise<Client> {
  return apiRequest(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });
}

export async function deleteClient(id: string): Promise<void> {
  await apiRequest(`/clients/${id}`, { method: 'DELETE' });
}

// Campaign status constants
export const CAMPAIGN_STATUSES = {
  PLANNED: 'planned',
  ACTIVE: 'active', 
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const CAMPAIGN_STATUS_LABELS = {
  [CAMPAIGN_STATUSES.PLANNED]: 'Planned',
  [CAMPAIGN_STATUSES.ACTIVE]: 'Active',
  [CAMPAIGN_STATUSES.ON_HOLD]: 'On Hold', 
  [CAMPAIGN_STATUSES.COMPLETED]: 'Completed',
  [CAMPAIGN_STATUSES.CANCELLED]: 'Cancelled',
} as const;
