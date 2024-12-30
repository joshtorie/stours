import React from 'react';

interface SelectionCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  selected: boolean;
  onClick: (id: string) => void;
  disabled?: boolean;
}

export function SelectionCard({
  id,
  title,
  subtitle,
  imageUrl,
  selected,
  onClick,
  disabled = false
}: SelectionCardProps) {
  return (
    <div
      onClick={() => !disabled && onClick(id)}
      className={`
        relative cursor-pointer transition-all duration-200 
        rounded-lg overflow-hidden shadow-md hover:shadow-lg
        ${selected ? 'ring-2 ring-blue-500 scale-[1.02]' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
      `}
    >
      <div className="aspect-[3/2] relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20">
            <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
