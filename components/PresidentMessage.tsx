import React, { useState, useEffect } from 'react';
import type { President } from '../types';

const API_BASE_URL = 'https://91eb35f24335.ngrok-free.app';
const PRESIDENT_MESSAGE_ENDPOINT = `${API_BASE_URL}/api/president-message`;
const DEFAULT_IMAGE = 'https://picsum.photos/seed/president/600/700';
const DEFAULT_PRESIDENT: President = {
  name: 'Alexandre Moreau',
  title: 'Président & Fondateur, FJKM Anosivavaka',
  quote:
    "\"L'aventure, ce n'est pas seulement les destinations que nous atteignons ; c'est le voyage, les défis que nous surmontons et les liens que nous tissons en chemin.\"",
  message:
    "Ici, à FJKM Anosivavaka, notre mission est de vous inciter à sortir de votre zone de confort, à explorer le monde incroyable qui nous entoure et à vivre une vie moins ordinaire. Nous croyons que chaque excursion, grande ou petite, a le pouvoir de transformer.",
  imageUrl: DEFAULT_IMAGE,
};

type ApiPresidentPayload = {
  data?: {
    title?: string | null;
    excerpt?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    author?: {
      name?: string | null;
      title?: string | null;
    } | null;
  } | null;
};

const normalizeImageUrl = (rawImageUrl?: string | null): string => {
  const raw = rawImageUrl?.trim() ?? '';
  if (!raw) return DEFAULT_IMAGE;

  // Si l’URL est déjà complète (http/https), on ne touche pas
  if (/^https?:\/\//i.test(raw)) {
    return raw.includes('ngrok-skip-browser-warning')
      ? raw
      : `${raw}?ngrok-skip-browser-warning=1`;
  }

  // Sinon on construit l’URL absolue
  const cleaned = raw.replace(/^\/+/, '');
  const prefixed = cleaned.startsWith('storage/') ? cleaned : `storage/${cleaned}`;
  return `${API_BASE_URL}/${prefixed}?ngrok-skip-browser-warning=1`;
};

const normalizePresident = (payload: unknown): President => {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('Invalid president payload');
  }

  const { data } = payload as ApiPresidentPayload;
  if (!data) {
    throw new Error('Missing president data');
  }

  const imageUrl = normalizeImageUrl(data.imageUrl);
  const authorName = data.author?.name?.trim() || DEFAULT_PRESIDENT.name;
  const authorTitle = data.author?.title?.trim() || data.category?.trim() || DEFAULT_PRESIDENT.title;
  const quote = data.title?.trim() || DEFAULT_PRESIDENT.quote;
  const message = data.excerpt?.trim() || DEFAULT_PRESIDENT.message;

  return {
    name: authorName,
    title: authorTitle,
    quote,
    message,
    imageUrl,
  };
};

const PresidentMessage: React.FC = () => {
  const [data, setData] = useState<President | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(PRESIDENT_MESSAGE_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = normalizePresident(payload);
        setData(normalized);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load the president's message. Displaying default content.");
        setData(DEFAULT_PRESIDENT);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="order-2 lg:order-1 lg:col-span-2 text-gray-700">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Teny fanolorana
              </h2>
               <div className="mb-6 text-justify" dangerouslySetInnerHTML={{ __html: data.message }}></div>
              {/* <div>
                <p className="font-bold text-gray-800">{data.name}</p>
                <p className="text-sm text-gray-500">{data.title}</p>
              </div> */}
            </div>
            
            <div className="order-1 lg:order-2 lg:col-span-1 flex justify-center lg:justify-end">
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
