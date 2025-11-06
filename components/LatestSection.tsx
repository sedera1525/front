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
  id?: number;
  title?: string | null;
  slug?: string | null | { current?: string | null; slug?: string | null; value?: string | null };
  imageUrl?: string | null;
  category?: string | null;
  categoryColor?: string | null;
  excerpt?: string | null;
  author?:
    | string
    | null
    | {
        name?: string | null;
        fullName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        title?: string | null;
        avatarUrl?: string | null;
        avatar?: string | null;
        photoUrl?: string | null;
        imageUrl?: string | null;
        image?: string | null;
      };
  date?: string | null;
  readTime?: string | null;
  [key: string]: unknown;
};

const pickNonEmptyString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const extractMediaCandidate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'object') {
    const obj = value as {
      url?: unknown;
      path?: unknown;
      src?: unknown;
      href?: unknown;
      imageUrl?: unknown;
      image_url?: unknown;
      original_url?: unknown;
      secure_url?: unknown;
    };
    return pickNonEmptyString(
      obj.url,
      obj.path,
      obj.src,
      obj.href,
      obj.imageUrl,
      obj.image_url,
      obj.original_url,
      obj.secure_url,
    );
  }
  return undefined;
};

const resolveArticleImage = (article: Record<string, unknown>): string | undefined => {
  const candidateKeys = [
    'imageUrl',
    'imageURL',
    'image',
    'coverImage',
    'cover_image',
    'cover',
    'banner',
    'thumbnail',
    'thumbnailUrl',
    'thumbnail_url',
    'mediaUrl',
    'media_url',
    'heroImage',
    'hero_image',
    'featuredImage',
    'featured_image',
  ];

  for (const key of candidateKeys) {
    const candidate = extractMediaCandidate(article[key]);
    if (candidate) {
      return candidate;
    }
  }

  const media = article.media;
  if (media) {
    const candidate = extractMediaCandidate(media);
    if (candidate) {
      return candidate;
    }
  }

  const attachments = article.attachments;
  if (Array.isArray(attachments)) {
    for (const item of attachments) {
      const candidate = extractMediaCandidate(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  const images = article.images;
  if (Array.isArray(images)) {
    for (const item of images) {
      const candidate = extractMediaCandidate(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  const gallery = article.gallery;
  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      const candidate = extractMediaCandidate(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  const content = article.content;
  if (content && typeof content === 'object') {
    const candidate = extractMediaCandidate((content as Record<string, unknown>).cover);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

const extractArticlesArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData;
    }
  }

  throw new Error('Réponse d\'articles invalide');
};

type NormalizedArticle = {
  story: Story;
  id: number;
  needsImageHydration: boolean;
  needsAuthorHydration: boolean;
};

const normalizeArticles = (payload: unknown): NormalizedArticle[] => {
  const items = extractArticlesArray(payload);

  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Entrée d\'article invalide');
    }

    const article = item as ApiArticle;
    const record = item as Record<string, unknown>;

    const imageSource = resolveArticleImage(record) ?? '';
    const { primary: normalizedImage, fallbacks: imageFallbacks } = normalizeMediaValue(imageSource, {
      fallback: DEFAULT_IMAGE,
      relativePrefixes: ['storage/', 'media/', 'images/'],
    });
    const needsImageHydration =
      !imageSource ||
      /placeholder/i.test(imageSource) ||
      normalizedImage === DEFAULT_IMAGE;

    const rawAuthor = article.author ?? undefined;
    let normalizedAuthor:
      | {
          name: string;
          avatarUrl?: string | null;
        }
      | undefined;

    if (typeof rawAuthor === 'string') {
      const name = rawAuthor.trim();
      if (name.length > 0) {
        normalizedAuthor = { name };
      }
    } else if (rawAuthor && typeof rawAuthor === 'object') {
      const authorObj = rawAuthor as {
        name?: string | null;
        fullName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        title?: string | null;
        avatarUrl?: string | null;
        avatar?: string | null;
        photoUrl?: string | null;
        imageUrl?: string | null;
        image?: string | null;
      };

      const combinedName = [
        authorObj.firstName ?? undefined,
        authorObj.lastName ?? undefined,
      ]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter((part) => part.length > 0)
        .join(' ')
        .trim();

      const name =
        pickNonEmptyString(authorObj.name, authorObj.fullName, combinedName, authorObj.title) ??
        'Auteur';
      const avatarCandidate = extractMediaCandidate(
        pickNonEmptyString(
          authorObj.avatarUrl,
          authorObj.avatar,
          authorObj.photoUrl,
          authorObj.imageUrl,
          authorObj.image,
        ),
      );

      normalizedAuthor = {
        name,
        avatarUrl: avatarCandidate ?? undefined,
      };
    }

    const authorMedia = normalizeMediaValue(normalizedAuthor?.avatarUrl ?? '', {
      fallback: DEFAULT_AVATAR,
    });
    const needsAuthorHydration =
      !!normalizedAuthor &&
      (!normalizedAuthor.avatarUrl || /placeholder/i.test(normalizedAuthor.avatarUrl));

    const slugValue = (() => {
      const slugField = article.slug;
      if (typeof slugField === 'string') {
        return slugField;
      }
      if (slugField && typeof slugField === 'object') {
        const slugObj = slugField as { current?: string | null; slug?: string | null; value?: string | null };
        return pickNonEmptyString(slugObj.current, slugObj.slug, slugObj.value);
      }
      return undefined;
    })();

    const derivedSlugBase =
      pickNonEmptyString(slugValue, article.title ?? undefined, article.id ? String(article.id) : undefined) ??
      `article-${index}`;
    const derivedSlug = slugify(derivedSlugBase);

    const category =
      pickNonEmptyString(
        article.category,
        (record.category as string | undefined),
        (record.topic as string | undefined),
        (record.section as string | undefined),
        (record.keyword as string | undefined),
      ) ?? 'Actualités';

    const categoryColor =
      pickNonEmptyString(article.categoryColor, (record.categoryColor as string | undefined)) ??
      'bg-gray-500';

    const excerpt =
      pickNonEmptyString(
        article.excerpt,
        (record.summary as string | undefined),
        (record.description as string | undefined),
        (record.content as string | undefined),
      ) ?? undefined;

    const date =
      pickNonEmptyString(
        article.date,
        (record.publishedAt as string | undefined),
        (record.published_at as string | undefined),
        (record.createdAt as string | undefined),
        (record.created_at as string | undefined),
      ) ?? undefined;

    const readTime =
      pickNonEmptyString(
        article.readTime,
        (record.read_time as string | undefined),
        (record.readingTime as string | undefined),
      ) ?? undefined;

    const resolvedId = typeof article.id === 'number' ? article.id : index;
    const title =
      pickNonEmptyString(article.title, (record.headline as string | undefined), (record.name as string | undefined)) ??
      `Article ${resolvedId}`;

    const story: Story = {
      id: resolvedId,
      title,
      slug: derivedSlug,
      imageUrl: normalizedImage,
      imageFallbacks,
      category,
      categoryColor,
      excerpt,
      author: normalizedAuthor
        ? {
            name: normalizedAuthor.name,
            avatarUrl: authorMedia.primary,
            avatarFallbacks: authorMedia.fallbacks,
          }
        : undefined,
      date,
      readTime,
    };

    return {
      story,
      id: resolvedId,
      needsImageHydration,
      needsAuthorHydration,
    };
  });
};

const hydrateArticles = async (entries: NormalizedArticle[]): Promise<Story[]> => {
  const tasks = entries.map(async ({ story, id, needsImageHydration, needsAuthorHydration }) => {
    if (!needsImageHydration && !needsAuthorHydration) {
      return story;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/article/${id}`, {
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`Statut inattendu ${response.status}`);
      }

      const payload = await response.json();
      if (!payload || typeof payload !== 'object') {
        return story;
      }

      const detail = (payload as { data?: Record<string, unknown> | null }).data ?? undefined;
      if (!detail || typeof detail !== 'object') {
        return story;
      }

      let nextStory = story;

      if (needsImageHydration) {
        const detailImageSource = resolveArticleImage(detail);
        if (detailImageSource) {
          const imageMedia = normalizeMediaValue(detailImageSource, {
            fallback: story.imageUrl ?? DEFAULT_IMAGE,
            relativePrefixes: ['storage/', 'media/', 'images/'],
          });
          nextStory = {
            ...nextStory,
            imageUrl: imageMedia.primary,
            imageFallbacks: imageMedia.fallbacks.length > 0 ? imageMedia.fallbacks : nextStory.imageFallbacks,
          };
        }
      }

      if (needsAuthorHydration) {
        const detailAuthor = (detail as { author?: unknown }).author;
        if (detailAuthor && typeof detailAuthor === 'object') {
          const authorObj = detailAuthor as {
            name?: unknown;
            fullName?: unknown;
            firstName?: unknown;
            lastName?: unknown;
            title?: unknown;
            avatarUrl?: unknown;
            avatar?: unknown;
            photoUrl?: unknown;
            imageUrl?: unknown;
            image?: unknown;
          };

          const combinedName = [
            authorObj.firstName,
            authorObj.lastName,
          ]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter((value) => value.length > 0)
            .join(' ')
            .trim();

          const authorName =
            pickNonEmptyString(
              authorObj.name,
              authorObj.fullName,
              combinedName,
              authorObj.title,
            ) ?? nextStory.author?.name ?? 'Équipe FJKM Anosivavaka';

          const avatarCandidate = extractMediaCandidate(
            pickNonEmptyString(
              authorObj.avatarUrl,
              authorObj.avatar,
              authorObj.photoUrl,
              authorObj.imageUrl,
              authorObj.image,
            ),
          );

          const authorMedia = normalizeMediaValue(avatarCandidate ?? '', {
            fallback: nextStory.author?.avatarUrl ?? DEFAULT_AVATAR,
            relativePrefixes: ['storage/', 'media/', 'images/'],
          });

          nextStory = {
            ...nextStory,
            author: {
              name: authorName,
              avatarUrl: authorMedia.primary,
              avatarFallbacks: authorMedia.fallbacks.length > 0
                ? authorMedia.fallbacks
                : nextStory.author?.avatarFallbacks,
            },
          };
        }
      }

      if (nextStory !== story) {
        return nextStory;
      }
    } catch (error) {
      console.error('Impossible de récupérer les détails de l\'article', id, error);
    }

    return story;
  });

  const resolved = await Promise.all(tasks);
  return resolved;
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
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const rawPayload = await response.json();
        const normalized = normalizeArticles(rawPayload);
        const hydratedStories = await hydrateArticles(normalized);
        setArticles(hydratedStories);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les derniers articles. Affichage d'un contenu d'exemple.");
        const mockLatest: Story[] = [
          { id: 5, title: "Les meilleures tentes légères de 2024", slug: slugify("Les meilleures tentes légères de 2024"), imageUrl: "https://picsum.photos/seed/tent/600/400", category: "Équipement", categoryColor: "bg-purple-500", author: { name: "Mike Chan" }, date: "21 octobre 2024", readTime: "7 min", excerpt: "Nous avons testé les tentes les plus légères du marché pour vous aider à trouver l'abri idéal." },
          { id: 6, title: "Préparer son premier trek en solo", slug: slugify("Préparer son premier trek en solo"), imageUrl: "https://picsum.photos/seed/solo/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Sarah Jenkins" }, date: "20 octobre 2024", readTime: "9 min", excerpt: "Un guide complet pour vivre une aventure en solo mémorable en toute sécurité." },
          { id: 7, title: "Voyage culinaire dans les rues de Tokyo", slug: slugify("Voyage culinaire dans les rues de Tokyo"), imageUrl: "https://picsum.photos/seed/tokyo/600/400", category: "Cuisine & Voyage", categoryColor: "bg-pink-500", author: { name: "Kenji Tanaka" }, date: "19 octobre 2024", readTime: "6 min", excerpt: "Découvrez les trésors culinaires cachés de la capitale japonaise en pleine effervescence." },
          { id: 8, title: "Les parcs nationaux les plus spectaculaires des États-Unis", slug: slugify("Les parcs nationaux les plus spectaculaires des États-Unis"), imageUrl: "https://picsum.photos/seed/parks/600/400", category: "Destinations", categoryColor: "bg-red-500", author: { name: "David Miller" }, date: "18 octobre 2024", readTime: "10 min", excerpt: "Une visite guidée des parcs nationaux incontournables à travers les États-Unis." },
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
              Articles récents
            </h2>
      {loading && <p>Chargement des articles...</p>}
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
