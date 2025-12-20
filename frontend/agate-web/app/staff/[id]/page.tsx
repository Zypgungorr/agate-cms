'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getStaffById, 
  type StaffDetail,
  getRoleName
} from '../../../lib/staff';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, [id]);

  const loadStaff = async () => {
    try {
      const staffData = await getStaffById(id);
      setStaff(staffData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff member');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'planned': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Staff member not found'}
        </div>
        <Link href="/staff" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
          ← Back to Staff List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link href="/staff" className="text-blue-500 hover:text-blue-600 text-sm mb-2 inline-block">
              ← Back to Staff List
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{staff.fullName}</h1>
            <p className="text-gray-600">{staff.email}</p>
            {staff.title && <p className="text-gray-500">{staff.title}</p>}
          </div>
          <Link
            href={`/staff/${id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Edit Staff Member
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Active Campaigns</div>
          <div className="text-2xl font-bold text-blue-600">{staff.activeCampaigns}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Completed Campaigns</div>
          <div className="text-2xl font-bold text-green-600">{staff.completedCampaigns}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Client Contacts</div>
          <div className="text-2xl font-bold text-purple-600">{staff.clientContacts}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Concept Notes</div>
          <div className="text-2xl font-bold text-indigo-600">{staff.conceptNotes}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl text-gray-900 font-semibold mb-4">Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {staff.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </dd>
              </div>

              {staff.office && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Office</dt>
                  <dd className="mt-1 text-sm text-gray-900">{staff.office}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Roles</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {staff.roles.map(role => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {getRoleName(role)}
                    </span>
                  ))}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(staff.createdAt)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(staff.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column - Assignments */}
        <div className="lg:col-span-2">
          {/* Campaign Assignments */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl text-gray-900 font-semibold mb-4">Campaign Assignments</h2>
            {staff.campaignAssignments.length === 0 ? (
              <p className="text-gray-500">No campaign assignments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Campaign
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.campaignAssignments.map((assignment) => (
                      <tr key={assignment.campaignId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/campaigns/${assignment.campaignId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {assignment.campaignTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {assignment.clientName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {getRoleName(assignment.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusBadge(assignment.campaignStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(assignment.assignedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Client Assignments */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl text-gray-900 font-semibold mb-4">Client Contact Assignments</h2>
            {staff.clientAssignments.length === 0 ? (
              <p className="text-gray-500">No client contact assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {staff.clientAssignments.map((assignment) => (
                  <div
                    key={assignment.clientId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/clients/${assignment.clientId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {assignment.clientName}
                      </Link>
                      {assignment.isPrimary && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Primary Contact
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Since {formatDate(assignment.assignedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

