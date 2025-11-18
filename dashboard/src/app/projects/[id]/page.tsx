'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Project {
  id: string;
  name: string;
  apiKey: string;
  _count: {
    events: number;
    funnelDefinitions: number;
    experimentDefinitions: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`);
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading project...</div>;
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-600">
          API Key: <code className="bg-gray-100 px-2 py-1 rounded">{project.apiKey}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Events</h3>
          <p className="text-3xl font-bold text-blue-600">{project._count.events.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Funnels</h3>
          <p className="text-3xl font-bold text-green-600">{project._count.funnelDefinitions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Experiments</h3>
          <p className="text-3xl font-bold text-purple-600">{project._count.experimentDefinitions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href={`/projects/${projectId}/funnels`}
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
        >
          <div className="text-4xl mb-4">🔀</div>
          <h2 className="text-2xl font-bold mb-2">Funnels</h2>
          <p className="text-gray-600">Track user conversion through multi-step flows</p>
        </Link>

        <Link
          href={`/projects/${projectId}/experiments`}
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
        >
          <div className="text-4xl mb-4">🧪</div>
          <h2 className="text-2xl font-bold mb-2">Experiments</h2>
          <p className="text-gray-600">Run A/B tests and analyze variant performance</p>
        </Link>
      </div>
    </div>
  );
}
