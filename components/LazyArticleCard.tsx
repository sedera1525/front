import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Story, StoryNavigationTarget } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import slugify from '../utils/slugify';
import { encodeFallbacks, shiftFallback } from '../utils/mediaUrl';

interface LazyArticleCardProps {
  article: Story;
  onStoryClick: (target: StoryNavigationTarget) => void;
  onCategoryClick: (category: string) => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-lazy-card/600/400';

const LazyArticleCard: React.FC<LazyArticleCardProps> = ({ article, onStoryClick, onCategoryClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -100px 0px',
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const slug = article.slug ?? slugify(`${article.title}-${article.id}`);
  const handleNavigate = () => onStoryClick({ id: article.id, slug });

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-700 ease-in-out min-h-[400px] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {isVisible && (
        <>
            <div className="relative">
                <Link to={`/article/${slug}`} onClick={handleNavigate} className="block w-full">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    data-fallbacks={
                      article.imageFallbacks && article.imageFallbacks.length > 0
                        ? encodeFallbacks(article.imageFallbacks)
                        : undefined
                    }
                    className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity"
                    onError={(event) => {
                      const nextSrc = shiftFallback(event.currentTarget);
                      if (nextSrc) {
                        event.currentTarget.src = nextSrc;
                      } else {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }
                    }}
                  />
                </Link>
                <button
                    onClick={() => onCategoryClick(article.category)}
                    className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor} hover:opacity-90 transition-opacity`}
                >
                    {article.category}
                </button>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                    <Link to={`/article/${slug}`} onClick={handleNavigate} className="hover:text-blue-600 transition-colors">
                      {article.title}
                    </Link>
                </h3>
                {article.excerpt && <p className="text-gray-600 text-sm flex-grow mb-4">{article.excerpt}</p>}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    {article.author && (
                        <p>Par <span className="font-semibold text-gray-700">{article.author.name}</span></p>
                    )}
                    {article.readTime && (
                        <div className="flex items-center space-x-1">
                        <ClockIcon />
                        <span>{article.readTime}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default LazyArticleCard;
