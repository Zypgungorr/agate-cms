'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCampaigns, getClients, type CampaignListItem, type ClientListItem } from '../../lib/campaigns';

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [campaignsData, clientsData] = await Promise.all([
        getCampaigns(),
        getClients()
      ]);
      setCampaigns(campaignsData);
      setClients(clientsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalBudget = campaigns.reduce((sum, c) => sum + c.estimatedBudget, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-7 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome to Agate CMS
              </h1>
              <p className="text-gray-600 mt-1">Manage your campaigns and track performance</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Status: Active</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
                <p className="text-sm text-gray-600">Total Campaigns</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{activeCampaigns.length}</p>
                <p className="text-sm text-gray-600">Active Campaigns</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
                <p className="text-sm text-gray-600">Total Clients</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${totalBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Budget</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Campaigns
                </h3>
                <Link href="/campaigns" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>
            </div>
          <div className="p-6">
            {campaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">No campaigns yet</p>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 4).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 text-sm"
                      >
                        {campaign.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{campaign.clientName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      campaign.status === 'planned' ? 'bg-blue-50 text-blue-700' :
                      campaign.status === 'completed' ? 'bg-gray-50 text-gray-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

          {/* Recent Clients */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Clients
                </h3>
                <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>
            </div>
          <div className="p-6">
            {clients.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">No clients yet</p>
            ) : (
              <div className="space-y-4">
                {clients.slice(0, 4).map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-gray-600"
                      >
                        {client.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{client.contactEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-900">{client.totalCampaigns} campaigns</p>
                      <p className="text-xs text-gray-500">{client.activeCampaigns} active</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/campaigns/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">New Campaign</p>
                <p className="text-xs text-gray-600">Create marketing campaign</p>
              </div>
            </Link>

            <Link
              href="/clients/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">New Client</p>
                <p className="text-xs text-gray-600">Add new client</p>
              </div>
            </Link>

            <Link
              href="/reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">View Reports</p>
                <p className="text-xs text-gray-600">Analytics & insights</p>
              </div>
            </Link>
          </div>
        </div>
    </div>
    </div>
  );
}
