'use client';

import { useState, useEffect } from 'react';
import {
  getCampaignStaff,
  getStaffList,
  assignStaffToCampaign,
  removeStaffFromCampaign,
  type StaffListItem,
  getRoleName,
  AVAILABLE_ROLES
} from '../lib/staff';

interface CampaignStaffAssignmentProps {
  campaignId: string;
}

export default function CampaignStaffAssignment({ campaignId }: CampaignStaffAssignmentProps) {
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [allStaff, setAllStaff] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('creative');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, [campaignId]);

  const loadStaff = async () => {
    try {
      const [campaignStaffData, allStaffData] = await Promise.all([
        getCampaignStaff(campaignId),
        getStaffList(false)
      ]);
      setStaff(campaignStaffData);
      setAllStaff(allStaffData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedRole) return;

    setError(null);
    setSubmitting(true);

    try {
      await assignStaffToCampaign(campaignId, {
        staffId: selectedStaffId,
        role: selectedRole
      });
      await loadStaff();
      setShowAddForm(false);
      setSelectedStaffId('');
      setSelectedRole('creative');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member || !confirm(`Remove ${member.fullName} from this campaign?`)) return;

    try {
      await removeStaffFromCampaign(campaignId, staffId);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing staff');
    }
  };

  // Get available staff (not already assigned)
  const availableStaff = allStaff.filter(
    s => !staff.some(assigned => assigned.id === s.id)
  );

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Team</h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Member
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {/* Add Staff Form */}
      {showAddForm && (
        <form onSubmit={handleAddStaff} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Member *
              </label>
              <select
                required
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              >
                <option value="">Select staff member...</option>
                {availableStaff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.fullName} - {member.title || member.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              >
                {AVAILABLE_ROLES.map(role => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !selectedStaffId}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:bg-gray-300 disabled:text-gray-500"
              >
                {submitting ? 'Adding...' : 'Add to Team'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedStaffId('');
                  setError(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Staff List */}
      {staff.length === 0 ? (
        <p className="text-gray-500 text-sm">No team members assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{member.fullName}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
                {member.title && (
                  <div className="text-xs text-gray-400">{member.title}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.roles.map(role => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {getRoleName(role)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleRemoveStaff(member.id)}
                className="text-red-600 hover:text-red-800 text-sm ml-2"
                title="Remove from campaign"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

