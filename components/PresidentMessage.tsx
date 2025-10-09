import React, { useState, useEffect } from 'react';
import type { President } from '../types';

const PresidentMessage: React.FC = () => {
  const [data, setData] = useState<President | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/president-message');
        if (response.ok) {
           const mockData: President = {
            name: 'Alexandre Moreau',
            title: 'Président & Fondateur, Adventure Today',
            quote: '"L\'aventure, ce n\'est pas seulement les destinations que nous atteignons ; c\'est le voyage, les défis que nous surmontons et les liens que nous tissons en chemin."',
            message: 'Ici, à Adventure Today, notre mission est de vous inciter à sortir de votre zone de confort, à explorer le monde incroyable qui nous entoure et à vivre une vie moins ordinaire. Nous croyons que chaque excursion, grande ou petite, a le pouvoir de transformer.',
            imageUrl: 'https://picsum.photos/seed/president/600/700'
          };
          setData(mockData);
          return;
        }
        const presidentData: President = await response.json();
        setData(presidentData);
      } catch (err) {
        setError("Failed to load the president's message.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {loading && <div className="text-center"><p>Loading message...</p></div>}
        {error && <div className="text-center text-red-600"><p>{error}</p></div>}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 text-gray-700">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Le mot du président
              </h2>
              <p className="mb-4 text-lg">
                {data.quote}
              </p>
              <p className="mb-6">
                {data.message}
              </p>
              <div>
                <p className="font-bold text-gray-800">{data.name}</p>
                <p className="text-sm text-gray-500">{data.title}</p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <img 
                src={data.imageUrl} 
                alt={`${data.name}, ${data.title}`}
                className="rounded-lg shadow-xl w-full max-w-sm object-cover aspect-[4/5]"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PresidentMessage;
