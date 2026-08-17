import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Compare from './pages/Compare';
import Browse from './pages/Browse';
import Submit from './pages/Submit';

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <NavLink to="/" className="brand">What It <span>Cost</span></NavLink>
          <nav className="site-nav">
            <NavLink to="/" end>Overview</NavLink>
            <NavLink to="/compare">Compare</NavLink>
            <NavLink to="/browse">Browse</NavLink>
            <NavLink to="/submit" className="cta">Report a bill</NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
