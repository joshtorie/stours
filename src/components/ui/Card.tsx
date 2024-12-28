import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  title: string;
  image: string;
  link: string;
  subtitle?: string;
}

export function Card({ title, image, link, subtitle }: CardProps) {
  return (
    <Link
      to={link}
      className="min-w-[280px] max-w-[280px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 snap-start"
    >
      <div className="h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="mt-2 text-gray-600">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}