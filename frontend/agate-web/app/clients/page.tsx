'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getClients, 
  deleteClient,
  type ClientListItem
} from '../../lib/campaigns';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    if (client.activeCampaigns > 0) {
      alert('Cannot delete client with active campaigns. Please complete or cancel all campaigns first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${client.name}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await deleteClient(id);
      setClients(clients.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
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
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <Link
            href="/clients/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Client
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No clients found.</p>
            <Link
              href="/clients/new"
              className="text-blue-500 hover:text-blue-600 underline mt-2 inline-block"
            >
              Create your first client
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaigns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:text-blue-600"
                        >
                          {client.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {client.contactEmail && (
                          <div>{client.contactEmail}</div>
                        )}
                        {client.contactPhone && (
                          <div className="text-gray-500">{client.contactPhone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{client.totalCampaigns} total</div>
                        <div className="text-gray-500">
                          {client.activeCampaigns} active
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(client.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/clients/${client.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={deleteLoading === client.id || client.activeCampaigns > 0}
                          className="text-red-600 hover:text-red-900 disabled:text-red-400"
                          title={client.activeCampaigns > 0 ? 'Cannot delete client with active campaigns' : ''}
                        >
                          {deleteLoading === client.id ? 'Deleting...' : 'Delete'}
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
