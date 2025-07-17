'use client';

import { useState, useEffect } from 'react';
import SiteLink from './SiteLink';
import AddRedirectModal from './AddRedirectModal';
import { Redirect } from '../lib/database';

export default function SiteList() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchRedirects = async () => {
    try {
      const response = await fetch('/api/redirects');
      if (response.ok) {
        const data = await response.json();
        setRedirects(data);
        setIsInitialized(data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching redirects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDatabase = async () => {
    try {
      const response = await fetch('/api/init', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setRedirects(data.redirects);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleModalSuccess = () => {
    fetchRedirects();
  };

  if (isLoading) {
    return <div className="text-center">Loading sites...</div>;
  }

  if (!isInitialized && redirects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-center mb-4">
          <p className="text-lg mb-2">No redirects found in database.</p>
          <p className="text-sm text-gray-600">Initialize from existing Caddyfile or start fresh.</p>
        </div>
        <button
          onClick={initializeDatabase}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Initialize from Caddyfile
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          Add First Redirect
        </button>
        <AddRedirectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Redirect
        </button>
      </div>
      
      {redirects.length === 0 ? (
        <div className="text-center">No sites found</div>
      ) : (
        redirects.map((redirect: Redirect) => (
          <SiteLink 
            key={redirect.id} 
            href={`https://${redirect.host}`} 
            label={redirect.host}
          />
        ))
      )}
      
      <AddRedirectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}