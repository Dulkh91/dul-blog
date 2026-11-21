import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGrid, TextAlignJustify } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import SearchTitle from './SearchTitle';
import { ListCard } from './ListCard';
import { GridCard } from './GridCard';
import type { PostFeedItem } from './types/PostFeedItem';

interface Props {
  initialPosts: PostFeedItem[];
  totalPages: number;
  query: string;
  category: string;
  tag: string;
}

interface PostsResponse {
  posts?: PostFeedItem[];
  pagination?: { page: number; totalPages: number };
}

type ViewMode = 'grid' | 'list';


export default function PostFeed({ initialPosts, totalPages: initialTotalPages, query, category, tag }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [view, setView] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeAos = () => {
      AOS.init({
        once: false,
        offset: 100,
        duration: 1000,
        easing: 'ease-out-cubic',
        mirror: true,
        anchorPlacement: 'top-bottom',
      });
    };

    document.addEventListener('astro:page-load', initializeAos);
    initializeAos();

    return () => document.removeEventListener('astro:page-load', initializeAos);
  }, []);

  useEffect(() => {
    AOS.refreshHard();
  }, [posts, view]);

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
      const params = new URLSearchParams({ page: String(page + 1), limit: '6' });
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);

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
  }, [category, page, query, tag, totalPages]);

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
          <SearchTitle query={query} category={category} tag={tag} />
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
