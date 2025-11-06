import React, { useState, useEffect } from 'react';
import type { GalleryImage } from '../types';
import ImageModal from './ImageModal';
import GalleryImageCard from './GalleryImageCard';
import { API_BASE_URL } from '../utils/apiConfig';
import { normalizeMediaValue } from '../utils/mediaUrl';

const DEFAULT_IMAGE = 'https://picsum.photos/seed/fjkm-gallery/800/600';

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

const mapGalleryImages = (payload: unknown): GalleryImage[] => {
  const mapFlatArray = (items: unknown[]): GalleryImage[] =>
    items.map((item, index) => {
      const image = item as Partial<GalleryImage> & {
        id?: number;
        title?: string | null;
        imageUrl?: string | null;
        category?: string | null;
        caption?: string | null;
      };

      const rawImage = image.imageUrl ?? '';
      const { primary, fallbacks } = normalizeMediaValue(rawImage, {
        fallback: DEFAULT_IMAGE,
      });

      return {
        id: typeof image.id === 'number' ? image.id : index,
        imageUrl: primary,
        imageFallbacks: fallbacks,
        title: pickNonEmptyString(image.title, image.caption) ?? `Image ${index + 1}`,
        category: pickNonEmptyString(image.category) ?? 'Divers',
        caption: pickNonEmptyString(image.caption) ?? null,
      } satisfies GalleryImage;
    });

  if (Array.isArray(payload)) {
    return mapFlatArray(payload);
  }

  if (payload && typeof payload === 'object') {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      const results: GalleryImage[] = [];
      let fallbackId = 100000;

      maybeData.forEach((collection, collectionIndex) => {
        if (!collection || typeof collection !== 'object') {
          return;
        }

        const group = collection as {
          id?: number;
          name?: string | null;
          keyword?: string | null;
          description?: string | null;
          items?: unknown[];
        };

        const defaultCategory =
          pickNonEmptyString(group.name, group.keyword, group.description) ??
          `Collection ${collectionIndex + 1}`;

        const items = Array.isArray(group.items) ? group.items : [];

        items.forEach((entry, itemIndex) => {
          if (!entry || typeof entry !== 'object') {
            return;
          }

          const item = entry as {
            id?: number;
            title?: string | null;
            caption?: string | null;
            imageUrl?: string | null;
            category?: string | null;
          };

          const category =
            pickNonEmptyString(item.category, defaultCategory) ?? 'Divers';

          const title =
            pickNonEmptyString(item.title, item.caption) ??
            `${category} ${itemIndex + 1}`;

          const caption = pickNonEmptyString(item.caption) ?? null;

          const rawImage = item.imageUrl ?? '';
          const { primary, fallbacks } = normalizeMediaValue(rawImage, {
            fallback: DEFAULT_IMAGE,
          });

          results.push({
            id: typeof item.id === 'number' ? item.id : fallbackId++,
            imageUrl: primary,
            imageFallbacks: fallbacks,
            title,
            category,
            caption,
          });
        });
      });

      return results;
    }
  }

  throw new Error('Réponse de galerie invalide');
};

const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toutes']);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          const mockImages: GalleryImage[] = [
            { id: 1, imageUrl: `https://picsum.photos/seed/gallery1/800/600`, title: `Panorama de montagne`, category: 'Paysages' },
            { id: 2, imageUrl: `https://picsum.photos/seed/gallery2/800/600`, title: `Kayak sur le lac`, category: 'Moments de vie' },
            { id: 3, imageUrl: `https://picsum.photos/seed/gallery3/800/600`, title: `Matériel de camping`, category: 'Matériel' },
            { id: 4, imageUrl: `https://picsum.photos/seed/gallery4/800/600`, title: `Sentier en forêt`, category: 'Paysages' },
            { id: 5, imageUrl: `https://picsum.photos/seed/gallery5/800/600`, title: `Aigle à tête blanche`, category: 'Faune' },
            { id: 6, imageUrl: `https://picsum.photos/seed/gallery6/800/600`, title: `Alpiniste sur une falaise`, category: 'Moments de vie' },
            { id: 7, imageUrl: `https://picsum.photos/seed/gallery7/800/600`, title: `Sac à dos et chaussures`, category: 'Matériel' },
            { id: 8, imageUrl: `https://picsum.photos/seed/gallery8/800/600`, title: `Coucher de soleil côtier`, category: 'Paysages' },
            { id: 9, imageUrl: `https://picsum.photos/seed/gallery9/800/600`, title: `Renard dans la neige`, category: 'Faune' },
            { id: 10, imageUrl: `https://picsum.photos/seed/gallery10/800/600`, title: `Cycliste sur la route`, category: 'Moments de vie' },
            { id: 11, imageUrl: `https://picsum.photos/seed/gallery11/800/600`, title: `Dunes désertiques`, category: 'Paysages' },
            { id: 12, imageUrl: `https://picsum.photos/seed/gallery12/800/600`, title: `Boussole de navigation`, category: 'Matériel' },
            { id: 13, imageUrl: `https://picsum.photos/seed/gallery13/800/600`, title: `Ours dans les bois`, category: 'Faune' },
            { id: 14, imageUrl: `https://picsum.photos/seed/gallery14/800/600`, title: `Surfeur sur la vague`, category: 'Moments de vie' },
            { id: 15, imageUrl: `https://picsum.photos/seed/gallery15/800/600`, title: `Aurores boréales`, category: 'Paysages' },
            { id: 16, imageUrl: `https://picsum.photos/seed/gallery16/800/600`, title: `Chèvre de montagne`, category: 'Faune' },
            { id: 17, imageUrl: `https://picsum.photos/seed/gallery17/800/600`, title: 'Histoires au coin du feu', category: 'Moments de vie' },
            { id: 18, imageUrl: `https://picsum.photos/seed/gallery18/800/600`, title: 'Tente résistante', category: 'Matériel' },
            { id: 19, imageUrl: `https://picsum.photos/seed/gallery19/800/600`, title: 'Élan près de la rivière', category: 'Faune' },
            { id: 20, imageUrl: `https://picsum.photos/seed/gallery20/800/600`, title: 'Cratère volcanique', category: 'Paysages' },
            { id: 21, imageUrl: `https://picsum.photos/seed/gallery21/800/600`, title: 'Nuit d\'observation des étoiles', category: 'Moments de vie' },
            { id: 22, imageUrl: `https://picsum.photos/seed/gallery22/800/600`, title: 'Réchaud de camp', category: 'Matériel' },
            { id: 23, imageUrl: `https://picsum.photos/seed/gallery23/800/600`, title: 'Dauphins au large', category: 'Faune' },
            { id: 24, imageUrl: `https://picsum.photos/seed/gallery24/800/600`, title: 'Vallée glaciaire', category: 'Paysages' },
          ];
          const fallbackMapped = mapGalleryImages(mockImages);
          setImages(fallbackMapped);
          const allCategories = ['Toutes', ...new Set(fallbackMapped.map(img => img.category))];
          setCategories(allCategories);
          return;
        }
        const payload = await response.json();
        const mapped = mapGalleryImages(payload);
        setImages(mapped);
        const allCategories = ['Toutes', ...new Set(mapped.map(img => img.category))];
        setCategories(allCategories);
      } catch (err) {
        setError('Impossible de charger la galerie.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'Toutes') {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, images]);
  
  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return;

    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCategory(category);
      setIsAnimating(false);
    }, 300);
  };


  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
          Notre galerie
        </h2>
        
        {!loading && !error && (
          <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-10">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#1a3a5f] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-200 shadow-sm'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-center"><p>Chargement de la galerie...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {!loading && !error && (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {filteredImages.map(image => (
              <GalleryImageCard
                key={image.id}
                image={image}
                onClick={() => setSelectedImage(image)}
              />
            ))}
          </div>
        )}
      </div>
      {selectedImage && (
        <ImageModal 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </section>
  );
};

export default GalleryPage;
