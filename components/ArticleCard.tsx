import React from 'react';
import type { Story } from '../types';
import { encodeFallbacks, shiftFallback } from '../utils/mediaUrl';

interface ArticleCardProps {
  article: Story;
  onStoryClick: (id: number) => void;
  onCategoryClick: (category: string) => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/seed/fjkm-article-card/600/400';

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onStoryClick, onCategoryClick }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 group">
      <div className="flex-shrink-0">
        <button onClick={() => onStoryClick(article.id)} className="block w-full sm:w-64">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            data-fallbacks={
              article.imageFallbacks && article.imageFallbacks.length > 0
                ? encodeFallbacks(article.imageFallbacks)
                : undefined
            }
            className="rounded-lg object-cover w-full h-48 sm:h-40 shadow-md group-hover:shadow-lg transition-shadow"
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
        </button>
      </div>
      <div className="flex-1">
         <button
            onClick={() => onCategoryClick(article.category)}
            className={`text-white text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor} mb-2 inline-block hover:opacity-90 transition-opacity`}
         >
            {article.category}
        </button>
        <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2">
            <a href="#" onClick={(e) => { e.preventDefault(); onStoryClick(article.id); }} className="hover:text-blue-600 transition-colors">
                {article.title}
            </a>
        </h3>
        <div className="text-sm text-gray-500 flex items-center space-x-4">
            {article.author && <p>Par <span className="font-semibold text-gray-700">{article.author.name}</span></p>}
            {article.date && <p>{article.date}</p>}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
