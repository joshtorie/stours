import React from 'react';
import { SearchBar } from './SearchBar';

interface HeroSectionProps {
  image: string;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function HeroSection({ image, title, subtitle, showSearch = false }: HeroSectionProps) {
  return (
    <div className="relative h-[60vh] min-h-[400px] w-full">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-5xl font-bold mb-4">{title}</h1>
        {subtitle && <p className="text-xl mb-8">{subtitle}</p>}
        {showSearch && <SearchBar />}
      </div>
    </div>
  );
}