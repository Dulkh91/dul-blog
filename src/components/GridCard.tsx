import type { PostFeedItem } from "./PostFeed";
import { postHref } from "./lib/postHref";
import { timeAgo } from "./lib/date";

export function GridCard({ post }: { post: PostFeedItem }) {
  return (
    <a href={postHref(post)} data-aos="fade-up" className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600">
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