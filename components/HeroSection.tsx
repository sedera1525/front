import React, { useState, useEffect, useCallback } from 'react';
import type { HeroSlide } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { API_BASE_URL } from '../utils/apiConfig';
import { normalizeMediaValue } from '../utils/mediaUrl';

const SLIDE_INTERVAL = 7000; // 7 seconds
const DEFAULT_BG_IMAGE = 'https://picsum.photos/1600/900?image=1060';
const DEFAULT_SLIDES: HeroSlide[] = [
  // { id: 1, bgImage: "url('https://picsum.photos/1600/900?image=1060')", badges: [{ text: 'Editor Choice', color: 'bg-yellow-400 text-black' }, { text: 'FJKM Anosivavaka Event', color: 'bg-blue-500 text-white' }], title: 'Announcing FJKM AnosivavakaWeek at Okinawa', excerpt: 'Join us for a week of unparalleled FJKM Anosivavaka, workshops, and exploration in the beautiful islands of Okinawa.', ctaText: 'Read Story – 5 min read', pillTitle: 'Okinawa FJKM Anosivavaka' },
  // { id: 2, bgImage: "url('https://picsum.photos/1600/900?image=1043')", badges: [{ text: 'New Destination', color: 'bg-red-500 text-white' }], title: 'Exploring the Untouched Scottish Highlands', excerpt: "Discover the raw beauty, ancient castles, and mystical lochs of one of the world's last great wildernesses.", ctaText: 'Discover More – 8 min read', pillTitle: 'Scottish Highlands' },
  // { id: 3, bgImage: "url('https://picsum.photos/1600/900?image=1057')", badges: [{ text: 'Guides', color: 'bg-indigo-500 text-white' }], title: 'The Ultimate Guide to Rock Climbing', excerpt: 'From beginner knots to advanced techniques, our comprehensive guide has everything you need to start your vertical journey.', ctaText: 'Start Climbing – 6 min read', pillTitle: 'Climbing Guide' },
  // { id: 4, bgImage: "url('https://picsum.photos/1600/900?image=203')", badges: [{ text: 'Tourism', color: 'bg-green-500 text-white' }], title: 'Sustainable Tourism: Travel with a Purpose', excerpt: 'Learn how you can make a positive impact on the environment and local communities while you travel.', ctaText: 'Learn How – 4 min read', pillTitle: 'Sustainable Travel' },
  // { id: 5, bgImage: "url('https://picsum.photos/1600/900?image=1075')", badges: [{ text: 'Equipment', color: 'bg-purple-500 text-white' }], title: 'The Best Lightweight Tents for 2024', excerpt: "We've tested the top lightweight tents on the market to help you find the perfect shelter for your next backpacking trip.", ctaText: 'See the Gear – 7 min read', pillTitle: 'Backpacking Gear' },
];

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

const mapSlides = (payload: unknown): HeroSlide[] => {
  const mapSlideEntry = (value: unknown, index: number): HeroSlide | null => {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const slide = value as {
      id?: number;
      bgImage?: unknown;
      imageUrl?: unknown;
      image?: unknown;
      cover?: unknown;
      banner?: unknown;
      mediaUrl?: unknown;
      media?: { url?: unknown; path?: unknown; src?: unknown } | null;
      badges?: unknown;
      badgeText?: unknown;
      title?: unknown;
      headline?: unknown;
      name?: unknown;
      label?: unknown;
      caption?: unknown;
      keyword?: unknown;
      excerpt?: unknown;
      description?: unknown;
      summary?: unknown;
      content?: unknown;
      body?: unknown;
      ctaText?: unknown;
      ctaLabel?: unknown;
      callToAction?: unknown;
      buttonText?: unknown;
      pillTitle?: unknown;
      pill?: unknown;
      topic?: unknown;
      category?: unknown;
      section?: unknown;
      ctaUrl?: unknown;
      url?: unknown;
      href?: unknown;
      link?: unknown;
      buttonLink?: unknown;
    };

    const rawImage = pickNonEmptyString(
      slide.bgImage,
      slide.imageUrl,
      slide.image,
      slide.cover,
      slide.banner,
      slide.mediaUrl,
      slide.media?.url,
      slide.media?.path,
      slide.media?.src,
    );

    const { primary } = normalizeMediaValue(rawImage ?? '', {
      fallback: DEFAULT_BG_IMAGE,
      relativePrefixes: ['storage/', 'public/', 'images/'],
    });

    const backgroundImage = primary.startsWith('url(') ? primary : `url('${primary}')`;

    const badgeFallbackText = pickNonEmptyString(
      slide.category,
      slide.keyword,
      slide.topic,
      slide.section,
      slide.pillTitle,
    );

    const resolvedBadges: HeroSlide['badges'] = [];

    if (Array.isArray(slide.badges)) {
      slide.badges.forEach((badge, badgeIndex) => {
        if (!badge) return;
        if (typeof badge === 'string') {
          const text = pickNonEmptyString(badge);
          if (text) {
            resolvedBadges.push({
              text,
              color: 'bg-blue-500 text-white',
            });
          }
          return;
        }
        if (typeof badge === 'object') {
          const badgeObj = badge as {
            text?: unknown;
            label?: unknown;
            title?: unknown;
            color?: unknown;
            className?: unknown;
          };
          const text =
            pickNonEmptyString(badgeObj.text, badgeObj.label, badgeObj.title) ??
            `Étiquette ${badgeIndex + 1}`;
          const color =
            pickNonEmptyString(badgeObj.color, badgeObj.className) ??
            'bg-blue-500 text-white';
          resolvedBadges.push({ text, color });
        }
      });
    } else if (typeof slide.badges === 'string') {
      const text = pickNonEmptyString(slide.badges);
      if (text) {
        resolvedBadges.push({ text, color: 'bg-blue-500 text-white' });
      }
    }

    if (resolvedBadges.length === 0 && badgeFallbackText) {
      resolvedBadges.push({
        text: badgeFallbackText,
        color: 'bg-blue-500 text-white',
      });
    } else if (resolvedBadges.length === 0) {
      resolvedBadges.push({
        text: 'À la une',
        color: 'bg-blue-500 text-white',
      });
    }

    const resolvedTitle =
      pickNonEmptyString(
        slide.title,
        slide.headline,
        slide.name,
        slide.label,
        slide.caption,
        slide.keyword,
      ) ?? `Titre ${index + 1}`;
    const resolvedExcerpt =
      pickNonEmptyString(slide.excerpt, slide.description, slide.summary, slide.content, slide.body) ??
      '';
    const resolvedCta =
      pickNonEmptyString(slide.ctaText, slide.ctaLabel, slide.callToAction, slide.buttonText) ??
      'Lire la suite';
    const resolvedPill =
      pickNonEmptyString(
        slide.pillTitle,
        slide.pill,
        slide.topic,
        slide.category,
        slide.keyword,
        resolvedTitle,
      ) ?? resolvedTitle;
    const resolvedCtaUrl = pickNonEmptyString(
      slide.ctaUrl,
      slide.buttonLink,
      slide.href,
      slide.link,
      slide.url,
    );

    return {
      id: typeof slide.id === 'number' ? slide.id : index,
      bgImage: backgroundImage,
      badges: resolvedBadges,
      title: resolvedTitle,
      excerpt: resolvedExcerpt,
      ctaText: resolvedCta,
      pillTitle: resolvedPill,
      ctaUrl: resolvedCtaUrl,
    };
  };

  const results: HeroSlide[] = [];
  const pushSlide = (value: unknown, index: number) => {
    const mapped = mapSlideEntry(value, index);
    if (mapped) {
      results.push(mapped);
    }
  };

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => pushSlide(item, index));
    return results;
  }

  if (payload && typeof payload === 'object') {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      let runningIndex = 0;
      maybeData.forEach((entry) => {
        if (entry && typeof entry === 'object' && Array.isArray((entry as { items?: unknown[] }).items)) {
          const group = entry as {
            items?: unknown[];
            category?: unknown;
            name?: unknown;
            keyword?: unknown;
            title?: unknown;
            label?: unknown;
          };
          const defaultCategory = pickNonEmptyString(
            group.category,
            group.name,
            group.keyword,
            group.title,
            group.label,
          );

          (group.items ?? []).forEach((item) => {
            if (item && typeof item === 'object') {
              const candidate = { ...(item as Record<string, unknown>) };
              if (!('category' in candidate) || !candidate.category) {
                candidate.category = defaultCategory;
              }
              pushSlide(candidate, runningIndex++);
            }
          });
        } else {
          pushSlide(entry, runningIndex++);
        }
      });
      return results;
    }
  }

  throw new Error('Réponse de diapositives invalide');
};

const HeroSection: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/slides`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (!response.ok) {
          throw new Error(`Statut inattendu ${response.status}`);
        }
        const payload = await response.json();
        const mapped = mapSlides(payload);
        if (mapped.length === 0) {
          setSlides(DEFAULT_SLIDES);
        } else {
          setSlides(mapped);
        }
      } catch (err) {
        console.error('Impossible de charger les diapositives, utilisation des données de secours.', err);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const changeSlide = useCallback((newIndex: number) => {
      setActiveIndex(newIndex);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex(prevIndex => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex(prevIndex => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 0) {
        const timer = setInterval(handleNext, SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }
  }, [handleNext, slides.length]);

  const handleCta = useCallback(() => {
    const current = slides[activeIndex];
    if (current?.ctaUrl) {
      window.open(current.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  }, [slides, activeIndex]);

  if (loading) return <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center bg-gray-200"><p>Chargement des diapositives...</p></div>;
  if (slides.length === 0) return null;

  const activeSlide = slides[activeIndex];

  return (
    <section className="relative h-[80vh] min-h-[500px] text-white overflow-hidden bg-black">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 h-full w-full bg-cover bg-center transition-opacity duration-1000 ease-in-out ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: slide.bgImage }}
          aria-hidden={activeIndex !== index}
        />
      ))}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Slide Content */}
      {/* <div className="relative z-20 flex flex-col h-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-start justify-center text-left max-w-4xl">
          <div key={activeIndex} className="animate-fade-up">
            <div className="flex items-center space-x-3 mb-4">
              {activeSlide.badges.map(badge => (
                <span key={badge.text} className={`text-xs font-bold px-3 py-1 rounded-full text-shadow ${badge.color}`}>
                  {badge.text}
                </span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4 text-shadow-md">
              {activeSlide.title}
            </h1>
            <p className="max-w-xl text-lg text-gray-200 mb-8 text-shadow-md">
              {activeSlide.excerpt}
            </p>
            <button
              className="bg-green-500 text-white font-semibold px-6 py-3 rounded-md flex items-center space-x-2 hover:bg-green-600 transition-colors duration-300 shadow-lg"
              onClick={handleCta}
            >
              <span>{activeSlide.ctaText}</span>
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div> */}

      {/* Navigation */}
      {/* <div className="relative z-30 flex flex-col h-full pointer-events-none">
        <div className="flex-grow"></div>
        <div className="bg-black/30 backdrop-blur-sm pointer-events-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => changeSlide(index)}
                  className={`text-sm font-medium transition-all duration-300 py-2 rounded-md ${
                    activeIndex === index ? 'bg-white/30 text-white' : 'text-gray-300 hover:bg-white/10'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {slide.pillTitle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div> */}

       <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 z-30 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        aria-label="Diapositive précédente"
      >
        <ChevronLeftIcon />
      </button>
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 z-30 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        aria-label="Diapositive suivante"
      >
        <ChevronRightIcon />
      </button>
    </section>
  );
};

export default HeroSection;
