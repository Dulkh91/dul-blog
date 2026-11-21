
import type { PostFeedItem } from "./PostFeed";
import { postHref } from "./lib/postHref";
import { formatPostDate } from "./lib/date";


export function ListCard({ post }: { post: PostFeedItem }) {
  return (
    <a href={postHref(post)} data-aos="fade-up" className="group flex w-full min-w-0 cursor-pointer justify-between rounded-2xl border border-zinc-200/90 bg-white p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600">
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
