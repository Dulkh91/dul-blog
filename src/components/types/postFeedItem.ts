export interface PostFeedItem {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  createdAt: Date | string;
  author: { name: string } | null;
  category: { name: string; slug: string } | null;
}