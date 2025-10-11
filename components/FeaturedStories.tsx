import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import CategoryCard from './CategoryCard';

interface FeaturedCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const FeaturedStories: React.FC<FeaturedCategoriesProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/categories-featured');
        if (response.ok) {
          const mockCategories: Category[] = [
            { name: "FJKM Anosivavaka Event", imageUrl: "https://picsum.photos/seed/event/600/400", description: "Join our thrilling events and challenges across the globe." },
            { name: "Destination", imageUrl: "https://picsum.photos/seed/destination/600/400", description: "Discover breathtaking new places and hidden gems." },
            { name: "Guides", imageUrl: "https://picsum.photos/seed/guides/600/400", description: "Expert tips and comprehensive guides for your next trip." },
            { name: "Equipment", imageUrl: "https://picsum.photos/seed/equipment/600/400", description: "Reviews and recommendations on the best gear for your FJKM Anosivavakas." },
          ];
          setCategories(mockCategories);
          return;
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (err) {
        setError("Failed to load categories.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-start text-gray-800 mb-12">
          FJKM Anosivavaka
        </h2>
        {loading && <div className="text-center"><p>Loading categories...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map(category => (
              <CategoryCard 
                key={category.name} 
                category={category} 
                onCategoryClick={onCategoryClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedStories;