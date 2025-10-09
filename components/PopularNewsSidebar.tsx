import React, { useState, useEffect } from 'react';
import type { TrendingStory } from '../types';

interface PopularNewsSidebarProps {
  onStoryClick: (id: number) => void;
}

const PopularNewsSidebar: React.FC<PopularNewsSidebarProps> = ({ onStoryClick }) => {
  const [trendingStories, setTrendingStories] = useState<TrendingStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStories = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/stories/trending');
        if (response.ok) {
          const mockTrending: TrendingStory[] = [
            { id: 1, title: "Driverless cars need to make their passengers feel like drivers", imageUrl: "https://picsum.photos/seed/car/100/100", date: "December 13, 2024", comments: 5 },
            { id: 2, title: "One of the best phones around: Sony's Xperia Z3 reviewed", imageUrl: "https://picsum.photos/seed/phone/100/100", date: "December 13, 2024", comments: 8 },
            { id: 3, title: "Indian construction major seeks $803M over scrapped airport deal", imageUrl: "https://picsum.photos/seed/plane/100/100", date: "December 13, 2024", comments: 3 },
            { id: 4, title: "Qatar Airways, the global launch customer of the new Airbus A350", imageUrl: "https://picsum.photos/seed/airbus/100/100", date: "December 13, 2024", comments: 12 },
            { id: 5, title: "US president's armored car and gum-chewing drew lots of attention", imageUrl: "https://picsum.photos/seed/armored/100/100", date: "December 13, 2024", comments: 7 },
            { id: 6, title: "Exploring the Alps on a scenic train journey", imageUrl: "https://picsum.photos/seed/train/100/100", date: "December 12, 2024", comments: 9 },
          ];
          setTrendingStories(mockTrending);
          return;
        }
        const data: TrendingStory[] = await response.json();
        setTrendingStories(data);
      } catch (err) {
        setError('Failed to load popular stories.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingStories();
  }, []);

  const content = (
     <div className="border border-gray-200 bg-white p-4 pt-0">
        <div className="text-center py-3 border-b border-gray-200 mb-4 -mx-4 px-4 bg-gray-50">
            <h3 className="font-bold text-gray-800 tracking-widest text-sm">POPULAR NEWS</h3>
        </div>
        <div className="h-[500px] overflow-hidden relative group">
                <div className="absolute top-0 animate-scroll-vertical group-hover:[animation-play-state:paused]">
                {[...trendingStories, ...trendingStories].map((story, index) => (
                    <div key={`${story.id}-${index}`} className="pb-4 mb-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start space-x-4">
                            <img src={story.imageUrl} alt={story.title} className="w-20 h-20 object-cover flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{story.date} &nbsp; {story.comments}</p>
                                <h4 className="font-semibold text-sm text-gray-800 leading-tight">
                                    <a href="#" onClick={(e) => { e.preventDefault(); onStoryClick(story.id); }} className="hover:text-blue-600">{story.title}</a>
                                </h4>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>
    </div>
  );

  return (
    <div className="sticky top-28">
      {loading && <div className="p-4 text-center bg-white border border-gray-200">Loading popular news...</div>}
      {error && <div className="p-4 text-center text-red-600 bg-white border border-gray-200">{error}</div>}
      {!loading && !error && content}
    </div>
  );
};

export default PopularNewsSidebar;