'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createCampaign,
  getClients,
  type CreateCampaignRequest,
  type ClientListItem,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUSES
} from '../../../lib/campaigns';

export default function NewCampaignPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    clientId: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    estimatedBudget: 0,
  });

  useEffect(() => {
    loadClients();
    
    // Check for clientId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId');
    if (clientId) {
      setFormData(prev => ({ ...prev, clientId }));
    }
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading clients');
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.clientId) {
        throw new Error('Please select a client');
      }
      if (!formData.title.trim()) {
        throw new Error('Please enter a campaign title');
      }

      // Create campaign data, removing empty optional fields
      const campaignData: CreateCampaignRequest = {
        clientId: formData.clientId,
        title: formData.title.trim(),
        estimatedBudget: formData.estimatedBudget,
      };

      if (formData.description?.trim()) {
        campaignData.description = formData.description.trim();
      }
      if (formData.startDate) {
        campaignData.startDate = formData.startDate;
      }
      if (formData.endDate) {
        campaignData.endDate = formData.endDate;
      }

      const newCampaign = await createCampaign(campaignData);
      router.push(`/campaigns/${newCampaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCampaignRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'estimatedBudget' 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <Link
            href="/campaigns"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Campaigns
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {clients.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
            <p>No clients found. You need to create a client first before creating a campaign.</p>
            <Link
              href="/clients/new"
              className="text-yellow-800 hover:text-yellow-900 underline font-medium"
            >
              Create a client →
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <select
            id="clientId"
            value={formData.clientId}
            onChange={handleInputChange('clientId')}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleInputChange('title')}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter campaign title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange('description')}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter campaign description (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={handleInputChange('startDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={handleInputChange('endDate')}
              min={formData.startDate} // Prevent end date before start date
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Budget ($)
          </label>
          <input
            type="number"
            id="estimatedBudget"
            value={formData.estimatedBudget}
            onChange={handleInputChange('estimatedBudget')}
            min="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/campaigns"
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || clients.length === 0}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}
