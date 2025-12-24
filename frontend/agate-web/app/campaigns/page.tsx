'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getCampaigns, 
  getClients, 
  deleteCampaign,
  type CampaignListItem,
  type ClientListItem,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUSES
} from '../../lib/campaigns';

interface CampaignsPageProps {}

export default function CampaignsPage({}: CampaignsPageProps) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter, clientFilter]);

  const loadInitialData = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns(
        statusFilter || undefined, 
        clientFilter || undefined
      );
      setCampaigns(campaignsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading campaigns');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    // İlgili kampanyayı bul ve detaylarını al
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    // Detaylı uyarı mesajı oluştur
    const warningMessage = `Are you sure you want to delete "${campaign.title}"?\n\n` +
      `⚠️ WARNING: This action cannot be undone!\n\n` +
      `This will permanently delete:\n` +
      `• The campaign\n` +
      `• ${campaign.totalAdverts} advert${campaign.totalAdverts !== 1 ? 's' : ''}\n` +
      `• All concept notes\n` +
      `• All budget lines\n` +
      `• All staff assignments\n` +
      `• All AI suggestions and audit logs\n\n` +
      `Type "DELETE" to confirm:`;

    const userInput = prompt(warningMessage);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" to confirm.');
      }
      return;
    }

    setDeleteLoading(id);
    try {
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      alert(`Campaign "${campaign.title}" has been successfully deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting campaign');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <Link
            href="/campaigns/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Campaign
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              id="client-filter"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {(statusFilter || clientFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setClientFilter('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No campaigns found.</p>
            <Link
              href="/campaigns/new"
              className="text-blue-500 hover:text-blue-600 underline mt-2 inline-block"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="hover:text-blue-600"
                          >
                            {campaign.title}
                          </Link>
                        </div>
                        {campaign.startDate && campaign.endDate && (
                          <div className="text-sm text-gray-500">
                            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS] || campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="text-gray-900">
                          Est: {formatCurrency(campaign.estimatedBudget)}
                        </div>
                        <div className="text-gray-500">
                          Actual: {formatCurrency(campaign.actualCost)}
                        </div>
                        {campaign.budgetVariance !== 0 && (
                          <div className={`font-medium ${getBudgetVarianceColor(campaign.budgetVariance)}`}>
                            {campaign.budgetVariance > 0 ? '+' : ''}{formatCurrency(campaign.budgetVariance)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{campaign.totalAdverts} adverts total</div>
                        <div className="text-gray-500">
                          {campaign.completedAdverts} completed
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          disabled={deleteLoading === campaign.id}
                          className="text-red-600 hover:text-red-900 disabled:text-red-400"
                        >
                          {deleteLoading === campaign.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
