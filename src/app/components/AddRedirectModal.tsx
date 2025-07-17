'use client';

import { useState } from 'react';

interface AddRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRedirectModal({ isOpen, onClose, onSuccess }: AddRedirectModalProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [target, setTarget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/redirects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, host, target }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create redirect');
      }

      // Reset form
      setName('');
      setHost('');
      setTarget('');
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setHost('');
    setTarget('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Redirect</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., dashboard"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-2">
              Host
            </label>
            <input
              type="text"
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., dashboard.example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
              Target
            </label>
            <input
              type="text"
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., localhost:3000"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Redirect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}