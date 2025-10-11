import React from 'react';
import { Link } from 'react-router-dom';
import type { Story, StoryNavigationTarget } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import slugify from '../utils/slugify';

interface StoryCardProps {
  story: Story;
  onStoryClick: (target: StoryNavigationTarget) => void;
  onCategoryClick: (category: string) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onStoryClick, onCategoryClick }) => {
  const slug = story.slug ?? slugify(`${story.title}-${story.id}`);
  const handleNavigate = () => onStoryClick({ id: story.id, slug });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative">
        <Link to={`/article/${slug}`} onClick={handleNavigate} className="block w-full">
          <img 
            src={story.imageUrl} 
            alt={story.title}
            className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity"
          />
        </Link>
        <button 
          onClick={() => onCategoryClick(story.category)}
          className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${story.categoryColor} hover:opacity-90 transition-opacity`}
        >
          {story.category}
        </button>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
          <Link to={`/article/${slug}`} onClick={handleNavigate} className="hover:text-blue-600 transition-colors">
            {story.title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm flex-grow">{story.excerpt}</p>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
           {story.author && (
            <p>By <span className="font-semibold text-gray-700">{story.author.name}</span></p>
           )}
           {story.readTime && (
            <div className="flex items-center space-x-1">
              <ClockIcon />
              <span>{story.readTime}</span>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
