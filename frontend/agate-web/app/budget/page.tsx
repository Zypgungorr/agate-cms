'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface Campaign {
  id: string;
  title: string;
}

interface BudgetLine {
  id: number;
  campaignId: string;
  campaignName: string;
  advertId?: string;
  advertTitle?: string;
  item: string;
  category: string;
  type: string;
  amount: number;
  plannedAmount: number;
  description?: string;
  vendor?: string;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetSummary {
  campaignId: string;
  campaignName: string;
  totalPlanned: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  categories: BudgetCategory[];
  recentTransactions: BudgetLine[];
}

interface BudgetCategory {
  category: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  itemCount: number;
}

export default function BudgetPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudgetLine, setEditingBudgetLine] = useState<BudgetLine | null>(null);

  const categories = [
    { key: 'Creative', label: 'Creative', color: 'bg-purple-100 text-purple-800' },
    { key: 'Media', label: 'Media', color: 'bg-blue-100 text-blue-800' },
    { key: 'Production', label: 'Production', color: 'bg-green-100 text-green-800' },
    { key: 'Talent', label: 'Talent', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'Technology', label: 'Technology', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'Other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadBudgetData();
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      console.log('Loading campaigns...');
      const response = await fetch('http://localhost:5135/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Campaigns loaded:', data);
        setCampaigns(data);
        if (data.length > 0 && !selectedCampaign) {
          console.log('Auto-selecting first campaign:', data[0].id);
          setSelectedCampaign(data[0].id);
        }
      } else {
        console.error('Failed to load campaigns:', response.status);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading budget data for campaign:', selectedCampaign);
      
      // Load budget summary
      const summaryResponse = await fetch(`http://localhost:5135/api/budget/summary/${selectedCampaign}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Budget summary response:', summaryResponse.status);
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('Budget summary data:', summaryData);
        setBudgetSummary(summaryData);
      } else if (summaryResponse.status === 404) {
        console.log('No budget summary found - campaign has no budget items yet');
        setBudgetSummary(null);
      } else {
        const errorText = await summaryResponse.text();
        console.error('Budget summary error:', errorText);
        setBudgetSummary(null);
      }

      // Load budget lines
      const linesResponse = await fetch(`http://localhost:5135/api/budget/campaign/${selectedCampaign}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Budget lines response:', linesResponse.status);

      if (linesResponse.ok) {
        const linesData = await linesResponse.json();
        console.log('Budget lines data:', linesData);
        setBudgetLines(linesData);
      } else {
        const errorText = await linesResponse.text();
        console.error('Budget lines error:', errorText);
        setBudgetLines([]);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      setBudgetSummary(null);
      setBudgetLines([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.key === category)?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle edit budget line
  const handleEdit = (budgetLine: BudgetLine) => {
    setEditingBudgetLine(budgetLine);
    setShowCreateModal(true);
  };

  // Handle delete budget line
  const handleDelete = async (budgetLine: BudgetLine) => {
    const warningMessage = `Are you sure you want to delete this budget item?\n\n` +
      `Item: ${budgetLine.item}\n` +
      `Amount: ${formatCurrency(budgetLine.amount)}\n` +
      `Category: ${budgetLine.category}\n\n` +
      `⚠️ This action cannot be undone!\n\n` +
      `Type "DELETE" to confirm:`;

    const userInput = prompt(warningMessage);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" to confirm.');
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:5135/api/budget/${budgetLine.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert(`Budget item "${budgetLine.item}" has been successfully deleted.`);
        await loadBudgetData();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to delete: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting budget line:', error);
      alert(`Failed to delete budget item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingBudgetLine(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-7 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Budget Monitor</h1>
              <p className="text-gray-600 mt-1">Track campaign budgets and financial performance</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Budget Tracking</span>
            </div>
          </div>
        </div>

        {/* Campaign Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
              >
                <option value="">Choose a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedCampaign}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Budget Item
            </button>
          </div>
        </div>

      {selectedCampaign && budgetSummary && (
        <>
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Planned</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(budgetSummary.totalPlanned)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(budgetSummary.totalActual)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Variance</p>
                  <p className={`text-2xl font-semibold ${budgetSummary.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(budgetSummary.variance))}
                  </p>
                  <p className={`text-sm ${budgetSummary.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {budgetSummary.variance >= 0 ? 'Over Budget' : 'Under Budget'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(budgetSummary.totalPlanned - budgetSummary.totalActual)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Budget by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetSummary.categories.map(category => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category.category)}`}>
                      {category.category}
                    </span>
                    <span className="text-sm text-gray-500">{category.itemCount} items</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Planned:</span>
                      <span className="font-medium text-gray-600">{formatCurrency(category.plannedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Actual:</span>
                      <span className="font-medium text-gray-600">{formatCurrency(category.actualAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variance:</span>
                      <span className={`font-medium ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(category.variance))}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${category.actualAmount > category.plannedAmount ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{
                          width: `${Math.min((category.actualAmount / (category.plannedAmount || 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Budget Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetSummary.recentTransactions.slice(0, 10).map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'Actual' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.bookedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedCampaign && !budgetSummary && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Budget Data Yet</h3>
          <p className="text-gray-600 mb-6">This campaign doesn't have any budget items. Start by adding one!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add First Budget Item
          </button>
        </div>
      )}

      {!selectedCampaign && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Campaign</h3>
          <p className="text-gray-600">Choose a campaign above to view its budget details</p>
        </div>
      )}

      {/* Create/Edit Budget Item Modal */}
      {showCreateModal && (
        <CreateBudgetItemModal
          campaignId={selectedCampaign}
          categories={categories}
          editingBudgetLine={editingBudgetLine}
          onClose={handleCloseModal}
          onSuccess={loadBudgetData}
        />
      )}
      </div>
    </div>
  );
}

// Create/Edit Budget Item Modal Component
function CreateBudgetItemModal({ campaignId, categories, editingBudgetLine, onClose, onSuccess }: {
  campaignId: string;
  categories: any[];
  editingBudgetLine: BudgetLine | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    item: editingBudgetLine?.item || '',
    category: editingBudgetLine?.category || 'Other',
    type: editingBudgetLine?.type || 'Planned',
    amount: editingBudgetLine?.amount || 0,
    plannedAmount: editingBudgetLine?.plannedAmount || 0,
    description: editingBudgetLine?.description || '',
    vendor: editingBudgetLine?.vendor || '',
    bookedAt: editingBudgetLine?.bookedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    advertId: editingBudgetLine?.advertId || ''
  });
  const [adverts, setAdverts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [advertsLoading, setAdvertsLoading] = useState(true);

  const isEditMode = !!editingBudgetLine;

  // Load adverts for the selected campaign
  useEffect(() => {
    const loadAdverts = async () => {
      try {
        console.log('Loading adverts for campaign:', campaignId);
        const response = await fetch(`http://localhost:5135/api/adverts/campaign/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Adverts response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Adverts data:', data);
          setAdverts(data);
        } else {
          const errorText = await response.text();
          console.error('Adverts error:', errorText);
        }
      } catch (error) {
        console.error('Error loading adverts:', error);
      } finally {
        setAdvertsLoading(false);
      }
    };

    if (campaignId) {
      loadAdverts();
    }
  }, [campaignId]);

  // Type veya Advert değiştiğinde otomatik planned amount yükle
  useEffect(() => {
    console.log('Form data changed - Type:', formData.type, 'Advert:', formData.advertId);
    
    if (formData.type === 'Actual' && formData.advertId) {
      console.log('Auto-loading planned amount...');
      fetchPlannedAmount(formData.advertId);
    }
  }, [formData.type, formData.advertId]);

  // Advert seçildiğinde planned amount'u getir
  const handleAdvertChange = async (advertId: string) => {
    console.log('Advert changed to:', advertId);
    setFormData({...formData, advertId});
  };

  // Type değiştiğinde planned amount'u yükle
  const handleTypeChange = async (type: string) => {
    console.log('Type changed to:', type);
    setFormData({...formData, type});
    
    if (type === 'Planned') {
      // Planned seçilirse plannedAmount'u sıfırla
      setFormData(prev => ({...prev, type, plannedAmount: 0}));
    }
  };

  // Planned amount'u API'den çek
  const fetchPlannedAmount = async (advertId: string) => {
    try {
      console.log('Fetching planned amount for advert:', advertId);
      const response = await fetch(`http://localhost:5135/api/budget/advert/${advertId}/planned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Planned amount data received:', data);
        
        // Planned amount'u form'a set et (0 olsa bile)
        setFormData(prev => ({...prev, plannedAmount: data.plannedAmount || 0}));
        
        if (data.plannedAmount > 0) {
          console.log(`✓ Loaded planned amount: $${data.plannedAmount}`);
        } else {
          console.log('No planned budget found for this advert');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching planned amount:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode 
        ? `http://localhost:5135/api/budget/${editingBudgetLine.id}`
        : 'http://localhost:5135/api/budget';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const payload = isEditMode
        ? {
            // Update payload (no campaignId)
            item: formData.item,
            category: formData.category,
            type: formData.type,
            amount: formData.amount,
            plannedAmount: formData.plannedAmount,
            description: formData.description,
            vendor: formData.vendor,
            bookedAt: formData.bookedAt,
            advertId: formData.advertId || null
          }
        : {
            // Create payload (with campaignId)
            ...formData,
            campaignId,
            advertId: formData.advertId || null,
            bookedAt: formData.bookedAt
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${isEditMode ? 'update' : 'create'} budget item`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} budget item:`, error);
      alert(`Error ${isEditMode ? 'updating' : 'creating'} budget item`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Budget Item' : 'Add Budget Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <input
                type="text"
                required
                value={formData.item}
                onChange={(e) => setFormData({...formData, item: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
                placeholder="e.g. TV Commercial Production"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {categories.map(category => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related Advert (Optional)</label>
              {advertsLoading ? (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-600">
                  Loading adverts...
                </div>
              ) : (
                <select
                  value={formData.advertId}
                  onChange={(e) => handleAdvertChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">No specific advert (General campaign expense)</option>
                  {adverts.map(advert => (
                    <option key={advert.id} value={advert.id}>
                      {advert.title}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select an advert if this budget item is specifically for that advert. If you select "Actual Expense" type, the planned amount will be automatically loaded.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="Planned">Planned Budget</option>
                <option value="Actual">Actual Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.bookedAt}
                onChange={(e) => setFormData({...formData, bookedAt: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'Planned' ? 'Planned Amount' : 'Actual Amount'} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>
            </div>

            {formData.type === 'Actual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Amount (for comparison)
                  {formData.plannedAmount > 0 && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Automatically loaded from advert budget
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.plannedAmount}
                    onChange={(e) => setFormData({...formData, plannedAmount: parseFloat(e.target.value) || 0})}
                    className={`w-full border text-black rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.plannedAmount > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.plannedAmount > 0 
                    ? `Budget variance: ${formData.amount > formData.plannedAmount ? 'Over' : 'Under'} budget by $${Math.abs(formData.amount - formData.plannedAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                    : 'Select an advert to automatically load the planned amount'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor/Agency</label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
              placeholder="e.g. Production House Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
              placeholder="Additional details about this budget item..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Adding...') 
                : (isEditMode ? 'Update Budget Item' : 'Add Budget Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
