import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TourCreate() {
  const navigate = useNavigate();
  
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
    if (neighborhood && artist && streetArt && tourLength) {
      const newOption = { neighborhood, artist, streetArt, tourLength };
      setSelectedOptions([...selectedOptions, newOption]);
      // Reset selections
      setNeighborhood('');
      setArtist('');
      setStreetArt('');
      setTourLength('');
    }
  };

  const handleCreateTour = () => {
    if (selectedOptions.length > 0) {
      navigate('/tour-options', { state: { selectedOptions } });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Build Your Tour</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select a Neighborhood</label>
            <select 
              value={neighborhood} 
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Neighborhood</option>
              {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select an Artist</label>
            <select 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Artist</option>
              {artists.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Street Art</label>
            <select 
              value={streetArt} 
              onChange={(e) => setStreetArt(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Street Art</option>
              {streetArts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour Length</label>
            <select 
              value={tourLength} 
              onChange={(e) => setTourLength(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Tour Length</option>
              {tourLengths.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button 
            onClick={handleSubmit} 
            className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add to Tour
          </button>
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Selected Options</h2>
          <ul className="space-y-2 flex-grow">
            {selectedOptions.map((option, index) => (
              <li key={index} className="border p-3 rounded shadow-sm">
                <p><span className="font-medium">Neighborhood:</span> {option.neighborhood}</p>
                <p><span className="font-medium">Artist:</span> {option.artist}</p>
                <p><span className="font-medium">Street Art:</span> {option.streetArt}</p>
                <p><span className="font-medium">Length:</span> {option.tourLength}</p>
              </li>
            ))}
          </ul>
          <button 
            onClick={handleCreateTour}
            disabled={selectedOptions.length === 0}
            className={`mt-4 p-2 rounded text-white transition-colors ${
              selectedOptions.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            Create My Tour
          </button>
        </div>
      </div>
    </div>
  );
}
