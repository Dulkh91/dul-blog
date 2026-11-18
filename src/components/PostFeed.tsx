import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGrid, TextAlignJustify } from 'lucide-react';
import SearchTitle from './SearchTitle';
import { formatPostDate, timeAgo } from './lib/date';

export interface PostFeedItem {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  createdAt: Date | string;
  author: { name: string } | null;
  category: { name: string; slug: string } | null;
}

interface Props {
  initialPosts: PostFeedItem[];
  totalPages: number;
  query: string;
  category: string;
}

interface PostsResponse {
  posts?: PostFeedItem[];
  pagination?: { page: number; totalPages: number };
}

type ViewMode = 'grid' | 'list';

function postHref(post: PostFeedItem): string {
  return post.category
    ? `/post/${encodeURIComponent(post.category.slug)}/${encodeURIComponent(post.slug)}`
    : `/post/${encodeURIComponent(post.slug)}`;
}

function GridCard({ post }: { post: PostFeedItem }) {
  return (
    <a href={postHref(post)} className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          {post.category && <span className="rounded-md border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-300">{post.category.name}</span>}
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{timeAgo(post.createdAt)}</span>
        </div>
        <h3 className="mb-3 text-lg font-bold leading-snug text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-xl">{post.title}</h3>
        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800/70">
        {post.author && <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.author.name}</span>}
        <span className="inline-flex items-center gap-1 font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white">អានបន្ត <span className="transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </a>
  );
}

function ListCard({ post }: { post: PostFeedItem }) {
  return (
    <a href={postHref(post)} className="group flex w-full min-w-0 cursor-pointer justify-between rounded-2xl border border-zinc-200/90 bg-white p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600">
      <div className="w-full">
        <h3 className="mb-3 text-base font-bold leading-snug text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-lg">{post.title}</h3>
        <div className="mb-4 flex w-full items-center justify-between gap-2">
          {post.category && <span className="rounded-md border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-300">{post.category.name}</span>}
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{formatPostDate(post.createdAt)}</span>
        </div>
      </div>
    </a>
  );
}

export default function PostFeed({ initialPosts, totalPages: initialTotalPages, query, category }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [view, setView] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem('blog-view-mode') === 'list') setView('list');
    } catch {
      // Keep the grid view when storage is unavailable.
    }
  }, []);

  const chooseView = (nextView: ViewMode) => {
    setView(nextView);
    try {
      localStorage.setItem('blog-view-mode', nextView);
    } catch {
      // The view still changes if browser storage is unavailable.
    }
  };

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current || page >= totalPages) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page: String(page + 1), limit: '10' });
      if (query) params.set('q', query);
      if (category) params.set('category', category);

      const response = await fetch(`/api/posts/posts?${params.toString()}`);
      if (!response.ok) throw new Error('មិនអាចទាញយកអត្ថបទបន្ថែមបានទេ។');
      const result = await response.json() as PostsResponse;
      setPosts((current) => [...current, ...(result.posts ?? [])]);
      setPage(result.pagination?.page ?? page + 1);
      setTotalPages(result.pagination?.totalPages ?? totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'មិនអាចទាញយកអត្ថបទបន្ថែមបានទេ។');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [category, page, query, totalPages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadNextPage();
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const hasMore = page < totalPages;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        {!category && <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">អត្ថបទថ្មីៗ</h3>}
        <div className="ml-auto flex items-center gap-2">
          <SearchTitle query={query} category={category} />
          <div className="flex items-center justify-items-end gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button type="button" onClick={() => chooseView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={`cursor-pointer rounded-md p-1.5 transition-all ${view === 'grid' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              <LayoutGrid size={16} />
            </button>
            <button type="button" onClick={() => chooseView('list')} aria-label="List view" aria-pressed={view === 'list'} className={`cursor-pointer rounded-md p-1.5 transition-all ${view === 'list' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              <TextAlignJustify size={16} />
            </button>
          </div>
        </div>
      </div>

      <section className={view === 'grid' ? 'grid w-full min-w-0 grid-cols-1 gap-4 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-3' : 'flex w-full min-w-0 flex-col gap-3 transition-all duration-300'}>
        {posts.map((post) => (
          <div key={post.id} className="w-full min-w-0">
            {view === 'grid' ? <GridCard post={post} /> : <ListCard post={post} />}
          </div>
        ))}

        {query && posts.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-zinc-500 dark:text-zinc-400" role="status">
            រកមិនឃើញអត្ថបទដែលត្រូវនឹងការស្វែងរកទេ។
          </p>
        )}

        <div ref={sentinelRef} className="col-span-full h-px" aria-hidden="true" />
        {isLoading && <p className="col-span-full py-4 text-center text-sm text-zinc-500 dark:text-zinc-400" role="status">កំពុងទាញយកអត្ថបទ...</p>}
        {error && (
          <p className="col-span-full py-4 text-center text-sm text-red-600 dark:text-red-400" role="alert">
            {error} <button type="button" onClick={() => void loadNextPage()} className="ml-2 cursor-pointer underline">ព្យាយាមម្ដងទៀត</button>
          </p>
        )}
        {hasMore && !isLoading && (
          <button type="button" onClick={() => void loadNextPage()} className="col-span-full mx-auto cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
            មើលអត្ថបទបន្ថែម
          </button>
        )}
      </section>
    </>
  );
}
