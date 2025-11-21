'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getClientById,
  updateClient,
  type CreateClientRequest,
  type Client
} from '../../../../lib/campaigns';

interface EditClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  useEffect(() => {
    loadClient();
  }, [resolvedParams.id]);

  const loadClient = async () => {
    try {
      const clientData = await getClientById(resolvedParams.id);
      setClient(clientData);
      
      // Populate form with client data
      setFormData({
        name: clientData.name,
        address: clientData.address || '',
        contactEmail: clientData.contactEmail || '',
        contactPhone: clientData.contactPhone || '',
        notes: clientData.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading client');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Please enter a client name');
      }

      // Create update data, removing empty optional fields
      const updateData: CreateClientRequest = {
        name: formData.name.trim(),
      };

      if (formData.address?.trim()) {
        updateData.address = formData.address.trim();
      }
      if (formData.contactEmail?.trim()) {
        updateData.contactEmail = formData.contactEmail.trim();
      }
      if (formData.contactPhone?.trim()) {
        updateData.contactPhone = formData.contactPhone.trim();
      }
      if (formData.notes?.trim()) {
        updateData.notes = formData.notes.trim();
      }

      await updateClient(resolvedParams.id, updateData);
      router.push(`/clients/${resolvedParams.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateClientRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
          <div className="flex items-center space-x-4">
            <Link
              href={`/clients/${resolvedParams.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              View Client
            </Link>
            <Link
              href="/clients"
              className="text-gray-600 hover:text-gray-900"
            >
              All Clients
            </Link>
          </div>
        </div>

        {client && (
          <div className="text-sm text-gray-600">
            Editing: <strong>{client.name}</strong>
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleInputChange('name')}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter client name"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={handleInputChange('address')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter client address (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange('contactEmail')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange('contactPhone')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={handleInputChange('notes')}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any additional notes about the client (optional)"
          />
        </div>

        {client && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Campaigns:</span>
                <p className="font-semibold">{client.totalCampaigns}</p>
              </div>
              <div>
                <span className="text-gray-500">Active Campaigns:</span>
                <p className="font-semibold text-blue-600">{client.activeCampaigns}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Spent:</span>
                <p className="font-semibold text-green-600">
                  ${client.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href={`/clients/${resolvedParams.id}`}
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
