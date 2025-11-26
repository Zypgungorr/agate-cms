'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createClient,
  type CreateClientRequest
} from '../../../lib/campaigns';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Please enter a client name');
      }

      // Create client data, removing empty optional fields
      const clientData: CreateClientRequest = {
        name: formData.name.trim(),
      };

      if (formData.address?.trim()) {
        clientData.address = formData.address.trim();
      }
      if (formData.contactEmail?.trim()) {
        clientData.contactEmail = formData.contactEmail.trim();
      }
      if (formData.contactPhone?.trim()) {
        clientData.contactPhone = formData.contactPhone.trim();
      }
      if (formData.notes?.trim()) {
        clientData.notes = formData.notes.trim();
      }

      const newClient = await createClient(clientData);
      router.push(`/clients/${newClient.id}`);
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Create New Client</h1>
          <Link
            href="/clients"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Clients
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
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

        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/clients"
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
