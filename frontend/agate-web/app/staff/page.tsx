'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getStaffList, 
  deleteStaff,
  type StaffListItem,
  getRoleName
} from '../../lib/staff';

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [filterOffice, setFilterOffice] = useState<string>('all');

  useEffect(() => {
    loadStaff();
  }, [includeInactive]);

  const loadStaff = async () => {
    try {
      const staffData = await getStaffList(includeInactive);
      setStaff(staffData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const member = staff.find(s => s.id === id);
    if (!member) return;

    if (!confirm(`Are you sure you want to delete "${member.fullName}"?`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      await deleteStaff(id);
      setStaff(staff.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting staff member');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const getWorkloadIndicator = (activeCampaigns: number) => {
    if (activeCampaigns === 0) {
      return <span className="text-gray-400">No active campaigns</span>;
    } else if (activeCampaigns <= 2) {
      return <span className="text-green-600">Light ({activeCampaigns})</span>;
    } else if (activeCampaigns <= 4) {
      return <span className="text-yellow-600">Medium ({activeCampaigns})</span>;
    } else {
      return <span className="text-red-600">Heavy ({activeCampaigns})</span>;
    }
  };

  // Get unique offices for filter
  const offices = Array.from(new Set(staff.map(s => s.office).filter(Boolean)));

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (filterOffice !== 'all' && s.office !== filterOffice) return false;
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <Link
            href="/staff/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Staff Member
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Include Inactive</span>
            </label>
          </div>

          {offices.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Office:</label>
              <select
                value={filterOffice}
                onChange={(e) => setFilterOffice(e.target.value)}
                className="border text-gray-900 border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Offices</option>
                {offices.map(office => (
                  <option key={office} value={office}>{office}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Staff</div>
            <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Active Staff</div>
            <div className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.isActive).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">In Campaigns</div>
            <div className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.activeCampaigns > 0).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Avg Campaigns</div>
            <div className="text-2xl font-bold text-purple-600">
              {staff.length > 0 
                ? (staff.reduce((sum, s) => sum + s.activeCampaigns, 0) / staff.length).toFixed(1)
                : 0
              }
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No staff members found.</p>
            <Link
              href="/staff/new"
              className="text-blue-500 hover:text-blue-600 underline mt-2 inline-block"
            >
              Add your first staff member
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/staff/${member.id}`}
                        className="hover:text-blue-600"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {member.fullName}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                        {member.title && (
                          <div className="text-xs text-gray-400">{member.title}</div>
                        )}
                        {member.office && (
                          <div className="text-xs text-gray-400">📍 {member.office}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map(role => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getRoleName(role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getWorkloadIndicator(member.activeCampaigns)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{member.totalCampaigns} campaigns</div>
                        <div className="text-gray-500">
                          {member.clientContacts} clients
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/staff/${member.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/staff/${member.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          disabled={deleteLoading === member.id}
                          className="text-red-600 hover:text-red-900 disabled:text-red-400"
                        >
                          {deleteLoading === member.id ? 'Deleting...' : 'Delete'}
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

