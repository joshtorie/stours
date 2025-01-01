import React, { useEffect, useState } from 'react';
import { ARArtwork } from '../types/tour';

interface ARViewerProps {
  artwork: ARArtwork;
  onClose: () => void;
}

const ARViewer: React.FC<ARViewerProps> = ({ artwork, onClose }) => {
  const [isWebXRSupported, setIsWebXRSupported] = useState(false);
  const [arSession, setARSession] = useState<XRSession | null>(null);

  useEffect(() => {
    // Check WebXR support
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar')
        .then(supported => setIsWebXRSupported(supported))
        .catch(err => console.error('Error checking WebXR support:', err));
    }
  }, []);

  const startARSession = async () => {
    if (!navigator.xr) return;

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });

      setARSession(session);
      session.addEventListener('end', () => {
        setARSession(null);
      });

      // Initialize WebGL context and start render loop here
      // This is where you'd set up Three.js or other 3D rendering

    } catch (err) {
      console.error('Failed to start AR session:', err);
      // Fallback to model-viewer
      useModelViewer();
    }
  };

  const useModelViewer = () => {
    // Dynamically load model-viewer if needed
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@google/model-viewer';
    script.type = 'module';
    document.body.appendChild(script);

    return (
      <model-viewer
        src={artwork.modelUrl}
        ios-src={artwork.iosQuickLook}
        poster={artwork.imageUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        ar-scale="fixed"
      ></model-viewer>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="relative bg-white rounded-lg p-4 w-full max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-[500px]" id="ar-overlay">
          {isWebXRSupported ? (
            <button
              onClick={startARSession}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Start AR Experience
            </button>
          ) : (
            useModelViewer()
          )}
        </div>
      </div>
    </div>
  );
};

export default ARViewer;
