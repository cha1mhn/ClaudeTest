import React from 'react';
import Dashboard from './pages/Dashboard';
import HubSpotCard from './pages/HubSpotCard';

export default function App() {
  const view = new URLSearchParams(window.location.search).get('view');
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
