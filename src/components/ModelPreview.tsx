import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<any, any>;
    }
  }
}

interface ModelPreviewProps {
  modelUrl: string;
  iosUrl?: string;
  previewImage?: string;
  className?: string;
}

export function ModelPreview({ modelUrl, iosUrl, previewImage, className = '' }: ModelPreviewProps) {
  const modelViewerRef = useRef<any>(null);

  useEffect(() => {
    if (modelViewerRef.current) {
      // Add any initialization code here if needed
    }
  }, [modelUrl]);

  return (
    <model-viewer
      ref={modelViewerRef}
      src={modelUrl}
      ios-src={iosUrl}
      poster={previewImage}
      alt="3D model preview"
      shadow-intensity="1"
      camera-controls
      auto-rotate
      ar
      ar-modes="webxr scene-viewer quick-look"
      className={`w-full h-64 bg-gray-100 rounded-lg ${className}`}
    >
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-center text-sm">
        Use AR button to view in your space
      </div>
    </model-viewer>
  );
}
