// AI API functions
import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:5135/api';

export interface CampaignSuggestionRequest {
  campaignId: string;
  analysisType?: string; // "performance", "ideas", "optimization"
  additionalContext?: string;
}

export interface CreativeIdeaRequest {
  campaignId: string;
  conceptNoteId?: string;
  requestType: string; // "creative", "concept", "tagline", "visual"
  brief?: string;
  targetAudience?: string;
  tone?: string; // "professional", "casual", "humorous", "emotional"
}

export interface CampaignPerformanceAnalysis {
  summary: string;
  budgetUtilization: number;
  advertCompletionRate: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CampaignIdea {
  title: string;
  description: string;
  category: string;
  priority: number;
}

export interface CreativeIdea {
  title: string;
  description: string;
  type: string;
  tags: string[];
  rationale?: string;
}

export interface CampaignSuggestionResponse {
  campaignId: string;
  analysisType: string;
  content: string;
  suggestions: string[];
  metadata?: Record<string, any>;
  generatedAt: string;
  performanceAnalysis?: CampaignPerformanceAnalysis;
  ideas: CampaignIdea[];
}

export interface CreativeIdeaResponse {
  campaignId: string;
  conceptNoteId?: string;
  requestType: string;
  content: string;
  suggestions: string[];
  metadata?: Record<string, any>;
  generatedAt: string;
  ideas: CreativeIdea[];
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
}

// AI API calls
export async function getCampaignSuggestion(
  request: CampaignSuggestionRequest
): Promise<CampaignSuggestionResponse> {
  return apiRequest('/ai/campaign-suggestion', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getCreativeIdea(
  request: CreativeIdeaRequest
): Promise<CreativeIdeaResponse> {
  return apiRequest('/ai/creative-idea', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// PDF Export functions
export async function exportCampaignSuggestionPdf(
  report: CampaignSuggestionResponse
): Promise<Blob> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/ai/campaign-suggestion/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.blob();
}

export async function exportCreativeIdeaPdf(
  report: CreativeIdeaResponse
): Promise<Blob> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/ai/creative-idea/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.blob();
}

