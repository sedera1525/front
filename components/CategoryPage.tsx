import React, { useState, useEffect } from 'react';
import type { Story, StoryNavigationTarget } from '../types';
import LazyArticleCard from './LazyArticleCard';
import slugify from '../utils/slugify';
import { API_BASE_URL } from '../utils/apiConfig';
import { normalizeMediaValue } from '../utils/mediaUrl';

interface CategoryPageProps {
  category: string;
  onStoryClick: (target: StoryNavigationTarget) => void;
  onCategoryClick: (category: string) => void;
}

const DEFAULT_IMAGE = 'https://picsum.photos/seed/fjkm-category-story/600/400';
const DEFAULT_AVATAR = 'https://picsum.photos/seed/fjkm-author/80/80';

const mapArticles = (payload: unknown): Story[] => {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid category articles payload');
  }

  return payload.map((item, index) => {
    const article = item as Partial<Story> & {
      id?: number;
      slug?: string | null;
      imageUrl?: string | null;
      title?: string | null;
      category?: string | null;
      categoryColor?: string | null;
      excerpt?: string | null;
      author?: {
        name?: string | null;
        avatarUrl?: string | null;
      } | null;
      date?: string | null;
      readTime?: string | null;
    };

    const id = typeof article.id === 'number' ? article.id : index;
    const rawImagePath = article.imageUrl ?? '';
    const { primary: imageUrl, fallbacks: imageFallbacks } = normalizeMediaValue(rawImagePath, {
      fallback: DEFAULT_IMAGE,
    });

    const rawAuthor = article.author ?? undefined;
    const authorMedia = normalizeMediaValue(rawAuthor?.avatarUrl ?? '', {
      fallback: DEFAULT_AVATAR,
    });

    const resolvedTitle = article.title ?? `Article ${id}`;
    const derivedSlug = article.slug?.trim()
      ? slugify(article.slug)
      : slugify(resolvedTitle);

    return {
      id,
      title: resolvedTitle,
      slug: derivedSlug,
      imageUrl,
      imageFallbacks,
      category: article.category ?? 'Actualités',
      categoryColor: article.categoryColor ?? 'bg-blue-600',
      excerpt: article.excerpt ?? undefined,
      author: rawAuthor
        ? {
            name: rawAuthor.name ?? 'Rédaction FJKM',
            avatarUrl: authorMedia.primary,
            avatarFallbacks: authorMedia.fallbacks,
          }
        : undefined,
      date: article.date ?? undefined,
      readTime: article.readTime ?? undefined,
    } satisfies Story;
  });
};

const CategoryPage: React.FC<CategoryPageProps> = ({ category, onStoryClick, onCategoryClick }) => {
  const [articles, setArticles] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/articles?category=${encodeURIComponent(category)}`,
          {
            headers: {
              Accept: 'application/json',
              'ngrok-skip-browser-warning': '1',
            },
          }
        );
        if (!response.ok) {
          const mockArticles: Story[] = [
             // Destination
             { id: 2, title: "Exploring the Untouched Scottish Highlands", slug: slugify("Exploring the Untouched Scottish Highlands"), imageUrl: "https://picsum.photos/seed/scotland/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "Jane Smith" }, date: "Oct 26, 2024", readTime: "8 min", excerpt: "A journey through the raw beauty of Scotland." },
             { id: 8, title: "The Most Breathtaking National Parks in the US", slug: slugify("The Most Breathtaking National Parks in the US"), imageUrl: "https://picsum.photos/seed/parks/400/250", category: "Destination", categoryColor: "bg-red-500", author: { name: "David Miller" }, date: "October 18, 2024", readTime: "10 min", excerpt: "Discover the majestic national parks of the USA." },
             { id: 101, title: "A Week in the Heart of Tuscany", slug: slugify("A Week in the Heart of Tuscany"), imageUrl: "https://picsum.photos/seed/tuscany/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "Maria Rossi" }, date: "Oct 15, 2024", readTime: "7 min", excerpt: "Rolling hills, vineyards, and historic towns." },
             { id: 102, title: "The Mystical Temples of Angkor Wat", slug: slugify("The Mystical Temples of Angkor Wat"), imageUrl: "https://picsum.photos/seed/angkor/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "Chen Li" }, date: "Oct 12, 2024", readTime: "9 min", excerpt: "Uncovering the secrets of ancient Khmer architecture." },
             { id: 103, title: "Patagonia: Journey to the End of the World", slug: slugify("Patagonia: Journey to the End of the World"), imageUrl: "https://picsum.photos/seed/patagonia/600/400", category: "Destination", categoryColor: "bg-red-500", author: { name: "Carlos Ruiz" }, date: "Oct 10, 2024", readTime: "12 min", excerpt: "Glaciers, mountains, and untamed wilderness." },

             // Guides
             { id: 3, title: "The Ultimate Guide to Rock Climbing", slug: slugify("The Ultimate Guide to Rock Climbing"), imageUrl: "https://picsum.photos/seed/climbing/600/400", category: "Guides", categoryColor: "bg-indigo-500", excerpt: "From beginner knots to advanced techniques, our guide has everything you need.", author: { name: "Alex Johnson" }, date: "Oct 24, 2024", readTime: "6 min" },
             { id: 6, title: "How to Plan Your First Solo Backpacking Trip", slug: slugify("How to Plan Your First Solo Backpacking Trip"), imageUrl: "https://picsum.photos/seed/solo/400/250", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Sarah Jenkins" }, date: "October 20, 2024", readTime: "9 min", excerpt: "Your comprehensive guide to a safe and memorable solo trip." },
             { id: 104, title: "Mastering Night Sky Photography", slug: slugify("Mastering Night Sky Photography"), imageUrl: "https://picsum.photos/seed/astrophotography/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Emily White" }, date: "Oct 18, 2024", readTime: "8 min", excerpt: "Capture the beauty of the cosmos with these expert tips." },
             { id: 105, title: "Survival Basics: What to Pack in Your Emergency Kit", slug: slugify("Survival Basics: What to Pack in Your Emergency Kit"), imageUrl: "https://picsum.photos/seed/survival/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "John Rourke" }, date: "Oct 16, 2024", readTime: "5 min", excerpt: "Essential gear that could save your life in the wild." },
             { id: 106, title: "Kayaking for Beginners: A Step-by-Step Guide", slug: slugify("Kayaking for Beginners: A Step-by-Step Guide"), imageUrl: "https://picsum.photos/seed/kayakguide/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Linda Evans" }, date: "Oct 14, 2024", readTime: "7 min", excerpt: "Everything you need to know to get started on the water." },

             // Equipment
             { id: 107, title: "The Top 5 Hiking Boots of the Year", slug: slugify("The Top 5 Hiking Boots of the Year"), imageUrl: "https://picsum.photos/seed/boots/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Mark Wilson" }, date: "Oct 25, 2024", readTime: "8 min", excerpt: "We tested the best boots for comfort, durability, and traction." },
             { id: 108, title: "Is a GPS Watch Worth It for Hikers?", slug: slugify("Is a GPS Watch Worth It for Hikers?"), imageUrl: "https://picsum.photos/seed/gpswatch/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Tech Guru" }, date: "Oct 22, 2024", readTime: "6 min", excerpt: "A deep dive into the features and benefits of modern GPS watches." },
             { id: 109, title: "Choosing the Right Backpack for Your Body Type", slug: slugify("Choosing the Right Backpack for Your Body Type"), imageUrl: "https://picsum.photos/seed/backpack/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Anna Bell" }, date: "Oct 19, 2024", readTime: "7 min", excerpt: "Finding the perfect fit is crucial for a comfortable journey." },
             { id: 110, title: "The Evolution of Camping Stoves", slug: slugify("The Evolution of Camping Stoves"), imageUrl: "https://picsum.photos/seed/stove/600/400", category: "Equipment", categoryColor: "bg-purple-500", author: { name: "Gear Head" }, date: "Oct 17, 2024", readTime: "5 min", excerpt: "From bulky classics to ultralight powerhouses." },
             
             // FJKM Anosivavaka Event
             { id: 111, title: "Recap: The Annual Mountain Marathon", slug: slugify("Recap: The Annual Mountain Marathon"), imageUrl: "https://picsum.photos/seed/marathon/600/400", category: "FJKM Anosivavaka Event", categoryColor: "bg-blue-500", author: { name: "Event Staff" }, date: "Nov 1, 2024", readTime: "5 min", excerpt: "Highlights from this year's grueling but rewarding race." },
             { id: 112, title: "Join Us for the Coastal Cleanup Challenge", slug: slugify("Join Us for the Coastal Cleanup Challenge"), imageUrl: "https://picsum.photos/seed/cleanup/600/400", category: "FJKM Anosivavaka Event", categoryColor: "bg-blue-500", author: { name: "Eco Warriors" }, date: "Oct 28, 2024", readTime: "3 min", excerpt: "Make a difference while enjoying the beautiful coastline." },
             { id: 113, title: "Upcoming: The Great Kayak Regatta", slug: slugify("Upcoming: The Great Kayak Regatta"), imageUrl: "https://picsum.photos/seed/regatta/600/400", category: "FJKM Anosivavaka Event", categoryColor: "bg-blue-500", author: { name: "Water Sports Inc." }, date: "Oct 25, 2024", readTime: "4 min", excerpt: "Paddlers of all skill levels are invited to participate." },
          ].filter(a => a.category === category);

           if (mockArticles.length === 0) {
              // Generic mock if no specific one matches
              mockArticles.push({ id: 100, title: `A Story About ${category}`, slug: slugify(`A Story About ${category}`), imageUrl: `https://picsum.photos/seed/${category}/600/400`, category: category, categoryColor: 'bg-gray-500', author: {name: 'Mock Author'}, date: 'Jan 1, 2025', excerpt: `An exciting FJKM Anosivavaka in the world of ${category}.` });
              mockArticles.push({ id: 200, title: `Another Tale of ${category}`, slug: slugify(`Another Tale of ${category}`), imageUrl: `https://picsum.photos/seed/${category}2/600/400`, category: category, categoryColor: 'bg-gray-500', author: {name: 'Mock Author'}, date: 'Jan 2, 2025', excerpt: `Exploring more FJKM Anosivavakas in ${category}.` });
           }

          setArticles(mockArticles);
          return;
        }
        const payload = await response.json();
        const normalized = mapArticles(payload);
        setArticles(normalized);
      } catch (err) {
        setError(`Failed to load articles for category: ${category}.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [category]);

  return (
    <section className="bg-gray-100 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold">Showing stories for</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                {category}
            </h1>
        </div>
        
        {loading && <div className="text-center"><p>Loading articles...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {!loading && !error && (
            articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <LazyArticleCard 
                            key={article.id}
                            article={article}
                            onStoryClick={onStoryClick}
                            onCategoryClick={onCategoryClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-600 mt-8">
                    <p className="text-lg">No articles found in this category yet.</p>
                    <p className="text-sm">Please check back later!</p>
                </div>
            )
        )}
      </div>
    </section>
  );
};

export default CategoryPage;
