import React, { useState, useEffect } from 'react';
import type { Article } from '../types';

interface ArticleDetailProps {
  articleId: number;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ articleId }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchArticle = async () => {
      try {
        const response = await fetch(`https://91eb35f24335.ngrok-free.app/api/articles/${articleId}`);
        if (!response.ok) {
          // Mock data for demonstration
          const mockArticle: Article = {
            id: articleId,
            title: "Discovering the Hidden Gems of the Scottish Highlands",
            imageUrl: "https://picsum.photos/1200/600?image=1043",
            category: "Destination",
            categoryColor: "bg-red-500",
            author: { name: "Jane Cooper", avatarUrl: "https://picsum.photos/seed/jane/100/100" },
            date: "October 26, 2024",
            content: `
              <p>The Scottish Highlands are a rugged, mountainous region of Scotland, known for their stunning landscapes, historic castles, and rich cultural heritage. This sparsely populated area is a paradise for outdoor enthusiasts, offering everything from hiking and climbing to kayaking and wildlife watching.</p>
              <p class="my-4">Our journey began in Inverness, the cultural capital of the Highlands. From there, we ventured west, towards the iconic Loch Ness. While we didn't spot the legendary monster, the sheer beauty of the loch, surrounded by rolling hills and ancient forests, was a sight to behold. The ruins of Urquhart Castle, perched on the loch's edge, offered a glimpse into Scotland's turbulent past.</p>
              <h3 class="text-2xl font-bold my-4 text-gray-800">The Isle of Skye</h3>
              <p>No trip to the Highlands is complete without a visit to the Isle of Skye. Connected to the mainland by a bridge, Skye is famous for its dramatic landscapes, including the Old Man of Storr, the Quiraing, and the Fairy Pools. We spent two days hiking on the island, and every trail offered breathtaking views that seemed to be straight out of a fantasy novel.</p>
              <p class="my-4">The weather in the Highlands can be unpredictable, with sunshine, rain, and wind often occurring within the same day. However, this ever-changing weather only adds to the region's mystical charm, creating dramatic lighting and stunning rainbows.</p>
              <blockquote class="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-600">
                "The Highlands are not just a place, but a feeling. A sense of wildness, freedom, and timelessness that stays with you long after you've left."
              </blockquote>
              <p>Whether you're an avid hiker, a history buff, or simply someone looking to escape the hustle and bustle of city life, the Scottish Highlands offer an unforgettable adventure. It's a place where nature reigns supreme, and every corner reveals a new, breathtaking vista.</p>
            `,
          };
          setArticle(mockArticle);
          return;
        }
        const data: Article = await response.json();
        setArticle(data);
      } catch (err) {
        setError(`Failed to load article (ID: ${articleId}).`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  if (loading) return <div className="p-4 text-center bg-white rounded-lg shadow-md">Loading article...</div>;
  if (error) return <div className="p-4 text-center text-red-600 bg-white rounded-lg shadow-md">{error}</div>;
  if (!article) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-10">
      <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor} mb-4 inline-block`}>
        {article.category}
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
      <div className="flex items-center space-x-4 mb-6 border-b border-t border-gray-200 py-4">
        <img src={article.author.avatarUrl} alt={article.author.name} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-semibold text-gray-800">{article.author.name}</p>
          <p className="text-sm text-gray-500">{article.date}</p>
        </div>
      </div>
      <img src={article.imageUrl} alt={article.title} className="w-full rounded-lg shadow-lg mb-8" />
      <div className="prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: article.content }}>
      </div>
    </div>
  );
};

export default ArticleDetail;