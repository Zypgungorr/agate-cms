'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getCampaignById, 
  deleteCampaign,
  type Campaign,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUSES
} from '../../../lib/campaigns';
import CampaignStaffAssignment from '../../../components/CampaignStaffAssignment';

interface CampaignDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaign();
  }, [resolvedParams.id]);

  const loadCampaign = async () => {
    try {
      const campaignData = await getCampaignById(resolvedParams.id);
      setCampaign(campaignData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;

    const confirmMessage = `Are you sure you want to delete the campaign "${campaign.title}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteCampaign(campaign.id);
      router.push('/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting campaign');
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case CAMPAIGN_STATUSES.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CAMPAIGN_STATUSES.PLANNED:
        return 'bg-blue-100 text-blue-800';
      case CAMPAIGN_STATUSES.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      case CAMPAIGN_STATUSES.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case CAMPAIGN_STATUSES.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'; // Over budget
    if (variance < 0) return 'text-green-600'; // Under budget
    return 'text-gray-600'; // On budget
  };

  const getBudgetVarianceText = (variance: number) => {
    if (variance > 0) return `Over budget by ${formatCurrency(variance)}`;
    if (variance < 0) return `Under budget by ${formatCurrency(Math.abs(variance))}`;
    return 'On budget';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Campaign not found'}
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
          <div className="flex items-center space-x-4">
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:bg-red-300 transition-colors"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <Link
          href="/campaigns"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Campaigns
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Client</label>
                <p className="text-lg text-gray-900">{campaign.clientName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                  {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS] || campaign.status}
                </span>
              </div>

              {campaign.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{campaign.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.startDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">{formatDate(campaign.startDate)}</p>
                  </div>
                )}

                {campaign.endDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">{formatDate(campaign.endDate)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{formatDate(campaign.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(campaign.updatedAt)}</p>
                </div>
              </div>

              {campaign.createdByName && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-gray-900">{campaign.createdByName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Team - Moved to top for better visibility */}
          <CampaignStaffAssignment campaignId={campaign.id} />

          {/* Budget Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Estimated</label>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(campaign.estimatedBudget)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Actual Cost</label>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(campaign.actualCost)}</p>
              </div>

              {campaign.budgetVariance !== 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Variance</label>
                  <p className={`text-lg font-semibold ${getBudgetVarianceColor(campaign.budgetVariance)}`}>
                    {getBudgetVarianceText(campaign.budgetVariance)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Adverts</label>
                <p className="text-2xl font-bold text-gray-900">{campaign.totalAdverts}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Completed</label>
                  <p className="text-lg font-semibold text-green-600">{campaign.completedAdverts}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Active</label>
                  <p className="text-lg font-semibold text-blue-600">{campaign.activeAdverts}</p>
                </div>
              </div>

              {campaign.totalAdverts > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Completion Rate</label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{
                        width: `${(campaign.completedAdverts / campaign.totalAdverts) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.round((campaign.completedAdverts / campaign.totalAdverts) * 100)}% Complete
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
