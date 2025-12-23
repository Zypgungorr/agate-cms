'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';

// Types
interface Advert {
  id: string;
  title: string;
  campaignTitle: string;
  channel: string;
  status: string;
  cost: number;
  ownerName?: string;
  publishStart?: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  title: string;
}

interface User {
  id: string;
  fullName: string;
}

const ADVERT_STATUSES = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export default function AdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdvert, setEditingAdvert] = useState<Advert | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    campaignId: '',
    channel: '',
    status: 'backlog',
    cost: 0,
    publishStart: '',
    publishEnd: '',
    ownerId: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadAdverts();
    loadCampaigns();
    loadUsers();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    console.log('API Call:', url, 'Token:', token ? 'Present' : 'Missing'); // Debug log
    
    const response = await fetch(`http://localhost:5135${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('API Response status:', response.status); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText); // Debug log
      throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };

  const loadAdverts = async () => {
    try {
      const data = await apiCall('/api/adverts');
      console.log('Loaded adverts:', data); // Debug log
      setAdverts(data);
    } catch (error) {
      console.error('Error loading adverts:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        // Token expired, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const loadCampaigns = async () => {
    try {
      const data = await apiCall('/api/campaigns');
      console.log('Loaded campaigns:', data); // Debug log
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        // Token expired, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const loadUsers = async () => {
    try {
      // Assuming there's a users endpoint - if not, we'll handle this differently
      setUsers([]); // For now, empty array
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAdvert) {
        // Update existing advert
        const updatePayload = {
          title: formData.title,
          channel: formData.channel,
          status: formData.status,
          cost: formData.cost,
          publishStart: formData.publishStart ? new Date(formData.publishStart).toISOString() : null,
          publishEnd: formData.publishEnd ? new Date(formData.publishEnd).toISOString() : null,
          ownerId: formData.ownerId && formData.ownerId.trim() !== '' ? formData.ownerId : null,
          notes: formData.notes
        };
        
        console.log('Updating advert with payload:', updatePayload); // Debug log
        
        await apiCall(`/api/adverts/${editingAdvert.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });
      } else {
        // Create new advert
        const payload = {
          campaignId: formData.campaignId,
          title: formData.title,
          channel: formData.channel,
          status: formData.status,
          cost: formData.cost,
          publishStart: formData.publishStart ? new Date(formData.publishStart).toISOString() : null,
          publishEnd: formData.publishEnd ? new Date(formData.publishEnd).toISOString() : null,
          ownerId: formData.ownerId && formData.ownerId.trim() !== '' ? formData.ownerId : null,
          notes: formData.notes
        };
        
        console.log('Creating advert with payload:', payload); // Debug log
        
        await apiCall('/api/adverts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      // Reload adverts and close modal
      await loadAdverts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving advert:', error);
      
      // Show more detailed error message
      let errorMessage = 'Error saving advert';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Failed to save advert: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advert?')) return;

    try {
      await apiCall(`/api/adverts/${id}`, { method: 'DELETE' });
      await loadAdverts();
    } catch (error) {
      console.error('Error deleting advert:', error);
      alert('Error deleting advert');
    }
  };

  const handleEdit = (advert: Advert) => {
    setEditingAdvert(advert);
    setFormData({
      title: advert.title,
      campaignId: '', // We'll need the campaign ID from the full advert data
      channel: advert.channel,
      status: advert.status,
      cost: advert.cost,
      publishStart: advert.publishStart?.split('T')[0] || '',
      publishEnd: '',
      ownerId: '',
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingAdvert(null);
    setFormData({
      title: '',
      campaignId: '',
      channel: '',
      status: 'backlog',
      cost: 0,
      publishStart: '',
      publishEnd: '',
      ownerId: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ADVERT_STATUSES.find(s => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  useEffect(() => {
    setLoading(false);
  }, [adverts]);

  if (loading && adverts.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adverts</h1>
          <p className="text-gray-600">Manage campaign advertisements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
        >
          + New Advert
        </button>
      </div>

      {/* Adverts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adverts.map((advert) => (
              <tr key={advert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{advert.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{advert.campaignTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{advert.channel}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(advert.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${advert.cost.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{advert.ownerName || 'Unassigned'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => window.location.href = `/adverts/${advert.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(advert)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(advert.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {adverts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No adverts found. Create your first advert!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {editingAdvert ? 'Edit Advert' : 'Create New Advert'}
              </h3>
              <p className="text-sm text-gray-600">
                {editingAdvert ? 'Update advert information' : 'Add a new advertisement to your campaign'}
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Form Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter advert title"
                    />
                  </div>

                  {!editingAdvert && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign *
                      </label>
                      <select
                        required
                        value={formData.campaignId}
                        onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Campaign</option>
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                      placeholder="e.g., Instagram, Facebook, TV, Print"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ADVERT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.publishStart}
                      onChange={(e) => setFormData({ ...formData, publishStart: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish End Date
                    </label>
                    <input
                      type="date"
                      value={formData.publishEnd}
                      onChange={(e) => setFormData({ ...formData, publishEnd: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Full Width Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes or comments..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    editingAdvert ? 'Update Advert' : 'Create Advert'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
