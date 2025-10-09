import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import CategoryCard from './CategoryCard';

interface AllCategoriesPageProps {
  onCategoryClick: (category: string) => void;
}

const AllCategoriesPage: React.FC<AllCategoriesPageProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/categories');
        if (!response.ok) {
          const mockCategories: Category[] = [
            { name: "Adventure Event", imageUrl: "https://picsum.photos/seed/event/600/400", description: "Join our thrilling events and challenges across the globe." },
            { name: "Destination", imageUrl: "https://picsum.photos/seed/destination/600/400", description: "Discover breathtaking new places and hidden gems." },
            { name: "Guides", imageUrl: "https://picsum.photos/seed/guides/600/400", description: "Expert tips and comprehensive guides for your next trip." },
            { name: "Equipment", imageUrl: "https://picsum.photos/seed/equipment/600/400", description: "Reviews and recommendations on the best gear for your adventures." },
            { name: "Food & Travel", imageUrl: "https://picsum.photos/seed/food/600/400", description: "Explore global cuisines and culinary journeys." },
            { name: "People", imageUrl: "https://picsum.photos/seed/people/600/400", description: "Inspiring stories from adventurers around the world." },
            { name: "Wildlife", imageUrl: "https://picsum.photos/seed/wildlife/600/400", description: "Encounters with the world's most fascinating creatures." },
            { name: "Gear", imageUrl: "https://picsum.photos/seed/gear2/600/400", description: "In-depth reviews and guides on the latest adventure gear." },
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
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                All Categories
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Dive into your next adventure by exploring our wide range of topics and stories.
            </p>
        </div>

        {loading && <div className="text-center"><p>Loading categories...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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

export default AllCategoriesPage;
