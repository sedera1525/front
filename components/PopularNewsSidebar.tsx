import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { TrendingStory, StoryNavigationTarget } from '../types';
import slugify from '../utils/slugify';
import { API_BASE_URL } from '../utils/apiConfig';
import { encodeFallbacks, normalizeMediaValue, shiftFallback } from '../utils/mediaUrl';

const TRENDING_ENDPOINT = `${API_BASE_URL}/api/articles/lasts`;
const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-popular/100/100';

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
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const data = await response.json();

        const normalized = (Array.isArray(data) ? data : []).map((story, index) => {
          const numericId = Number((story as { id?: number | string }).id) || index;
          const title =
            typeof (story as { title?: string }).title === 'string'
              ? (story as { title: string }).title
              : 'Article récent';
          const slugSource = typeof (story as { slug?: string }).slug === 'string'
            ? (story as { slug: string }).slug
            : title;
          const excerpt =
            typeof (story as { excerpt?: string }).excerpt === 'string'
              ? (story as { excerpt: string }).excerpt
              : '';
          const comments = Number((story as { comments?: number | string }).comments) || 0;
          const rawImage =
            (story as { imageUrl?: string }).imageUrl ??
            (story as { image?: string }).image ??
            (story as { cover?: string }).cover ??
            '';
          const { primary, fallbacks } = normalizeMediaValue(rawImage, { fallback: FALLBACK_IMAGE });

          return {
            id: numericId,
            title,
            slug: slugify(`${slugSource}-${numericId}`),
            imageUrl: primary,
            imageFallbacks: fallbacks,
            date: typeof (story as { date?: string }).date === 'string'
              ? (story as { date: string }).date
              : '',
            comments,
            excerpt,
          } satisfies TrendingStory;
        });

        setTrendingStories(normalized);
        setError(null);
      } catch (err) {
        setError('Impossible de charger les articles populaires.');

        // Fallback statique
        const fallbackStories: TrendingStory[] = [
          {
            id: 1,
            title: 'Les voitures autonomes doivent rassurer leurs passagers',
            slug: slugify('Les voitures autonomes doivent rassurer leurs passagers'),
            imageUrl: FALLBACK_IMAGE,
            imageFallbacks: [],
            date: '13 décembre 2024',
            comments: 5,
            excerpt: 'L\'autonomie réussit lorsque les passagers se sentent toujours maîtres du trajet.',
          },
          {
            id: 2,
            title: "Sony Xperia Z3 : l'un des meilleurs smartphones du moment",
            slug: slugify("Sony Xperia Z3 : l'un des meilleurs smartphones du moment"),
            imageUrl: FALLBACK_IMAGE,
            imageFallbacks: [],
            date: '13 décembre 2024',
            comments: 8,
            excerpt: 'Un coup d\'oeil détaillé sur le smartphone phare le plus équilibré de Sony.',
          },
          {
            id: 3,
            title: 'Un géant du BTP réclame 803 M$ après l\'annulation d\'un aéroport',
            slug: slugify('Un géant du BTP réclame 803 M$ après l\'annulation d\'un aéroport'),
            imageUrl: FALLBACK_IMAGE,
            imageFallbacks: [],
            date: '13 décembre 2024',
            comments: 3,
            excerpt: 'Le contentieux s\'intensifie après l\'arrêt soudain d\'un important contrat aérien.',
          },
        ];
        setTrendingStories(fallbackStories);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingStories();
  }, []);
  const content = (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white text-gray-900 shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.5rem] text-blue-500/70">Autres lectures</p>
          <h3 className="text-lg font-semibold tracking-wide text-blue-800">Autres articles</h3>
        </div>
        <span className="hidden rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs text-blue-600 sm:inline-flex">
          {trendingStories.length} idées
        </span>
      </div>

      <div className="relative h-[500px] overflow-hidden group">
        <div className="absolute inset-0 animate-scroll-vertical space-y-4 px-5 py-6 group-hover:[animation-play-state:paused]">
          {[...trendingStories, ...trendingStories].map((story, index) => {
            const slug = story.slug ?? slugify(`${story.title}-${story.id}`);
            const displayIndex = (index % trendingStories.length) + 1;
            return (
              <div
                key={`${story.id}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white/90 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {displayIndex < 10 ? `0${displayIndex}` : displayIndex}
                </div>
                <div className="flex flex-1 items-start gap-3">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    data-fallbacks={
                      story.imageFallbacks && story.imageFallbacks.length > 0
                        ? encodeFallbacks(story.imageFallbacks)
                        : undefined
                    }
                    className="h-16 w-16 flex-shrink-0 rounded-xl border border-blue-100 object-cover shadow-sm"
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
                  <div className="space-y-1 text-gray-700">
                    {story.date && (
                      <p className="text-[11px] uppercase tracking-[0.3rem] text-blue-500/70">
                        {story.date}
                      </p>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900">
                      <Link
                        to={`/article/${slug}`}
                        onClick={() => onStoryClick({ id: story.id, slug })}
                        className="transition hover:text-blue-600"
                      >
                        {story.title}
                      </Link>
                    </h4>
                    {story.excerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {story.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
      </div>
    </div>
  );

  return (
    <div className="sticky top-28">
      {loading && (
        <div className="p-4 text-center bg-white border border-gray-200">
          Chargement des actualités populaires...
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
