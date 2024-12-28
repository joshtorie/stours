import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/ui/Navbar';
import HomePage from './pages/HomePage';
import CityPage from './pages/CityPage';
import NeighborhoodPage from './pages/NeighborhoodPage';
import ArtistPage from './pages/ArtistPage';
import StreetArtPage from './pages/StreetArtPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-16"> {/* Add padding to account for fixed navbar */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cities/:id" element={<CityPage />} />
          <Route path="/neighborhoods/:id" element={<NeighborhoodPage />} />
          <Route path="/artists/:id" element={<ArtistPage />} />
          <Route path="/street-art/:id" element={<StreetArtPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}