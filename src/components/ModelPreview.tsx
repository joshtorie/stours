import React from 'react';
import '@google/model-viewer/lib/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          alt?: string;
          poster?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          reveal?: 'auto' | 'manual';
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          ar?: boolean;
          'ar-modes'?: string;
          'environment-image'?: string;
          exposure?: string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          'animation-name'?: string;
          'animation-crossfade-duration'?: string;
          'interaction-prompt'?: string;
          'interaction-prompt-style'?: string;
          'interaction-prompt-threshold'?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelPreviewProps {
  modelUrl: string;
  iosUrl?: string;
  previewImage?: string;
  className?: string;
  alt?: string;
  poster?: string;
}

export function ModelPreview({ modelUrl, iosUrl, previewImage, className = '', alt = 'A 3D model', poster }: ModelPreviewProps) {
  const modelViewerRef = useRef<any>(null);

  return (
    <model-viewer
      ref={modelViewerRef}
      src={modelUrl}
      ios-src={iosUrl}
      poster={previewImage || poster}
      alt={alt}
      loading="lazy"
      camera-controls
      auto-rotate
      ar
      ar-modes="webxr scene-viewer quick-look"
      environment-image="neutral"
      shadow-intensity="1"
      exposure="1"
      style={{
        width: '100%',
        height: '300px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      className={`w-full h-64 bg-gray-100 rounded-lg ${className}`}
    >
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-center text-sm">
        Use AR button to view in your space
      </div>
    </model-viewer>
  );
}
