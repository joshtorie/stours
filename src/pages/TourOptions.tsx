import React from 'react';
import { Link } from 'react-router-dom';

const suggestedRoutes = [
  { name: 'Route 1', time: '30 minutes', details: ['Street Art 1', 'Street Art 2'] },
  { name: 'Route 2', time: '45 minutes', details: ['Street Art 3', 'Street Art 4'] },
  { name: 'Route 3', time: '1 hour', details: ['Street Art 5', 'Street Art 6'] },
];

export default function TourOptions() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Select Your Tour</h1>
      <div className="grid grid-cols-1 gap-4">
        {suggestedRoutes.map((route, index) => (
          <div key={index} className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{route.name}</h2>
            <p>Estimated Time: {route.time}</p>
            <h3 className="font-medium">Includes:</h3>
            <ul className="list-disc pl-5">
              {route.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
            </ul>
            <Link to="/tour-page" className="mt-4 bg-blue-500 text-white p-2 rounded">Select this Route</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
