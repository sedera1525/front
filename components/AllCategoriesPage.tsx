import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import CategoryCard from './CategoryCard';
import { API_BASE_URL } from '../utils/apiConfig';
import { normalizeMediaValue } from '../utils/mediaUrl';

interface AllCategoriesPageProps {
  onCategoryClick: (category: string) => void;
}

const DEFAULT_IMAGE = 'https://picsum.photos/seed/fjkm-category/600/400';

const AllCategoriesPage: React.FC<AllCategoriesPageProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });
        if (!response.ok) {
          const mockCategories: Category[] = [
            { name: "FJKM Anosivavaka", imageUrl: "https://picsum.photos/seed/event/600/400", description: "Participez à nos événements et défis captivants aux quatre coins du monde." },
            { name: "Destinations", imageUrl: "https://picsum.photos/seed/destination/600/400", description: "Découvrez des lieux à couper le souffle et des trésors cachés." },
            { name: "Guides", imageUrl: "https://picsum.photos/seed/guides/600/400", description: "Des conseils d'experts et des guides complets pour préparer votre prochain voyage." },
            { name: "Équipement", imageUrl: "https://picsum.photos/seed/equipment/600/400", description: "Avis et recommandations sur le meilleur matériel pour vos aventures." },
            { name: "Cuisine & Voyage", imageUrl: "https://picsum.photos/seed/food/600/400", description: "Explorez les cuisines du monde et des expériences culinaires inoubliables." },
            { name: "Rencontres", imageUrl: "https://picsum.photos/seed/people/600/400", description: "Des histoires inspirantes de la communauté FJKM Anosivavaka." },
            { name: "Faune", imageUrl: "https://picsum.photos/seed/wildlife/600/400", description: "Rencontres avec les créatures les plus fascinantes de la planète." },
            { name: "Matériel", imageUrl: "https://picsum.photos/seed/gear2/600/400", description: "Analyses détaillées et guides sur les dernières innovations d'aventure." },
          ];
          setCategories(mockCategories);
          return;
        }
        const payload = await response.json();
        const normalized = Array.isArray(payload)
          ? payload.map((item: Category) => {
              const { primary, fallbacks } = normalizeMediaValue(item?.imageUrl ?? '', {
                fallback: DEFAULT_IMAGE,
              });
              return {
                ...item,
                imageUrl: primary,
                imageFallbacks: fallbacks,
              };
            })
          : [];
        setCategories(normalized);
      } catch (err) {
        setError('Impossible de charger les catégories.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                Toutes les catégories
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Préparez votre prochaine aventure FJKM Anosivavaka en explorant nos rubriques et nos récits variés.
            </p>
        </div>

        {loading && <div className="text-center"><p>Chargement des catégories...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {categories.map(category => (
              <CategoryCard 
                key={category.name} 
                category={category} 
                onCategoryClick={onCategoryClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AllCategoriesPage;
