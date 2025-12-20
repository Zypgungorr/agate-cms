'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCampaignById,
  updateCampaign,
  getClients,
  type UpdateCampaignRequest,
  type Campaign,
  type ClientListItem,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUSES
} from '../../../../lib/campaigns';

interface EditCampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateCampaignRequest>({
    title: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
    estimatedBudget: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, [resolvedParams.id]);

  const loadInitialData = async () => {
    try {
      const [campaignData, clientsData] = await Promise.all([
        getCampaignById(resolvedParams.id),
        getClients()
      ]);

      setCampaign(campaignData);
      setClients(clientsData);

      // Populate form with campaign data
      setFormData({
        title: campaignData.title,
        description: campaignData.description || '',
        status: campaignData.status,
        startDate: campaignData.startDate ? campaignData.startDate.split('T')[0] : '',
        endDate: campaignData.endDate ? campaignData.endDate.split('T')[0] : '',
        estimatedBudget: campaignData.estimatedBudget,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Please enter a campaign title');
      }

      // Create update data, removing empty optional fields
      const updateData: UpdateCampaignRequest = {
        title: formData.title.trim(),
        status: formData.status,
        estimatedBudget: formData.estimatedBudget,
        description: formData.description?.trim() || '',
      };

      if (formData.startDate) {
        updateData.startDate = formData.startDate;
      }
      if (formData.endDate) {
        updateData.endDate = formData.endDate;
      }

      await updateCampaign(resolvedParams.id, updateData);
      router.push(`/campaigns/${resolvedParams.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCampaignRequest) => (
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link
          href="/campaigns"
          className="text-blue-500 hover:text-blue-600 underline mt-4 inline-block"
        >
          ← Back to Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <div className="flex items-center space-x-4">
            <Link
              href={`/campaigns/${resolvedParams.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              View Campaign
            </Link>
            <Link
              href="/campaigns"
              className="text-gray-600 hover:text-gray-900"
            >
              All Campaigns
            </Link>
          </div>
        </div>

        {campaign && (
          <div className="text-sm text-gray-600">
            Editing: <strong>{campaign.title}</strong> for <strong>{campaign.clientName}</strong>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
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
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={handleInputChange('status')}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
              min={formData.startDate}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="estimatedBudget"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Estimated Budget ($) *
          </label>

          <input
            type="text"
            id="estimatedBudget"
            value={formData.estimatedBudget}
            onChange={handleInputChange("estimatedBudget")}
            inputMode="decimal"
            placeholder="0.00"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>



        {campaign && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Budget Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Estimated:</span>
                <p className="font-semibold">{formatCurrency(campaign.estimatedBudget)}</p>
              </div>
              <div>
                <span className="text-gray-500">Actual Cost:</span>
                <p className="font-semibold">{formatCurrency(campaign.actualCost)}</p>
              </div>
              <div>
                <span className="text-gray-500">Variance:</span>
                <p className={`font-semibold ${campaign.budgetVariance > 0 ? 'text-red-600' :
                    campaign.budgetVariance < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                  {campaign.budgetVariance > 0 ? '+' : ''}{formatCurrency(campaign.budgetVariance)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href={`/campaigns/${resolvedParams.id}`}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
