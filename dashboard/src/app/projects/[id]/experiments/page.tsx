'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Experiment {
  id: string;
  key: string;
  variants: string[];
  status: string;
  createdAt: string;
}

interface ExperimentStats {
  variants: {
    variant: string;
    userCount: number;
    conversionCount: number;
    conversionRate: number;
  }[];
  totalUsers: number;
  totalConversions: number;
}

export default function ExperimentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [experimentStats, setExperimentStats] = useState<ExperimentStats | null>(null);
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newExperimentKey, setNewExperimentKey] = useState('');
  const [newExperimentVariants, setNewExperimentVariants] = useState('');
  const [conversionEvent, setConversionEvent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiments();
  }, [projectId]);

  useEffect(() => {
    if (selectedExperiment) {
      fetchExperimentStats();
    }
  }, [selectedExperiment, conversionEvent, startDate, endDate]);

  async function fetchExperiments() {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/experiments`);
      const data = await response.json();
      setExperiments(data.experiments);
      if (data.experiments.length > 0 && !selectedExperiment) {
        setSelectedExperiment(data.experiments[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExperimentStats() {
    if (!selectedExperiment) return;

    const params = new URLSearchParams();
    if (conversionEvent) params.append('conversionEvent', conversionEvent);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const response = await fetch(
        `${API_URL}/experiments/${selectedExperiment}/stats?${params.toString()}`
      );
      const data = await response.json();
      setExperimentStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch experiment stats:', error);
    }
  }

  async function createExperiment(e: React.FormEvent) {
    e.preventDefault();
    const variants = newExperimentVariants
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (variants.length < 2) {
      alert('Please provide at least 2 variants');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          key: newExperimentKey,
          variants,
        }),
      });

      if (response.ok) {
        setNewExperimentKey('');
        setNewExperimentVariants('');
        setShowNewExperiment(false);
        fetchExperiments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create experiment');
      }
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  }

  const selectedExperimentObj = experiments.find((e) => e.id === selectedExperiment);

  if (loading) {
    return <div className="text-center py-12">Loading experiments...</div>;
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
          <h1 className="text-3xl font-bold">Experiments</h1>
          <button
            onClick={() => setShowNewExperiment(!showNewExperiment)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Experiment
          </button>
        </div>
      </div>

      {showNewExperiment && (
        <form onSubmit={createExperiment} className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Experiment</h2>
          <input
            type="text"
            value={newExperimentKey}
            onChange={(e) => setNewExperimentKey(e.target.value)}
            placeholder="Experiment key (e.g., 'button_color_test')"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />
          <input
            type="text"
            value={newExperimentVariants}
            onChange={(e) => setNewExperimentVariants(e.target.value)}
            placeholder="Variants (comma-separated, e.g., 'control, variant_a, variant_b')"
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
              onClick={() => setShowNewExperiment(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {experiments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">No experiments yet</p>
          <p>Create your first experiment to run A/B tests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Experiments</h3>
              <div className="space-y-2">
                {experiments.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExperiment(exp.id)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedExperiment === exp.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{exp.key}</div>
                    <div className="text-xs text-gray-500">{exp.status}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mt-4">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Conversion Event
                  </label>
                  <input
                    type="text"
                    value={conversionEvent}
                    onChange={(e) => setConversionEvent(e.target.value)}
                    placeholder="e.g., subscribe"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
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
            {selectedExperimentObj && experimentStats ? (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedExperimentObj.key}</h2>
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm ${
                          selectedExperimentObj.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : selectedExperimentObj.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedExperimentObj.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Variants: {selectedExperimentObj.variants.join(', ')}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{experimentStats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Conversions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {experimentStats.totalConversions.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">User Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={experimentStats.variants}
                          dataKey="userCount"
                          nameKey="variant"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {experimentStats.variants.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4">Conversion Rate by Variant</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={experimentStats.variants}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="variant" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="conversionRate" fill="#10b981" name="Conversion Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Variant Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Variant</th>
                          <th className="text-right py-2 px-4">Users</th>
                          <th className="text-right py-2 px-4">Conversions</th>
                          <th className="text-right py-2 px-4">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experimentStats.variants.map((variant, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{variant.variant}</td>
                            <td className="py-3 px-4 text-right">{variant.userCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">{variant.conversionCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-green-600 font-semibold">
                              {variant.conversionRate}%
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
                Select an experiment to view analytics
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
