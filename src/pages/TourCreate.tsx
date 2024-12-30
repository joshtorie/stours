import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TourCreate() {
  // State for selections
  const [neighborhood, setNeighborhood] = useState('');
  const [artist, setArtist] = useState('');
  const [streetArt, setStreetArt] = useState('');
  const [tourLength, setTourLength] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Dummy data for dropdowns (replace with actual data fetching)
  const neighborhoods = ['Neighborhood 1', 'Neighborhood 2'];
  const artists = ['Artist 1', 'Artist 2'];
  const streetArts = ['Street Art 1', 'Street Art 2'];
  const tourLengths = ['30 minutes', '1 hour', '1.5 hours', '2 hours'];

  const handleSubmit = () => {
    // Add selected options to the list
    setSelectedOptions([...selectedOptions, { neighborhood, artist, streetArt, tourLength }]);
    // Reset selections
    setNeighborhood('');
    setArtist('');
    setStreetArt('');
    setTourLength('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Build Your Tour</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label>Select a Neighborhood</label>
          <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
            <option value="">Select Neighborhood</option>
            {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <label>Select an Artist</label>
          <select value={artist} onChange={(e) => setArtist(e.target.value)}>
            <option value="">Select Artist</option>
            {artists.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <label>Select Street Art</label>
          <select value={streetArt} onChange={(e) => setStreetArt(e.target.value)}>
            <option value="">Select Street Art</option>
            {streetArts.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label>Tour Length</label>
          <select value={tourLength} onChange={(e) => setTourLength(e.target.value)}>
            <option value="">Select Tour Length</option>
            {tourLengths.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={handleSubmit} className="mt-4 bg-blue-500 text-white p-2 rounded">Submit</button>
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">Selected Options</h2>
          <ul>
            {selectedOptions.map((option, index) => (
              <li key={index} className="border p-2 mb-2">
                Neighborhood: {option.neighborhood}, Artist: {option.artist}, Street Art: {option.streetArt}, Length: {option.tourLength}
              </li>
            ))}
          </ul>
          <Link to="/tour-options" className="mt-4 bg-green-500 text-white p-2 rounded">Create My Tour</Link>
        </div>
      </div>
    </div>
  );
}
