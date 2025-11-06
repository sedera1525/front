import React, { useEffect, useMemo, useState } from 'react';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { API_BASE_URL } from '../utils/apiConfig';

const BREAKING_NEWS_ENDPOINT = `${API_BASE_URL}/api/breaking-news`;

const FALLBACK_MESSAGES = [
  "Dernière minute : Restez connectés pour les nouvelles du jour.",
  "Programme : Les événements FJKM Anosivavaka continuent toute la semaine.",
  "Info pratique : Retrouvez les derniers articles directement sur notre site."
];

type ApiBreakingNewsItem =
  | string
  | {
      id?: number | string;
      title?: string | null;
      message?: string | null;
      text?: string | null;
      headline?: string | null;
      content?: string | null;
      summary?: string | null;
    };

const normaliseBreakingNews = (payload: unknown): string[] => {
  const source = (() => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const maybeData = (payload as { data?: unknown }).data;
      if (Array.isArray(maybeData)) return maybeData;
    }
    return [];
  })();

  const messages = source
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidates = [
        item.message,
        item.text,
        item.title,
        item.headline,
        item.summary,
        item.content,
      ];

      const firstNonEmpty = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
      return firstNonEmpty?.trim() ?? null;
    })
    .filter((value): value is string => Boolean(value && value.length > 0));

  return messages.length > 0 ? messages : FALLBACK_MESSAGES;
};

const createTickerText = (messages: string[]): string => {
  if (messages.length === 0) {
    return FALLBACK_MESSAGES.join('  •  ');
  }

  const sequence = messages.join('  •  ');
  // Duplicate the sequence to make the scrolling marquee feel continuous.
  return `${sequence}  •  ${sequence}`;
};

const Ticker: React.FC = () => {
  const [messages, setMessages] = useState<string[]>(FALLBACK_MESSAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBreakingNews = async () => {
      try {
        const response = await fetch(BREAKING_NEWS_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Statut inattendu ${response.status}`);
        }

        const payload = await response.json();
        const normalisedMessages = normaliseBreakingNews(payload);
        setMessages(normalisedMessages);
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Impossible de charger le bandeau d\'actualités', error);
          setMessages(FALLBACK_MESSAGES);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBreakingNews();

    return () => controller.abort();
  }, []);

  const tickerText = useMemo(() => createTickerText(messages), [messages]);

  return (
    <div className="bg-white border-b border-t border-gray-200 w-full overflow-hidden ticker-container" aria-live="polite">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12">
          <div className="flex-shrink-0 pr-4">
            <span className="flex items-center space-x-2 text-sm font-semibold text-blue-600">
              <MegaphoneIcon />
              <span>{loading ? 'Chargement…' : 'Infos'}</span>
            </span>
          </div>
          <div className="flex-1 relative overflow-hidden h-full">
            <div className="absolute inset-0 flex items-center">
              <p className="whitespace-nowrap animate-scroll-horizontal text-gray-700 absolute">
                {tickerText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticker;
