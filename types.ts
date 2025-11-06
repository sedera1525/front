// Fix: Removed self-import of 'Story' which causes a conflict with its local declaration.

export interface Story {
  id: number;
  title: string;
  slug?: string;
  imageUrl: string;
  imageFallbacks?: string[];
  category: string;
  categoryColor: string;
  excerpt?: string;
  author?: {
    name: string;
    avatarUrl?: string;
    avatarFallbacks?: string[];
  };
  date?: string;
  readTime?: string;
}

export interface StoryNavigationTarget {
  id: number;
  slug: string;
}

export interface TrendingStory {
  id: number;
  title: string;
  slug?: string;
  imageUrl: string;
  imageFallbacks?: string[];
  date: string;
  comments: number;
  excerpt?: string;
}

export interface HeroSlide {
  id: number;
  bgImage: string;
  badges: {
    text: string;
    color: string;
  }[];
  title: string;
  excerpt: string;
  ctaText: string;
  pillTitle: string;
  ctaUrl?: string;
}

export interface President {
  name:string;
  title: string;
  quote: string;
  message: string;
  imageUrl: string;
  imageFallbacks?: string[];
}

export interface Article extends Story {
  content: string;
  author: {
    name: string;
    avatarUrl: string;
    avatarFallbacks?: string[];
  };
  date: string;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  imageFallbacks?: string[];
  title: string;
  category: string;
  caption?: string | null;
}

export interface Category {
  name: string;
  imageUrl: string;
  imageFallbacks?: string[];
  description: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  thumbnailFallbacks?: string[];
  channelName: string;
  views: number;
  publishedAt: string;
  duration?: string | null;
  tags?: string[];
  description?: string;
  videoUrl: string;
  embedUrl: string;
  streamUrl?: string | null;
  streamType?: string | null;
  platform?: 'youtube' | 'other';
}
