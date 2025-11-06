import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import { API_BASE_URL } from '../utils/apiConfig';
import { encodeFallbacks, normalizeMediaValue, shiftFallback } from '../utils/mediaUrl';

interface FeaturedCategoriesProps {
  onCategoryClick: (category: string) => void;
}

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/categories`;
const DEFAULT_IMAGE = 'https://picsum.photos/seed/fjkm-featured/600/400';

type ApiCategory = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
};

const normalizeCategories = (payload: unknown): Category[] => {
  if (!Array.isArray(payload)) {
    throw new Error('Réponse de catégories invalide');
  }

  return payload.map((item) => {
    const category = item as ApiCategory;
    const rawImagePath = category.imageUrl?.trim() ?? '';
    const { primary, fallbacks } = normalizeMediaValue(rawImagePath, {
      fallback: DEFAULT_IMAGE,
    });

    return {
      name: category.name,
      imageUrl: primary,
      imageFallbacks: fallbacks,
      description: category.description ?? `Découvrez la catégorie ${category.name}`,
    };
  });
};

const FeaturedStories: React.FC<FeaturedCategoriesProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(CATEGORIES_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const rawPayload = await response.json();
        const normalized = normalizeCategories(rawPayload);
        setCategories(normalized);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les catégories.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-start text-gray-800 mb-12">
          FJKM Anosivavaka
        </h2>

        {loading && <p className="text-center">Chargement des catégories...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <div
                key={category.name}
                onClick={() => onCategoryClick(category.name)}
                className="cursor-pointer"
              >
                <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    data-fallbacks={
                      category.imageFallbacks && category.imageFallbacks.length > 0
                        ? encodeFallbacks(category.imageFallbacks)
                        : undefined
                    }
                    className="w-full h-48 object-cover"
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
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedStories;
