import React, { useRef, useEffect, useState } from 'react';
import type { GalleryImage } from '../types';
import { encodeFallbacks, shiftFallback } from '../utils/mediaUrl';

interface GalleryImageCardProps {
  image: GalleryImage;
  onClick: () => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-gallery/800/600';

const GalleryImageCard: React.FC<GalleryImageCardProps> = ({ image, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -100px 0px', // Trigger when 100px from the bottom of the viewport
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-700 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <img
        src={image.imageUrl}
        alt={image.title}
        data-fallbacks={
          image.imageFallbacks && image.imageFallbacks.length > 0
            ? encodeFallbacks(image.imageFallbacks)
            : undefined
        }
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="text-white text-sm font-semibold">{image.title}</h3>
        {image.caption && (
          <p className="mt-1 text-xs text-gray-200 leading-snug">{image.caption}</p>
        )}
      </div>
    </div>
  );
};

export default GalleryImageCard;
