import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturedStories from './components/FeaturedStories';
import LatestSection from './components/LatestSection';
import PresidentMessage from './components/PresidentMessage';
import Footer from './components/Footer';
import ArticleDetail from './components/ArticleDetail';
import PopularNewsSidebar from './components/PopularNewsSidebar';
import CategoryPage from './components/CategoryPage';
import GalleryPage from './components/GalleryPage';
import ContactPage from './components/ContactPage';
import AllCategoriesPage from './components/AllCategoriesPage';
import Ticker from './components/Ticker';

type NavPage = 'home' | 'gallery' | 'contact';
type Page = NavPage | 'article' | 'category' | 'all-categories';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleStoryClick = useCallback((id: number) => {
    setActiveArticleId(id);
    setCurrentPage('article');
    window.scrollTo(0, 0);
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
    setActiveCategory(category);
    setCurrentPage('category');
    window.scrollTo(0, 0);
  }, []);
  
  const handleNavClick = useCallback((page: NavPage) => {
    setCurrentPage(page);
    setActiveArticleId(null);
    setActiveCategory(null);
    window.scrollTo(0, 0);
  }, []);

  const renderContent = () => {
    // Standalone pages
    if (currentPage === 'gallery') return <GalleryPage />;
    if (currentPage === 'contact') return <ContactPage />;
    
    if (currentPage === 'category' && activeCategory) {
        return (
            <>
                <HeroSection />
                <Ticker text="LATEST: A new adventure awaits in the Amazon rainforest... | DISCOVER: Top 5 destinations for summer 2025 revealed... | GEAR UP: Check out our latest reviews on ultralight tents..." />
                <CategoryPage category={activeCategory} onStoryClick={handleStoryClick} onCategoryClick={handleCategoryClick} />
            </>
        );
    }

    // Pages with shared layout (Hero, etc.)
    return (
      <>
        <HeroSection />
        <Ticker text="LATEST: A new adventure awaits in the Amazon rainforest... | DISCOVER: Top 5 destinations for summer 2025 revealed... | GEAR UP: Check out our latest reviews on ultralight tents..." />
        {currentPage === 'all-categories' ? (
          <AllCategoriesPage onCategoryClick={handleCategoryClick} />
        ) : (
          <>
            <FeaturedStories onCategoryClick={handleCategoryClick} />
            {currentPage === 'article' && activeArticleId ? (
              <section className="bg-white py-16 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                      <ArticleDetail articleId={activeArticleId} />
                    </div>
                    <div className="lg:col-span-1">
                      <PopularNewsSidebar onStoryClick={handleStoryClick} />
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <PresidentMessage />
                <LatestSection onStoryClick={handleStoryClick} onCategoryClick={handleCategoryClick} />
              </>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header onNavClick={handleNavClick} />
      <main>
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;