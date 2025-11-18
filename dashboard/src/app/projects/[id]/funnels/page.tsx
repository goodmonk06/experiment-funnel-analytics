'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Funnel {
  id: string;
  name: string;
  steps: string[];
  createdAt: string;
}

interface FunnelData {
  steps: {
    step: string;
    stepNumber: number;
    userCount: number;
    conversionRate: number;
    dropOffRate: number;
  }[];
  overallConversionRate: number;
  totalUsers: number;
  convertedUsers: number;
}

export default function FunnelsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [showNewFunnel, setShowNewFunnel] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelSteps, setNewFunnelSteps] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnels();
  }, [projectId]);

  useEffect(() => {
    if (selectedFunnel) {
      fetchFunnelData();
    }
  }, [selectedFunnel, startDate, endDate]);

  async function fetchFunnels() {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/funnels`);
      const data = await response.json();
      setFunnels(data.funnels);
      if (data.funnels.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data.funnels[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch funnels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFunnelData() {
    if (!selectedFunnel) return;

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const response = await fetch(
        `${API_URL}/funnels/${selectedFunnel}/compute?${params.toString()}`
      );
      const data = await response.json();
      setFunnelData(data.data);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    }
  }

  async function createFunnel(e: React.FormEvent) {
    e.preventDefault();
    const steps = newFunnelSteps.split(',').map((s) => s.trim()).filter(Boolean);

    if (steps.length < 2) {
      alert('Please provide at least 2 steps');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/funnels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: newFunnelName,
          steps,
        }),
      });

      if (response.ok) {
        setNewFunnelName('');
        setNewFunnelSteps('');
        setShowNewFunnel(false);
        fetchFunnels();
      }
    } catch (error) {
      console.error('Failed to create funnel:', error);
    }
  }

  const selectedFunnelObj = funnels.find((f) => f.id === selectedFunnel);

  if (loading) {
    return <div className="text-center py-12">Loading funnels...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Funnels</h1>
          <button
            onClick={() => setShowNewFunnel(!showNewFunnel)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Funnel
          </button>
        </div>
      </div>

      {showNewFunnel && (
        <form onSubmit={createFunnel} className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Funnel</h2>
          <input
            type="text"
            value={newFunnelName}
            onChange={(e) => setNewFunnelName(e.target.value)}
            placeholder="Funnel name (e.g., 'Signup Flow')"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />
          <input
            type="text"
            value={newFunnelSteps}
            onChange={(e) => setNewFunnelSteps(e.target.value)}
            placeholder="Steps (comma-separated event names, e.g., 'page_view, signup, subscribe')"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewFunnel(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {funnels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">No funnels yet</p>
          <p>Create your first funnel to track conversion rates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Funnels</h3>
              <div className="space-y-2">
                {funnels.map((funnel) => (
                  <button
                    key={funnel.id}
                    onClick={() => setSelectedFunnel(funnel.id)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedFunnel === funnel.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {funnel.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mt-4">
              <h3 className="font-semibold mb-4">Date Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedFunnelObj && funnelData ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">{selectedFunnelObj.name}</h2>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{funnelData.totalUsers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Converted</p>
                      <p className="text-2xl font-bold text-green-600">
                        {funnelData.convertedUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overall Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {funnelData.overallConversionRate}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Conversion by Step</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData.steps}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="step" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="userCount" fill="#3b82f6" name="Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Step Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Step</th>
                          <th className="text-left py-2 px-4">Event Name</th>
                          <th className="text-right py-2 px-4">Users</th>
                          <th className="text-right py-2 px-4">Conversion Rate</th>
                          <th className="text-right py-2 px-4">Drop Off</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funnelData.steps.map((step, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">Step {step.stepNumber}</td>
                            <td className="py-3 px-4">{step.step}</td>
                            <td className="py-3 px-4 text-right">{step.userCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-green-600">
                              {step.conversionRate}%
                            </td>
                            <td className="py-3 px-4 text-right text-red-600">
                              {step.dropOffRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow text-center text-gray-500">
                Select a funnel to view analytics
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
