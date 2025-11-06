import React, { Suspense, lazy, useCallback } from 'react';
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
import AccessGate from './components/AccessGate';
import AccessControlPage from './components/AccessControlPage';
import { Routes, Route, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
import type { StoryNavigationTarget } from './types';

const VideoPage = lazy(() => import('./components/VideoPage'));

type NavPage = 'home' | 'gallery' | 'videos' | 'contact';

const App: React.FC = () => {
  const navigate = useNavigate();

  const handleStoryClick = useCallback(({ id, slug }: StoryNavigationTarget) => {
    navigate(`/article/${slug}`, { state: { articleId: id } });
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleCategoryClick = useCallback((category: string) => {
    navigate(`/category/${encodeURIComponent(category)}`);
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleShowAllCategories = useCallback((category?: string) => {
    navigate('/categories');
    window.scrollTo(0, 0);
  }, [navigate]);
  
  const handleNavClick = useCallback((page: NavPage) => {
    switch (page) {
      case 'gallery':
        navigate('/gallery');
        break;
      case 'videos':
        navigate('/videos');
        break;
      case 'contact':
        navigate('/contact');
        break;
      default:
        navigate('/');
        break;
    }
    window.scrollTo(0, 0);
  }, [navigate]);

  const HomePage = () => (
    <>
      <HeroSection />
      <Ticker />
      <FeaturedStories onCategoryClick={handleCategoryClick} />
      <PresidentMessage />
      <LatestSection onStoryClick={handleStoryClick} onCategoryClick={handleShowAllCategories} />
    </>
  );

  const ArticleRoute: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const state = location.state as { articleId?: number } | null;
    const initialArticleId = state?.articleId;

    if (!slug) {
      return <Navigate to="/" replace />;
    }

    return (
      <>
        <HeroSection />
        <Ticker />
        <section className="bg-white py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <ArticleDetail slug={slug} initialArticleId={initialArticleId ?? undefined} />
              </div>
              <div className="lg:col-span-1">
                <PopularNewsSidebar onStoryClick={handleStoryClick} />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  const CategoryRoute: React.FC = () => {
    const { categoryName } = useParams<{ categoryName: string }>();
    if (!categoryName) {
      return <Navigate to="/categories" replace />;
    }
    const decodedCategory = decodeURIComponent(categoryName);
    return (
      <>
        <HeroSection />
        <Ticker />
        <CategoryPage
          category={decodedCategory}
          onStoryClick={handleStoryClick}
          onCategoryClick={handleCategoryClick}
        />
      </>
    );
  };

  const AllCategoriesRoute = () => (
    <>
      <HeroSection />
      <Ticker />
      <AllCategoriesPage onCategoryClick={handleCategoryClick} />
    </>
  );

  return (
    <AccessGate>
      <div className="bg-gray-100 min-h-screen font-sans">
        <Header onNavClick={handleNavClick} />
        <main>
          <Suspense
            fallback={
              <div className="py-20 text-center text-gray-600">
                Chargement du contenu...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/videos" element={<VideoPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/categories" element={<AllCategoriesRoute />} />
              <Route path="/category/:categoryName" element={<CategoryRoute />} />
              <Route path="/article/:slug" element={<ArticleRoute />} />
              <Route path="/access-admin" element={<AccessControlPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AccessGate>
  );
};

export default App;
