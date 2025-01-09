import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/ui/Navbar';
import UserProfile from './components/UserProfile';
import UserProfilePage from './components/UserProfilePage';
import HomePage from './pages/HomePage';
import CityPage from './pages/CityPage';
import NeighborhoodPage from './pages/NeighborhoodPage';
import ArtistPage from './pages/ArtistPage';
import StreetArtPage from './pages/StreetArtPage';
import AdminPage from './pages/AdminPage';
import TourCreate from './pages/TourCreate';
import TourOptions from './pages/TourOptions';
import TourPage from './pages/TourPage';
import YourTour from './pages/YourTour';
import TourComplete from './pages/TourComplete';

export default function App() {
  return (
    <Router>
      <nav>
        <UserProfile />
      </nav>
      <div className="pt-16"> {/* Add padding to account for fixed navbar */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<UserProfile />} />
          <Route path="/user-profile" element={<UserProfilePage />} />
          <Route path="/cities/:id" element={<CityPage />} />
          <Route path="/neighborhoods/:id" element={<NeighborhoodPage />} />
          <Route path="/artists/:id" element={<ArtistPage />} />
          <Route path="/street-art/:id" element={<StreetArtPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tour-create" element={<TourCreate />} />
          <Route path="/tour-options" element={<TourOptions />} />
          <Route path="/tour-page" element={<TourPage />} />
          <Route path="/your-tour" element={<YourTour />} />
          <Route path="/tourcomplete" element={<TourComplete />} />
        </Routes>
      </div>
    </Router>
  );
}