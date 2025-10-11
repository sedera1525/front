import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { TrendingStory, StoryNavigationTarget } from '../types';
import slugify from '../utils/slugify';

const API_BASE_URL = 'https://91eb35f24335.ngrok-free.app';
const TRENDING_ENDPOINT = `${API_BASE_URL}/api/articles/lasts`;
const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-popular/100/100';

const normalizeImageUrl = (raw?: string | null): string => {
  const value = raw?.trim() ?? '';
  if (!value) return FALLBACK_IMAGE;

  // Si c’est déjà une URL absolue (http:// ou https://)
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Si c’est un chemin relatif
  const cleaned = value.replace(/^\/+/, '');
  const prefixed = cleaned.startsWith('storage/')
    ? cleaned
    : `storage/${cleaned}`;
  return `${API_BASE_URL}/${prefixed}`;
};

interface PopularNewsSidebarProps {
  onStoryClick: (target: StoryNavigationTarget) => void;
}

const PopularNewsSidebar: React.FC<PopularNewsSidebarProps> = ({ onStoryClick }) => {
  const [trendingStories, setTrendingStories] = useState<TrendingStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStories = async () => {
      try {
        const response = await fetch(TRENDING_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const data: TrendingStory[] = await response.json();

        // ✅ Normalisation des données
        const normalized = data.map((story, index) => {
          const numericId = Number(story.id) || index;
          const title = typeof story.title === 'string' ? story.title : 'Article récent';
          const slugSource = story.slug ?? title;
          const excerpt = typeof (story as { excerpt?: string }).excerpt === 'string'
            ? (story as { excerpt: string }).excerpt
            : '';
          const comments = Number((story as { comments?: number | string }).comments) || 0;

          return {
            id: numericId,
            title,
            slug: slugify(`${slugSource}-${numericId}`),
            imageUrl: normalizeImageUrl((story as { imageUrl?: string; image?: string; cover?: string }).imageUrl ?? (story as { image?: string }).image ?? (story as { cover?: string }).cover),
            date: typeof story.date === 'string' ? story.date : '',
            comments,
            excerpt,
          } satisfies TrendingStory;
        });

        setTrendingStories(normalized);
        setError(null);
      } catch (err) {
        setError('Failed to load popular stories.');

        // Fallback statique
        const fallbackStories: TrendingStory[] = [
          {
            id: 1,
            title: 'Driverless cars need to make their passengers feel like drivers',
            slug: slugify('Driverless cars need to make their passengers feel like drivers'),
            imageUrl: normalizeImageUrl('https://picsum.photos/seed/car/100/100'),
            date: 'December 13, 2024',
            comments: 5,
            excerpt: 'Autonomy succeeds when riders still feel in control behind the wheel.',
          },
          {
            id: 2,
            title: "One of the best phones around: Sony's Xperia Z3 reviewed",
            slug: slugify("One of the best phones around: Sony's Xperia Z3 reviewed"),
            imageUrl: normalizeImageUrl('https://picsum.photos/seed/phone/100/100'),
            date: 'December 13, 2024',
            comments: 8,
            excerpt: 'A closer look at Sony’s most balanced flagship handset to date.',
          },
          {
            id: 3,
            title: 'Indian construction major seeks $803M over scrapped airport deal',
            slug: slugify('Indian construction major seeks $803M over scrapped airport deal'),
            imageUrl: normalizeImageUrl('https://picsum.photos/seed/plane/100/100'),
            date: 'December 13, 2024',
            comments: 3,
            excerpt: 'Legal battles escalate after the abrupt halt of a major aviation contract.',
          },
        ];
        setTrendingStories(fallbackStories);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingStories();
  }, []);

  // ✅ Log temporaire pour déboguer les images
  useEffect(() => {
    if (trendingStories.length > 0) {
      console.log('🖼️ Trending image URLs:', trendingStories.map(s => s.imageUrl));
    }
  }, [trendingStories]);

  const content = (
    <div className="border border-gray-200 bg-white p-4 pt-0">
      <div className="text-center py-3 border-b border-gray-200 mb-4 -mx-4 px-4 bg-gray-50">
        <h3 className="font-bold text-gray-800 tracking-widest text-sm">Autres articles</h3>
      </div>

      <div className="h-[500px] overflow-hidden relative group">
        <div className="absolute top-0 animate-scroll-vertical group-hover:[animation-play-state:paused]">
          {[...trendingStories, ...trendingStories].map((story, index) => {
            const slug = story.slug ?? slugify(`${story.title}-${story.id}`);
            return (
              <div
                key={`${story.id}-${index}`}
                className="pb-4 mb-4 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-20 h-20 object-cover flex-shrink-0 rounded border border-gray-100"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)} // ✅ fallback image
                  />
                  <div>
                    {story.date && (
                      <p className="text-xs text-gray-500 mb-1">{story.date}</p>
                    )}
                    <h4 className="font-semibold text-sm text-gray-800 leading-tight">
                      <Link
                        to={`/article/${slug}`}
                        onClick={() => onStoryClick({ id: story.id, slug })}
                        className="hover:text-blue-600"
                      >
                        {story.title}
                      </Link>
                    </h4>
                    {story.excerpt && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {story.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );

  return (
    <div className="sticky top-28">
      {loading && (
        <div className="p-4 text-center bg-white border border-gray-200">
          Loading popular news...
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-red-600 bg-white border border-gray-200">
          {error}
        </div>
      )}
      {!loading && trendingStories.length > 0 && content}
    </div>
  );
};

export default PopularNewsSidebar;
