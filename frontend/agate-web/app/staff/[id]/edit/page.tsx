'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getStaffById, 
  updateStaff,
  changeStaffPassword,
  type UpdateStaffDto,
  AVAILABLE_ROLES
} from '../../../../lib/staff';

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<UpdateStaffDto>({
    fullName: '',
    title: '',
    office: '',
    isActive: true,
    roles: [],
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadStaff();
  }, [id]);

  const loadStaff = async () => {
    try {
      const staff = await getStaffById(id);
      setFormData({
        fullName: staff.fullName,
        title: staff.title || '',
        office: staff.office || '',
        isActive: staff.isActive,
        roles: staff.roles,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await updateStaff(id, formData);
      router.push(`/staff/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating staff member');
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await changeStaffPassword(id, { newPassword: passwordData.newPassword });
      alert('Password changed successfully');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error changing password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleToggle = (roleKey: string) => {
    if (formData.roles.includes(roleKey)) {
      setFormData({ ...formData, roles: formData.roles.filter(r => r !== roleKey) });
    } else {
      setFormData({ ...formData, roles: [...formData.roles, roleKey] });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/staff/${id}`} className="text-blue-500 hover:text-blue-600 text-sm mb-2 inline-block">
          ← Back to Staff Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Staff Member</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl text-gray-900 font-semibold mb-4">Staff Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Senior Account Manager"
            />
          </div>

          <div>
            <label htmlFor="office" className="block text-sm font-medium text-gray-700 mb-1">
              Office
            </label>
            <input
              type="text"
              id="office"
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Istanbul, London"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles *
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map(role => (
                <label key={role.key} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.key)}
                    onChange={() => handleRoleToggle(role.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">{role.name}</span>
                </label>
              ))}
            </div>
            {formData.roles.length === 0 && (
              <p className="mt-1 text-sm text-red-600">At least one role is required</p>
            )}
          </div>

          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Inactive staff members cannot be assigned to new campaigns or clients
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || formData.roles.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/staff/${id}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-gray-900 font-semibold">Change Password</h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setError(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            Click "Change Password" to update this staff member's password.
          </p>
        )}
      </div>
    </div>
  );
}

