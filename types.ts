// Fix: Removed self-import of 'Story' which causes a conflict with its local declaration.

export interface Story {
  id: number;
  title: string;
  slug?: string;
  imageUrl: string;
  category: string;
  categoryColor: string;
  excerpt?: string;
  author?: {
    name: string;
    avatarUrl?: string;
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
}

export interface President {
  name:string;
  title: string;
  quote: string;
  message: string;
  imageUrl: string;
}

export interface Article extends Story {
  content: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  date: string;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  title: string;
  category: string;
}

export interface Category {
  name: string;
  imageUrl: string;
  description: string;
}
