'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getClientById, 
  deleteClient,
  getCampaigns,
  type Client,
  type CampaignListItem
} from '../../../lib/campaigns';
import ClientStaffContacts from '../../../components/ClientStaffContacts';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClientData();
  }, [resolvedParams.id]);

  const loadClientData = async () => {
    try {
      const [clientData, campaignsData] = await Promise.all([
        getClientById(resolvedParams.id),
        getCampaigns(undefined, resolvedParams.id) // Get campaigns for this client
      ]);
      
      setClient(clientData);
      setCampaigns(campaignsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading client');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    if (client.activeCampaigns > 0) {
      alert('Cannot delete client with active campaigns. Please complete or cancel all campaigns first.');
      return;
    }

    const confirmMessage = `Are you sure you want to delete the client "${client.name}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteClient(client.id);
      router.push('/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Client not found'}
        </div>
        <Link
          href="/clients"
          className="text-blue-500 hover:text-blue-600 underline mt-4 inline-block"
        >
          ← Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <div className="flex items-center space-x-4">
            <Link
              href={`/campaigns/new?clientId=${client.id}`}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              New Campaign
            </Link>
            <Link
              href={`/clients/${client.id}/edit`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteLoading || client.activeCampaigns > 0}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:bg-red-300 transition-colors"
              title={client.activeCampaigns > 0 ? 'Cannot delete client with active campaigns' : ''}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <Link
          href="/clients"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Clients
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg text-gray-900">{client.name}</p>
              </div>

              {client.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{client.address}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.contactEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <a 
                      href={`mailto:${client.contactEmail}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.contactEmail}
                    </a>
                  </div>
                )}

                {client.contactPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <a 
                      href={`tel:${client.contactPhone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.contactPhone}
                    </a>
                  </div>
                )}
              </div>

              {client.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{formatDate(client.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(client.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
              <Link
                href={`/campaigns/new?clientId=${client.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + New Campaign
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No campaigns found for this client.</p>
                <Link
                  href={`/campaigns/new?clientId=${client.id}`}
                  className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                >
                  Create the first campaign
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="hover:text-blue-600"
                          >
                            {campaign.title}
                          </Link>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Budget: {formatCurrency(campaign.estimatedBudget)} 
                          {campaign.actualCost > 0 && (
                            <span className="ml-2">
                              | Spent: {formatCurrency(campaign.actualCost)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {campaign.totalAdverts} adverts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Client Staff Contacts - Moved to top for better visibility */}
          <ClientStaffContacts clientId={client.id} />

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Campaigns</label>
                <p className="text-2xl font-bold text-gray-900">{client.totalCampaigns}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Active Campaigns</label>
                <p className="text-2xl font-bold text-blue-600">{client.activeCampaigns}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Total Spent</label>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(client.totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
