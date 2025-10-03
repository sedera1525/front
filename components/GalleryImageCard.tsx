import React, { useRef, useEffect, useState } from 'react';
import type { GalleryImage } from '../types';

interface GalleryImageCardProps {
  image: GalleryImage;
  onClick: () => void;
}

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
      className={`group aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-700 ease-in-out ${
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
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};

export default GalleryImageCard;
