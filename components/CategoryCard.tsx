import React from 'react';
import type { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onCategoryClick: (category: string) => void;
}

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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{category.name}</h3>
        <p className="text-gray-600 text-sm h-10">{category.description}</p>
      </div>
    </div>
  );
};

export default CategoryCard;