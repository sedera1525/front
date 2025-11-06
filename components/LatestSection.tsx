import React, { useState, useEffect } from 'react';
import type { Story, StoryNavigationTarget } from '../types';
import StoryCard from './StoryCard'; // Changed from ArticleCard
import PopularNewsSidebar from './PopularNewsSidebar';
import slugify from '../utils/slugify';
import { API_BASE_URL } from '../utils/apiConfig';
import { normalizeMediaValue } from '../utils/mediaUrl';

interface LatestSectionProps {
  onStoryClick: (target: StoryNavigationTarget) => void;
  onCategoryClick: (category: string) => void;
}

const ARTICLES_ENDPOINT = `${API_BASE_URL}/api/articles`;
const DEFAULT_IMAGE = 'https://picsum.photos/seed/fjkm-latest/600/400';
const DEFAULT_AVATAR = 'https://picsum.photos/seed/fjkm-author/100/100';

type ApiArticle = {
  id: number;
  title: string;
  slug?: string | null;
  imageUrl?: string | null;
  category: string;
  categoryColor?: string | null;
  excerpt?: string | null;
  author?: {
    name: string;
    avatarUrl?: string | null;
  } | null;
  date?: string | null;
  readTime?: string | null;
};

const normalizeArticles = (payload: unknown): Story[] => {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid articles payload');
  }

  return payload.map((item) => {
    const article = item as ApiArticle;

    const rawImagePath = article.imageUrl?.trim() ?? '';
    const { primary: normalizedImage, fallbacks: imageFallbacks } = normalizeMediaValue(
      rawImagePath,
      { fallback: DEFAULT_IMAGE },
    );

    const normalizedAuthor = article.author ?? undefined;
    const authorMedia = normalizeMediaValue(normalizedAuthor?.avatarUrl ?? '', {
      fallback: DEFAULT_AVATAR,
    });

    const derivedSlug = article.slug?.trim()
      ? slugify(article.slug)
      : article.title
        ? slugify(article.title)
        : `article-${article.id}`;

    return {
      id: article.id,
      title: article.title,
      slug: derivedSlug,
      imageUrl: normalizedImage,
      imageFallbacks,
      category: article.category,
      categoryColor: article.categoryColor ?? 'bg-gray-500',
      excerpt: article.excerpt ?? undefined,
      author: normalizedAuthor
        ? {
            name: normalizedAuthor.name,
            avatarUrl: authorMedia.primary,
            avatarFallbacks: authorMedia.fallbacks,
          }
        : undefined,
      date: article.date ?? undefined,
      readTime: article.readTime ?? undefined,
    } satisfies Story;
  });
};

const LatestSection: React.FC<LatestSectionProps> = ({ onStoryClick, onCategoryClick }) => {
  const [articles, setArticles] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch(ARTICLES_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const rawPayload = await response.json();
        const normalized = normalizeArticles(rawPayload);
        setArticles(normalized);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load latest articles. Displaying sample content.');
        const mockLatest: Story[] = [
          { id: 5, title: "The Best Lightweight Tents for 2024", slug: slugify("The Best Lightweight Tents for 2024"), imageUrl: "https://picsum.photos/seed/tent/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Mike Chan" }, date: "October 21, 2024", readTime: "7 min", excerpt: "We've tested the top lightweight tents on the market to help you find the perfect shelter." },
          { id: 6, title: "How to Plan Your First Solo Backpacking Trip", slug: slugify("How to Plan Your First Solo Backpacking Trip"), imageUrl: "https://picsum.photos/seed/solo/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Sarah Jenkins" }, date: "October 20, 2024", readTime: "9 min", excerpt: "A comprehensive guide to a safe and memorable solo trip for aspiring FJKM Anosivavakars." },
          { id: 7, title: "A Culinary Journey Through the Streets of Tokyo", slug: slugify("A Culinary Journey Through the Streets of Tokyo"), imageUrl: "https://picsum.photos/seed/tokyo/600/400", category: "Food & Travel", categoryColor: "bg-pink-500", author: { name: "Kenji Tanaka" }, date: "October 19, 2024", readTime: "6 min", excerpt: "Discover the hidden culinary gems in the bustling metropolis of Tokyo." },
          { id: 8, title: "The Most Breathtaking National Parks in the US", slug: slugify("The Most Breathtaking National Parks in the US"), imageUrl: "https://picsum.photos/seed/parks/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "David Miller" }, date: "October 18, 2024", readTime: "10 min", excerpt: "A visual tour of the most stunning national parks across the United States." },
        ];
        setArticles(mockLatest);
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
      {!loading && articles.length > 0 && (
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
