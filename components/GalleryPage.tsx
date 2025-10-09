import React, { useState, useEffect } from 'react';
import type { GalleryImage } from '../types';
import ImageModal from './ImageModal';
import GalleryImageCard from './GalleryImageCard';

const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/gallery');
        if (response.ok) {
          const mockImages: GalleryImage[] = [
            { id: 1, imageUrl: `https://picsum.photos/seed/gallery1/800/600`, title: `Mountain Vista`, category: 'Landscapes' },
            { id: 2, imageUrl: `https://picsum.photos/seed/gallery2/800/600`, title: `Kayaker on Lake`, category: 'People' },
            { id: 3, imageUrl: `https://picsum.photos/seed/gallery3/800/600`, title: `Camping Gear`, category: 'Gear' },
            { id: 4, imageUrl: `https://picsum.photos/seed/gallery4/800/600`, title: `Forest Trail`, category: 'Landscapes' },
            { id: 5, imageUrl: `https://picsum.photos/seed/gallery5/800/600`, title: `Bald Eagle`, category: 'Wildlife' },
            { id: 6, imageUrl: `https://picsum.photos/seed/gallery6/800/600`, title: `Climber on a Cliff`, category: 'People' },
            { id: 7, imageUrl: `https://picsum.photos/seed/gallery7/800/600`, title: `Backpack and Boots`, category: 'Gear' },
            { id: 8, imageUrl: `https://picsum.photos/seed/gallery8/800/600`, title: `Coastal Sunset`, category: 'Landscapes' },
            { id: 9, imageUrl: `https://picsum.photos/seed/gallery9/800/600`, title: `Fox in the Snow`, category: 'Wildlife' },
            { id: 10, imageUrl: `https://picsum.photos/seed/gallery10/800/600`, title: `Cyclist on a Road`, category: 'People' },
            { id: 11, imageUrl: `https://picsum.photos/seed/gallery11/800/600`, title: `Desert Dunes`, category: 'Landscapes' },
            { id: 12, imageUrl: `https://picsum.photos/seed/gallery12/800/600`, title: `Navigation Compass`, category: 'Gear' },
            { id: 13, imageUrl: `https://picsum.photos/seed/gallery13/800/600`, title: `Bear in the Woods`, category: 'Wildlife' },
            { id: 14, imageUrl: `https://picsum.photos/seed/gallery14/800/600`, title: `Surfer on a Wave`, category: 'People' },
            { id: 15, imageUrl: `https://picsum.photos/seed/gallery15/800/600`, title: `Northern Lights`, category: 'Landscapes' },
            { id: 16, imageUrl: `https://picsum.photos/seed/gallery16/800/600`, title: `Mountain Goat`, category: 'Wildlife' },
            { id: 17, imageUrl: `https://picsum.photos/seed/gallery17/800/600`, title: 'Bonfire Stories', category: 'People' },
            { id: 18, imageUrl: `https://picsum.photos/seed/gallery18/800/600`, title: 'Durable Tent', category: 'Gear' },
            { id: 19, imageUrl: `https://picsum.photos/seed/gallery19/800/600`, title: 'Moose by the River', category: 'Wildlife' },
            { id: 20, imageUrl: `https://picsum.photos/seed/gallery20/800/600`, title: 'Volcanic Crater', category: 'Landscapes' },
            { id: 21, imageUrl: `https://picsum.photos/seed/gallery21/800/600`, title: 'Stargazing', category: 'People' },
            { id: 22, imageUrl: `https://picsum.photos/seed/gallery22/800/600`, title: 'Cooking Stove', category: 'Gear' },
            { id: 23, imageUrl: `https://picsum.photos/seed/gallery23/800/600`, title: 'Dolphins at Sea', category: 'Wildlife' },
            { id: 24, imageUrl: `https://picsum.photos/seed/gallery24/800/600`, title: 'Glacier Valley', category: 'Landscapes' },
          ];
          setImages(mockImages);
          const allCategories = ['All', ...new Set(mockImages.map(img => img.category))];
          setCategories(allCategories);
          return;
        }
        const data: GalleryImage[] = await response.json();
        setImages(data);
        const allCategories = ['All', ...new Set(data.map(img => img.category))];
        setCategories(allCategories);
      } catch (err) {
        setError('Failed to load the gallery.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
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
          Our Gallery
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

        {loading && <div className="text-center"><p>Loading gallery...</p></div>}
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