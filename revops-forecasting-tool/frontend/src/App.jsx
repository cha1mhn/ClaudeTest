import React from 'react';
import Dashboard from './pages/Dashboard';
import HubSpotCard from './pages/HubSpotCard';

/**
 * Route by the ?view= query param so the same build serves both modes:
 *   /           → full RevOps dashboard
 *   /?view=card → compact HubSpot CRM card iframe
 */
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: ${view === 'card' ? '#fff' : '#F5F7FA'}; }
      `}</style>
      {view === 'card' ? <HubSpotCard /> : <Dashboard />}
    </>
  );
}
