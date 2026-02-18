"use client";
import { useEffect, useState } from 'react';

interface Site {
  id: string;
  host: string;
  upstream: string;
}

export default function SiteCrud() {
  const [sites, setSites] = useState<Site[]>([]);
  const [host, setHost] = useState('');
  const [upstream, setUpstream] = useState('');
  const [editing, setEditing] = useState<Site | null>(null);

  async function fetchSites() {
    const res = await fetch('/api/sites');
    setSites(await res.json());
  }

  useEffect(() => { fetchSites(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch('/api/sites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, host, upstream }),
      });
      setEditing(null);
    } else {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, upstream }),
      });
    }
    setHost('');
    setUpstream('');
    fetchSites();
  }

  async function handleDelete(id: string) {
    await fetch('/api/sites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchSites();
  }

  function startEdit(site: Site) {
    setEditing(site);
    setHost(site.host);
    setUpstream(site.upstream);
  }

  function cancelEdit() {
    setEditing(null);
    setHost('');
    setUpstream('');
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 border rounded-lg bg-white/80">
      <h2 className="text-xl font-bold mb-4">Manage Sites</h2>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
        <input
          className="border p-2 rounded"
          placeholder="Host (e.g. example.com)"
          value={host}
          onChange={e => setHost(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          placeholder="Upstream (e.g. localhost:3000)"
          value={upstream}
          onChange={e => setUpstream(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {editing ? 'Update Site' : 'Add Site'}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
          )}
        </div>
      </form>
      <ul className="divide-y">
        {sites.map(site => (
          <li key={site.id} className="flex items-center justify-between py-2">
            <div>
              <span className="font-mono">{site.host}</span>
              <span className="ml-2 text-gray-500">→ {site.upstream}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(site)} className="px-2 py-1 bg-yellow-400 rounded">Edit</button>
              <button onClick={() => handleDelete(site.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
