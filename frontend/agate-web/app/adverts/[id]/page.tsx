'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface AdvertDetail {
  id: string;
  title: string;
  campaignId: string;
  campaignTitle: string;
  channel: string;
  status: string;
  cost: number;
  publishStart?: string;
  publishEnd?: string;
  ownerId?: string;
  ownerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ADVERT_STATUSES = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export default function AdvertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [advert, setAdvert] = useState<AdvertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdvertDetail();
  }, [unwrappedParams.id]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    const response = await fetch(`http://localhost:5135${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  const loadAdvertDetail = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/api/adverts/${unwrappedParams.id}`);
      setAdvert(data);
      setError(null);
    } catch (error) {
      console.error('Error loading advert:', error);
      setError('Failed to load advert details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ADVERT_STATUSES.find(s => s.value === status);
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error || !advert) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Advert not found'}</p>
          <button
            onClick={() => router.push('/adverts')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Back to Adverts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/adverts')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Adverts
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{advert.title}</h1>
            <p className="text-gray-600">Campaign: {advert.campaignTitle}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/adverts?edit=${advert.id}`)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium"
            >
              Edit Advert
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div>{getStatusBadge(advert.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Channel</label>
                <p className="text-gray-900 font-medium">{advert.channel}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Cost</label>
                <p className="text-gray-900 font-medium text-lg">${advert.cost.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Owner</label>
                <p className="text-gray-900 font-medium">{advert.ownerName || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {/* Publishing Schedule Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Publishing Schedule</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <p className="text-gray-900">{formatDate(advert.publishStart)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                <p className="text-gray-900">{formatDate(advert.publishEnd)}</p>
              </div>
            </div>
            {advert.publishStart && advert.publishEnd && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Duration: {Math.ceil((new Date(advert.publishEnd).getTime() - new Date(advert.publishStart).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>

          {/* Notes Card */}
          {advert.notes && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{advert.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Campaign Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Campaign</label>
                <button
                  onClick={() => router.push(`/campaigns/${advert.campaignId}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  {advert.campaignTitle}
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Advert ID</label>
                <p className="text-xs text-gray-600 font-mono break-all">{advert.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-sm text-gray-900">{formatDateTime(advert.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDateTime(advert.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/adverts?edit=${advert.id}`)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Edit Advert
              </button>
              <button
                onClick={() => router.push(`/campaigns/${advert.campaignId}`)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                View Campaign
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this advert?')) {
                    // Handle delete
                    router.push('/adverts');
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Delete Advert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
