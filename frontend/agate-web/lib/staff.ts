import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5135/api';

// Types
export interface StaffListItem {
  id: string;
  fullName: string;
  email: string;
  title?: string;
  office?: string;
  isActive: boolean;
  roles: string[];
  activeCampaigns: number;
  totalCampaigns: number;
  clientContacts: number;
}

export interface StaffDetail {
  id: string;
  fullName: string;
  email: string;
  title?: string;
  office?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  activeCampaigns: number;
  completedCampaigns: number;
  totalCampaigns: number;
  clientContacts: number;
  primaryClientContacts: number;
  conceptNotes: number;
  ownedAdverts: number;
  campaignAssignments: CampaignAssignment[];
  clientAssignments: ClientAssignment[];
}

export interface CampaignAssignment {
  campaignId: string;
  campaignTitle: string;
  campaignStatus: string;
  clientName: string;
  role: string;
  assignedAt: string;
}

export interface ClientAssignment {
  clientId: string;
  clientName: string;
  isPrimary: boolean;
  assignedAt: string;
}

export interface CreateStaffDto {
  email: string;
  password: string;
  fullName: string;
  title?: string;
  office?: string;
  roles: string[];
}

export interface UpdateStaffDto {
  fullName: string;
  title?: string;
  office?: string;
  isActive: boolean;
  roles: string[];
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface AssignStaffToCampaignDto {
  staffId: string;
  role: string;
}

export interface AssignStaffToClientDto {
  staffId: string;
  isPrimary: boolean;
}

export interface StaffPerformance {
  id: string;
  fullName: string;
  title?: string;
  office?: string;
  activeCampaigns: number;
  completedCampaigns: number;
  clientContacts: number;
  conceptNotes: number;
  completedAdverts: number;
  workloadScore: number;
}

// API Functions

export async function getStaffList(includeInactive: boolean = false): Promise<StaffListItem[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff?includeInactive=${includeInactive}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff list');
  }

  return response.json();
}

export async function getStaffById(id: string): Promise<StaffDetail> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff details');
  }

  return response.json();
}

export async function createStaff(data: CreateStaffDto): Promise<StaffDetail> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create staff member');
  }

  return response.json();
}

export async function updateStaff(id: string, data: UpdateStaffDto): Promise<StaffDetail> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update staff member');
  }

  return response.json();
}

export async function changeStaffPassword(id: string, data: ChangePasswordDto): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
}

export async function deleteStaff(id: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete staff member');
  }
}

export async function getStaffCampaigns(id: string): Promise<CampaignAssignment[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}/campaigns`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff campaigns');
  }

  return response.json();
}

export async function getStaffClients(id: string): Promise<ClientAssignment[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/${id}/clients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff clients');
  }

  return response.json();
}

export async function getCampaignStaff(campaignId: string): Promise<StaffListItem[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/staff`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaign staff');
  }

  return response.json();
}

export async function assignStaffToCampaign(
  campaignId: string,
  data: AssignStaffToCampaignDto
): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign staff to campaign');
  }
}

export async function removeStaffFromCampaign(campaignId: string, staffId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/staff/${staffId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove staff from campaign');
  }
}

export async function getClientStaff(clientId: string): Promise<StaffListItem[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}/staff`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client staff');
  }

  return response.json();
}

export async function assignStaffToClient(
  clientId: string,
  data: AssignStaffToClientDto
): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign staff to client');
  }
}

export async function removeStaffFromClient(clientId: string, staffId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}/staff/${staffId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove staff from client');
  }
}

export async function getStaffPerformance(): Promise<StaffPerformance[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/staff/performance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff performance');
  }

  return response.json();
}

// Role helpers
export const ROLE_NAMES: Record<string, string> = {
  'admin': 'Admin',
  'account_manager': 'Account Manager',
  'creative': 'Creative',
  'analyst': 'Analyst',
};

export const AVAILABLE_ROLES = [
  { key: 'admin', name: 'Admin' },
  { key: 'account_manager', name: 'Account Manager' },
  { key: 'creative', name: 'Creative' },
  { key: 'analyst', name: 'Analyst' },
];

export function getRoleName(roleKey: string): string {
  return ROLE_NAMES[roleKey] || roleKey;
}

