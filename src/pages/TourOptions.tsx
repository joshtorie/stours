import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const suggestedRoutes = [
  { 
    name: 'Scenic Route', 
    time: '30 minutes', 
    details: [],
    description: 'A beautiful walk through the neighborhood\'s highlights'
  },
  { 
    name: 'Direct Route', 
    time: '45 minutes', 
    details: [],
    description: 'The most efficient path to see all selected artwork'
  },
  { 
    name: 'Explorer Route', 
    time: '1 hour', 
    details: [],
    description: 'A comprehensive tour including nearby points of interest'
  },
];

export default function TourOptions() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedOptions } = location.state || { selectedOptions: [] };

  // Generate suggested routes based on selected options
  const routes = suggestedRoutes.map(route => ({
    ...route,
    details: selectedOptions.map(opt => opt.streetArt),
  }));

  const handleRouteSelect = (route) => {
    navigate('/tour-page', { 
      state: { 
        route,
        selectedOptions 
      } 
    });
  };

  if (selectedOptions.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">No Tour Options Available</h1>
        <p>Please go back and select your tour preferences first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Select Your Tour Route</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route, index) => (
          <div key={index} className="border p-4 rounded shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{route.name}</h2>
            <p className="text-gray-600 mb-2">Estimated Time: {route.time}</p>
            <p className="text-gray-600 mb-4">{route.description}</p>
            <h3 className="font-medium mb-2">Includes:</h3>
            <ul className="list-disc pl-5 mb-4">
              {route.details.map((detail, idx) => (
                <li key={idx} className="text-gray-700">{detail}</li>
              ))}
            </ul>
            <button 
              onClick={() => handleRouteSelect(route)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
            >
              Select this Route
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
