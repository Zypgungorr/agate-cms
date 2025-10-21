"use client";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, Sarah 👋 Check out your campaign overview below.
        </p>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Active Campaigns</h2>
          <p className="text-4xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-500 mt-1">currently running</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Adverts in Progress</h2>
          <p className="text-4xl font-bold text-green-600">34</p>
          <p className="text-sm text-gray-500 mt-1">production ongoing</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Budget Alerts</h2>
          <p className="text-4xl font-bold text-red-600">3</p>
          <p className="text-sm text-gray-500 mt-1">over budget</p>
        </div>
      </div>

      {/* Hızlı erişim butonları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => router.push("/campaigns")}
          className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Manage Campaigns
        </button>
        <button
          onClick={() => router.push("/clients")}
          className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          View Clients
        </button>
        <button
          onClick={() => router.push("/reports")}
          className="bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
        >
          Generate Reports
        </button>
      </div>
    </div>
  );
}
