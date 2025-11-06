import React, { useState, useEffect } from 'react';
import type { Article } from '../types';
import slugify from '../utils/slugify';
import { API_BASE_URL } from '../utils/apiConfig';
import { encodeFallbacks, normalizeMediaValue, shiftFallback } from '../utils/mediaUrl';

interface ArticleDetailProps {
  slug: string;
  initialArticleId?: number;
}

const ARTICLE_ENDPOINT = (id: number) => `${API_BASE_URL}/api/article/${id}`;
const ARTICLES_ENDPOINT = `${API_BASE_URL}/api/articles`;
const DEFAULT_IMAGE = 'https://img.freepik.com/free-vector/film-strip-with-blue-background_1017-29914.jpg?t=st=1731708207~exp=1731711807~hmac=6bce3a20112a2d1064573d4032c042a9ec3841e46431761279bae7664d763529&w=1380';
const DEFAULT_AUTHOR_AVATAR = 'https://picsum.photos/seed/fjkm-author/100/100';

type ApiArticlePayload = {
  data?: {
    id?: number;
    title?: string | null;
    slug?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    categoryColor?: string | null;
    date?: string | null;
    excerpt?: string | null;
    content?: string | null;
    author?: {
      name?: string | null;
      avatarUrl?: string | null;
    } | null;
    readTime?: string | null;
  } | null;
};

const toArticle = (payload: unknown, requestedId: number, fallbackSlug: string): Article => {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Réponse d\'article invalide.');
  }

  const { data } = payload as ApiArticlePayload;
  if (!data) {
    throw new Error('Données d\'article introuvables.');
  }

  const id = data.id ?? requestedId;
  const title = data.title?.trim() || 'Article sans titre';
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(title) || fallbackSlug;
  const category = data.category?.trim() || 'Actualités';
  const categoryColor = data.categoryColor?.trim() || 'bg-gray-500';
  const readTime = data.readTime?.trim() || undefined;
  const excerpt = data.excerpt?.trim() || undefined;
  const rawContent = data.content ?? '';
  const contentHtml = rawContent.trim().length
    ? rawContent
    : excerpt
      ? `<p>${excerpt.replace(/\r?\n{2,}/g, '</p><p>').replace(/\r?\n/g, '<br />')}</p>`
      : '<p>Aucun contenu disponible pour cet article pour le moment.</p>';

  const authorName = data.author?.name?.trim() || 'Équipe FJKM Anosivavaka';
  const articleMedia = normalizeMediaValue(data.imageUrl ?? '', { fallback: DEFAULT_IMAGE });
  const authorMedia = normalizeMediaValue(data.author?.avatarUrl ?? '', {
    fallback: DEFAULT_AUTHOR_AVATAR,
  });

  return {
    id,
    title,
    imageUrl: articleMedia.primary,
    imageFallbacks: articleMedia.fallbacks,
    category,
    categoryColor,
    author: {
      name: authorName,
      avatarUrl: authorMedia.primary,
      avatarFallbacks: authorMedia.fallbacks,
    },
    date: data.date?.trim() || undefined,
    readTime,
    excerpt,
    content: contentHtml,
    slug,
  };
};

const DEFAULT_ARTICLE: Article = {
  id: 0,
  title: 'À la découverte des trésors cachés des Highlands écossais',
  slug: slugify('À la découverte des trésors cachés des Highlands écossais'),
  imageUrl: DEFAULT_IMAGE,
  imageFallbacks: [],
  category: 'Destinations',
  categoryColor: 'bg-red-500',
  author: { name: 'Jane Cooper', avatarUrl: DEFAULT_AUTHOR_AVATAR, avatarFallbacks: [] },
  date: '26 octobre 2024',
  readTime: '8 min',
  excerpt:
    'Les Highlands d\'Écosse forment une région montagneuse et sauvage, réputée pour ses paysages majestueux, ses châteaux historiques et sa culture vibrante.',
  content: `
    <p>Les Highlands d'Écosse forment une région montagneuse et sauvage, réputée pour ses paysages majestueux, ses châteaux historiques et sa culture vibrante. Ce territoire peu peuplé est un paradis pour les amoureux de nature, qui peuvent y pratiquer randonnée, escalade, kayak ou encore observation de la faune.</p>
    <p class="my-4">Notre voyage a débuté à Inverness, capitale culturelle des Highlands. De là, nous avons pris la route vers l'ouest, en direction de l'incontournable Loch Ness. Même si la créature légendaire est restée discrète, la beauté du loch, entouré de collines verdoyantes et de forêts anciennes, nous a laissés sans voix.</p>
    <blockquote class="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-600">
      "Les Highlands ne sont pas seulement un lieu, mais un sentiment. Une impression de liberté et de grandeur qui vous accompagne bien après le voyage."
    </blockquote>
  `,
};

const ArticleDetail: React.FC<ArticleDetailProps> = ({ slug, initialArticleId }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        let resolvedId = initialArticleId ?? null;

        if (!resolvedId) {
          const listResponse = await fetch(ARTICLES_ENDPOINT, {
            headers: {
              Accept: 'application/json',
              'ngrok-skip-browser-warning': '1',
            },
          });

          if (!listResponse.ok) {
            throw new Error(`Statut inattendu ${listResponse.status} lors de la résolution du slug`);
          }

          const listPayload = await listResponse.json();
          if (!Array.isArray(listPayload)) {
            throw new Error('Réponse de liste d\'articles invalide.');
          }

          const fallbackSlug = slugify(slug);
          const matched = listPayload
            .map((item) => {
              const rawId = (item as { id?: number | string }).id;
              const numericId = typeof rawId === 'number' ? rawId : Number(rawId);
              return {
                id: Number.isFinite(numericId) ? numericId : null,
                title: typeof (item as { title?: string }).title === 'string' ? (item as { title?: string }).title as string : '',
              };
            })
            .find((item) => item.id !== null && slugify(item.title) === fallbackSlug);

          if (!matched || matched.id === null) {
            throw new Error(`Article introuvable pour le slug "${slug}".`);
          }

          resolvedId = matched.id;
        }

        if (!resolvedId) {
          throw new Error(`Impossible de déterminer l'article pour le slug "${slug}".`);
        }

        const response = await fetch(ARTICLE_ENDPOINT(resolvedId), {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const payload = await response.json();
        const normalized = toArticle(payload, resolvedId, slugify(slug));
        setArticle(normalized);
      } catch (err) {
        console.error(err);
        setError(`Impossible de charger l'article (${slug}).`);
        setArticle({ ...DEFAULT_ARTICLE, id: initialArticleId ?? 0, slug: slugify(slug) });
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, initialArticleId]);

  if (loading) return <div className="p-4 text-center bg-white rounded-lg shadow-md">Chargement de l'article...</div>;
  if (error) return <div className="p-4 text-center text-red-600 bg-white rounded-lg shadow-md">{error}</div>;
  if (!article) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-10">
      <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor} mb-4 inline-block`}>
        {article.category}
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
      <div className="flex items-center space-x-4 mb-6 border-b border-t border-gray-200 py-4">
        <img
          src={article.author.avatarUrl}
          alt={article.author.name}
          data-fallbacks={
            article.author.avatarFallbacks && article.author.avatarFallbacks.length > 0
              ? encodeFallbacks(article.author.avatarFallbacks)
              : undefined
          }
          className="w-12 h-12 rounded-full object-cover"
          onError={(event) => {
            const nextSrc = shiftFallback(event.currentTarget);
            if (nextSrc) {
              event.currentTarget.src = nextSrc;
            } else {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_AUTHOR_AVATAR;
            }
          }}
        />
        <div>
          <p className="font-semibold text-gray-800">{article.author.name}</p>
          <p className="text-sm text-gray-500">{article.date}</p>
        </div>
      </div>
      <img
        src={article.imageUrl}
        alt={article.title}
        data-fallbacks={
          article.imageFallbacks && article.imageFallbacks.length > 0
            ? encodeFallbacks(article.imageFallbacks)
            : undefined
        }
        className="w-full rounded-lg shadow-lg mb-8"
        onError={(event) => {
          const nextSrc = shiftFallback(event.currentTarget);
          if (nextSrc) {
            event.currentTarget.src = nextSrc;
          } else {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_IMAGE;
          }
        }}
      />
      <div className="prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: article.content }}>
      </div>
    </div>
  );
};

export default ArticleDetail;
