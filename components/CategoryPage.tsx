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
    throw new Error('Réponse invalide pour les articles de la catégorie');
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
             // Destinations
             { id: 2, title: "Explorer les Highlands écossais intacts", slug: slugify("Explorer les Highlands écossais intacts"), imageUrl: "https://picsum.photos/seed/scotland/600/400", category: "Destinations", categoryColor: "bg-red-500", author: { name: "Jane Smith" }, date: "26 octobre 2024", readTime: "8 min", excerpt: "Un périple au coeur des paysages sauvages et préservés d'Écosse." },
             { id: 8, title: "Les parcs nationaux les plus époustouflants des États-Unis", slug: slugify("Les parcs nationaux les plus époustouflants des États-Unis"), imageUrl: "https://picsum.photos/seed/parks/400/250", category: "Destinations", categoryColor: "bg-red-500", author: { name: "David Miller" }, date: "18 octobre 2024", readTime: "10 min", excerpt: "Un tour d'horizon des parcs à visiter absolument aux États-Unis." },
             { id: 101, title: "Une semaine au coeur de la Toscane", slug: slugify("Une semaine au coeur de la Toscane"), imageUrl: "https://picsum.photos/seed/tuscany/600/400", category: "Destinations", categoryColor: "bg-red-500", author: { name: "Maria Rossi" }, date: "15 octobre 2024", readTime: "7 min", excerpt: "Collines ondulantes, vignobles et villages chargés d'histoire." },
             { id: 102, title: "Les temples mystiques d'Angkor Wat", slug: slugify("Les temples mystiques d'Angkor Wat"), imageUrl: "https://picsum.photos/seed/angkor/600/400", category: "Destinations", categoryColor: "bg-red-500", author: { name: "Chen Li" }, date: "12 octobre 2024", readTime: "9 min", excerpt: "Percez les secrets de l'architecture khmère ancestrale." },
             { id: 103, title: "Patagonie : voyage au bout du monde", slug: slugify("Patagonie : voyage au bout du monde"), imageUrl: "https://picsum.photos/seed/patagonia/600/400", category: "Destinations", categoryColor: "bg-red-500", author: { name: "Carlos Ruiz" }, date: "10 octobre 2024", readTime: "12 min", excerpt: "Glaciers géants, montagnes et nature indomptée au programme." },

             // Guides
             { id: 3, title: "Guide ultime de l'escalade", slug: slugify("Guide ultime de l'escalade"), imageUrl: "https://picsum.photos/seed/climbing/600/400", category: "Guides", categoryColor: "bg-indigo-500", excerpt: "Des noeuds de base aux techniques avancées, tout ce qu'il faut savoir.", author: { name: "Alex Johnson" }, date: "24 octobre 2024", readTime: "6 min" },
             { id: 6, title: "Organiser son premier trek en solo", slug: slugify("Organiser son premier trek en solo"), imageUrl: "https://picsum.photos/seed/solo/400/250", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Sarah Jenkins" }, date: "20 octobre 2024", readTime: "9 min", excerpt: "Le guide indispensable pour une aventure mémorable en toute sécurité." },
             { id: 104, title: "Maîtriser la photographie du ciel nocturne", slug: slugify("Maîtriser la photographie du ciel nocturne"), imageUrl: "https://picsum.photos/seed/astrophotography/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Emily White" }, date: "18 octobre 2024", readTime: "8 min", excerpt: "Capturez la beauté du cosmos grâce à ces conseils d'experts." },
             { id: 105, title: "Survie : que mettre dans son kit d'urgence", slug: slugify("Survie : que mettre dans son kit d'urgence"), imageUrl: "https://picsum.photos/seed/survival/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "John Rourke" }, date: "16 octobre 2024", readTime: "5 min", excerpt: "Les indispensables qui peuvent faire toute la différence en pleine nature." },
             { id: 106, title: "Kayak pour débutants : guide pas à pas", slug: slugify("Kayak pour débutants : guide pas à pas"), imageUrl: "https://picsum.photos/seed/kayakguide/600/400", category: "Guides", categoryColor: "bg-indigo-500", author: { name: "Linda Evans" }, date: "14 octobre 2024", readTime: "7 min", excerpt: "Tout ce qu'il faut savoir pour bien démarrer sur l'eau." },

             // Équipement
             { id: 107, title: "Les 5 meilleures chaussures de randonnée de l'année", slug: slugify("Les 5 meilleures chaussures de randonnée de l'année"), imageUrl: "https://picsum.photos/seed/boots/600/400", category: "Équipement", categoryColor: "bg-purple-500", author: { name: "Mark Wilson" }, date: "25 octobre 2024", readTime: "8 min", excerpt: "Confort, solidité et adhérence : notre sélection testée sur le terrain." },
             { id: 108, title: "Une montre GPS est-elle indispensable aux randonneurs ?", slug: slugify("Une montre GPS est-elle indispensable aux randonneurs ?"), imageUrl: "https://picsum.photos/seed/gpswatch/600/400", category: "Équipement", categoryColor: "bg-purple-500", author: { name: "Tech Guru" }, date: "22 octobre 2024", readTime: "6 min", excerpt: "Analyse des fonctionnalités et des bénéfices des modèles récents." },
             { id: 109, title: "Choisir le sac à dos adapté à sa morphologie", slug: slugify("Choisir le sac à dos adapté à sa morphologie"), imageUrl: "https://picsum.photos/seed/backpack/600/400", category: "Équipement", categoryColor: "bg-purple-500", author: { name: "Anna Bell" }, date: "19 octobre 2024", readTime: "7 min", excerpt: "Un bon ajustement est essentiel pour voyager confortablement." },
             { id: 110, title: "L'évolution des réchauds de camping", slug: slugify("L'évolution des réchauds de camping"), imageUrl: "https://picsum.photos/seed/stove/600/400", category: "Équipement", categoryColor: "bg-purple-500", author: { name: "Gear Head" }, date: "17 octobre 2024", readTime: "5 min", excerpt: "Des modèles classiques aux solutions ultralégères les plus récentes." },
             
             // Événements FJKM Anosivavaka
             { id: 111, title: "Retour sur le marathon annuel de montagne", slug: slugify("Retour sur le marathon annuel de montagne"), imageUrl: "https://picsum.photos/seed/marathon/600/400", category: "Événements FJKM Anosivavaka", categoryColor: "bg-blue-500", author: { name: "Équipe Événementielle" }, date: "1 novembre 2024", readTime: "5 min", excerpt: "Moments forts d'une course exigeante mais pleine d'émotions." },
             { id: 112, title: "Participez à notre défi de nettoyage des côtes", slug: slugify("Participez à notre défi de nettoyage des côtes"), imageUrl: "https://picsum.photos/seed/cleanup/600/400", category: "Événements FJKM Anosivavaka", categoryColor: "bg-blue-500", author: { name: "Eco Warriors" }, date: "28 octobre 2024", readTime: "3 min", excerpt: "Agissez pour la planète tout en profitant du littoral." },
             { id: 113, title: "À venir : la grande régate de kayak", slug: slugify("À venir : la grande régate de kayak"), imageUrl: "https://picsum.photos/seed/regatta/600/400", category: "Événements FJKM Anosivavaka", categoryColor: "bg-blue-500", author: { name: "Water Sports Inc." }, date: "25 octobre 2024", readTime: "4 min", excerpt: "Les pagayeurs de tous niveaux sont invités à se joindre à la fête." },
          ].filter(a => a.category === category);

           if (mockArticles.length === 0) {
              // Generic mock if no specific one matches
              mockArticles.push({ id: 100, title: `Un récit autour de ${category}`, slug: slugify(`Un récit autour de ${category}`), imageUrl: `https://picsum.photos/seed/${category}/600/400`, category: category, categoryColor: 'bg-gray-500', author: {name: 'Auteur Invité'}, date: '1 janvier 2025', excerpt: `Une aventure palpitante dans l'univers de ${category}.` });
              mockArticles.push({ id: 200, title: `Un autre regard sur ${category}`, slug: slugify(`Un autre regard sur ${category}`), imageUrl: `https://picsum.photos/seed/${category}2/600/400`, category: category, categoryColor: 'bg-gray-500', author: {name: 'Auteur Invité'}, date: '2 janvier 2025', excerpt: `Découvrez d'autres histoires inspirantes liées à ${category}.` });
           }

          setArticles(mockArticles);
          return;
        }
        const payload = await response.json();
        const normalized = mapArticles(payload);
        setArticles(normalized);
      } catch (err) {
        setError(`Impossible de charger les articles pour la catégorie : ${category}.`);
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
            <p className="text-blue-600 font-semibold">Articles de catégorie</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                {category}
            </h1>
        </div>
        
        {loading && <div className="text-center"><p>Chargement des articles...</p></div>}
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
                    <p className="text-lg">Aucun article trouvé dans cette catégorie pour le moment.</p>
                    <p className="text-sm">Revenez bientôt !</p>
                </div>
            )
        )}
      </div>
    </section>
  );
};

export default CategoryPage;
