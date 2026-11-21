interface PostFeedItem {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  createdAt: Date | string;
  author: { name: string } | null;
  category: { name: string; slug: string } | null;
}


export function postHref(post: PostFeedItem): string {
  return post.category
    ? `/post/${encodeURIComponent(post.category.slug)}/${encodeURIComponent(post.slug)}`
    : `/post/${encodeURIComponent(post.slug)}`;
}
