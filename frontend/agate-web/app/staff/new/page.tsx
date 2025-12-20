'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  createStaff,
  type CreateStaffDto,
  AVAILABLE_ROLES
} from '../../../lib/staff';

export default function NewStaffPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateStaffDto>({
    email: '',
    password: '',
    fullName: '',
    title: '',
    office: '',
    roles: [],
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.roles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setSubmitting(true);

    try {
      const staff = await createStaff(formData);
      router.push(`/staff/${staff.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating staff member');
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/staff" className="text-blue-500 hover:text-blue-600 text-sm mb-2 inline-block">
          ← Back to Staff List
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Staff Member</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Login Information */}
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg text-gray-900 font-semibold mb-4">Login Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg text-gray-900 font-semibold mb-4">Personal Information</h2>
            
            <div className="space-y-4">
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
                  placeholder="John Doe"
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
            </div>
          </div>

          {/* Roles */}
          <div>
            <h2 className="text-lg text-gray-900 font-semibold mb-4">Roles & Permissions *</h2>
            <div className="space-y-3">
              {AVAILABLE_ROLES.map(role => (
                <label key={role.key} className="flex items-start cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.key)}
                    onChange={() => handleRoleToggle(role.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-sm text-gray-500">
                      {role.key === 'admin' && 'Full system access'}
                      {role.key === 'account_manager' && 'Manage campaigns and client relationships'}
                      {role.key === 'creative' && 'Create and manage campaign content'}
                      {role.key === 'analyst' && 'View reports and analytics'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {formData.roles.length === 0 && (
              <p className="mt-2 text-sm text-red-600">Please select at least one role</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting || formData.roles.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-black px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </button>
            <Link
              href="/staff"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

