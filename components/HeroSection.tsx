import React, { useState, useEffect, useCallback } from 'react';
import type { HeroSlide } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

const SLIDE_INTERVAL = 7000; // 7 seconds

const HeroSection: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('https://91eb35f24335.ngrok-free.app/api/slides');
        const data: HeroSlide[] = await response.json();
        setSlides(data);
      } catch (err) {
        console.error('Failed to load slides, using mock data.', err);
        const mockSlides: HeroSlide[] = [
          { id: 1, bgImage: "url('https://picsum.photos/1600/900?image=1060')", badges: [{ text: "Editor Choice", color: "bg-yellow-400 text-black" }, { text: "Adventure Event", color: "bg-blue-500 text-white" }], title: "Announcing AdventureWeek at Okinawa", excerpt: "Join us for a week of unparalleled adventure, workshops, and exploration in the beautiful islands of Okinawa.", ctaText: "Read Story – 5 min read", pillTitle: "Okinawa Adventure" },
          { id: 2, bgImage: "url('https://picsum.photos/1600/900?image=1043')", badges: [{ text: "New Destination", color: "bg-red-500 text-white" }], title: "Exploring the Untouched Scottish Highlands", excerpt: "Discover the raw beauty, ancient castles, and mystical lochs of one of the world's last great wildernesses.", ctaText: "Discover More – 8 min read", pillTitle: "Scottish Highlands" },
          { id: 3, bgImage: "url('https://picsum.photos/1600/900?image=1057')", badges: [{ text: "Guides", color: "bg-indigo-500 text-white" }], title: "The Ultimate Guide to Rock Climbing", excerpt: "From beginner knots to advanced techniques, our comprehensive guide has everything you need to start your vertical journey.", ctaText: "Start Climbing – 6 min read", pillTitle: "Climbing Guide" },
          { id: 4, bgImage: "url('https://picsum.photos/1600/900?image=203')", badges: [{ text: "Tourism", color: "bg-green-500 text-white" }], title: "Sustainable Tourism: Travel with a Purpose", excerpt: "Learn how you can make a positive impact on the environment and local communities while you travel.", ctaText: "Learn How – 4 min read", pillTitle: "Sustainable Travel" },
          { id: 5, bgImage: "url('https://picsum.photos/1600/900?image=1075')", badges: [{ text: "Equipment", color: "bg-purple-500 text-white" }], title: "The Best Lightweight Tents for 2024", excerpt: "We've tested the top lightweight tents on the market to help you find the perfect shelter for your next backpacking trip.", ctaText: "See the Gear – 7 min read", pillTitle: "Backpacking Gear" },
        ];
        setSlides(mockSlides);
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

  if (loading) return <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center bg-gray-200"><p>Loading Slides...</p></div>;
  if (error) return <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center bg-red-100 text-red-700"><p>{error}</p></div>;
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
      <div className="relative z-20 flex flex-col h-full">
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
            <button className="bg-green-500 text-white font-semibold px-6 py-3 rounded-md flex items-center space-x-2 hover:bg-green-600 transition-colors duration-300 shadow-lg">
              <span>{activeSlide.ctaText}</span>
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-30 flex flex-col h-full pointer-events-none">
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
      </div>

       <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 z-30 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon />
      </button>
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 z-30 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRightIcon />
      </button>
    </section>
  );
};

export default HeroSection;