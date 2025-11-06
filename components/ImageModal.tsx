import React, { useEffect } from 'react';
import type { GalleryImage } from '../types';
import { XIcon } from './icons/XIcon';
import { encodeFallbacks, shiftFallback } from '../utils/mediaUrl';

interface ImageModalProps {
  image: GalleryImage;
  onClose: () => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-gallery/1200/800';

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
      >
        <img
          src={image.imageUrl}
          alt={image.title}
          data-fallbacks={
            image.imageFallbacks && image.imageFallbacks.length > 0
              ? encodeFallbacks(image.imageFallbacks)
              : undefined
          }
          className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
          onError={(event) => {
            const nextSrc = shiftFallback(event.currentTarget);
            if (nextSrc) {
              event.currentTarget.src = nextSrc;
            } else {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
        />
        <div className="absolute top-0 left-0 bg-gradient-to-b from-black/50 to-transparent p-4 w-full">
          <h2 id="image-modal-title" className="text-white font-bold text-lg">{image.title}</h2>
        </div>
        {image.caption && (
          <div className="absolute bottom-0 left-0 bg-black/60 w-full px-4 py-3">
            <p className="text-sm text-white">{image.caption}</p>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Fermer la visionneuse"
      >
        <XIcon />
      </button>
    </div>
  );
};

export default ImageModal;
