import React, { useState, useEffect } from 'react';
import type { Story } from '../types';
import StoryCard from './StoryCard'; // Changed from ArticleCard
import PopularNewsSidebar from './PopularNewsSidebar';

interface LatestSectionProps {
  onStoryClick: (id: number) => void;
  onCategoryClick: (category: string) => void;
}

const LatestSection: React.FC<LatestSectionProps> = ({ onStoryClick, onCategoryClick }) => {
  const [articles, setArticles] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch('/api/stories/latest');
        if (!response.ok) {
          const mockLatest: Story[] = [
            { id: 5, title: "The Best Lightweight Tents for 2024", imageUrl: "https://picsum.photos/seed/tent/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Mike Chan" }, date: "October 21, 2024", readTime: "7 min", excerpt: "We've tested the top lightweight tents on the market to help you find the perfect shelter." },
            { id: 6, title: "How to Plan Your First Solo Backpacking Trip", imageUrl: "https://picsum.photos/seed/solo/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Sarah Jenkins" }, date: "October 20, 2024", readTime: "9 min", excerpt: "A comprehensive guide to a safe and memorable solo trip for aspiring adventurers." },
            { id: 7, title: "A Culinary Journey Through the Streets of Tokyo", imageUrl: "https://picsum.photos/seed/tokyo/600/400", category: "Food & Travel", categoryColor: "bg-pink-500", author: { name: "Kenji Tanaka" }, date: "October 19, 2024", readTime: "6 min", excerpt: "Discover the hidden culinary gems in the bustling metropolis of Tokyo." },
            { id: 8, title: "The Most Breathtaking National Parks in the US", imageUrl: "https://picsum.photos/seed/parks/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "David Miller" }, date: "October 18, 2024", readTime: "10 min", excerpt: "A visual tour of the most stunning national parks across the United States." },
          ];
          setArticles(mockLatest);
          return;
        }
        const data: Story[] = await response.json();
        setArticles(data);
      } catch (err) {
        setError('Failed to load latest articles.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b-2 border-blue-500 pb-2 inline-block">
              Latest Articles
            </h2>
            {loading && <p>Loading articles...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map(article => (
                  <StoryCard 
                    key={article.id} 
                    story={article} 
                    onStoryClick={onStoryClick} 
                    onCategoryClick={onCategoryClick}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
             <PopularNewsSidebar onStoryClick={onStoryClick} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestSection;