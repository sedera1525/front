import React from 'react';
import type { Category } from '../types';
import { encodeFallbacks, shiftFallback } from '../utils/mediaUrl';

interface CategoryCardProps {
  category: Category;
  onCategoryClick: (category: string) => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-category/600/400';

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onCategoryClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
      onClick={() => onCategoryClick(category.name)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onCategoryClick(category.name)}
    >
      <div className="overflow-hidden h-48">
        <img 
          src={category.imageUrl} 
          alt={category.name}
          data-fallbacks={
            category.imageFallbacks && category.imageFallbacks.length > 0
              ? encodeFallbacks(category.imageFallbacks)
              : undefined
          }
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
      </div>
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{category.name}</h3>
      </div>
    </div>
  );
};

export default CategoryCard;
