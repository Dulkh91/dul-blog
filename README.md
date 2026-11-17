




---
import Layout from '../layouts/Layout.astro';


export const prerender = false;

interface Posts{
	id: string;
	title: string;
	content: string;
	slug: string;
	author: {name: string } | null;
	category: {name: string} | null
	createdAt: Date;
	
}


interface PostResponse {
	posts?: Posts[];
	error?: string;
}

function getContentPreview(content: string) {
	return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

let posts: Posts[] = []
let error = ''
const categorySlug = Astro.url.searchParams.get('category');

 try {
	const postsUrl = new URL('/api/posts/posts', Astro.url);
	if (categorySlug) postsUrl.searchParams.set('category', categorySlug);
	const response = await fetch(postsUrl);
	const result = await response.json() as  PostResponse
	if(!response.ok) throw new Error(`Failed to fetch ${response.status}`)
  posts = result.posts ?? []
 } catch (err) {
	console.error("Faied to fetch posts:", err)
	error = err instanceof Error ? err.message: " Failded to fetch post";
 }

---



<Layout>
	{error?(
		<p role="alert" class="text-sm text-destructive">{error}</p>
	):
	(<section class=" grid grid-cols-3 gap-2">
		{posts.map(post=>
			<a 
				href={`/post/${post.slug}`}
				class="group cursor-pointer rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-card-light dark:bg-card-dark p-6 sm:p-7 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
			>
				<div>
				<!-- Top Meta Row -->

				<div class="flex items-center justify-between gap-2 mb-4">
					<span class="text-xs font-medium px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
						{post.category?.name}
					</span>
					<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500">
					{post.createdAt }
					</span>
				</div>

				<!-- Title -->
				<h3 class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
					{post.title}
				</h3>

				<!-- Excerpt -->
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-1 mb-6">
					{getContentPreview(post.content)}
				</p>
				</div>

				<!-- Footer Row -->
				<div class="pt-4 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between text-xs">
				<span class="font-medium text-zinc-700 dark:text-zinc-300">{post.author?.name}</span>
				<span class="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
					អានបន្ត <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
				</span>
				</div>
			</a>


		)}
			
	</section>)
	}
	

</Layout>



```
---
import Layout from '../layouts/Layout.astro';


export const prerender = false;

interface Posts{
	id: string;
	title: string;
	excerpt: string | null;
	slug: string;
	author: {name: string } | null;
	category: {name: string; slug: string} | null
	createdAt: Date;
	
}


interface PostResponse {
	posts?: Posts[];
	error?: string;
}

let posts: Posts[] = []
let error = ''
const categorySlug = Astro.url.searchParams.get('category');

 try {
	const postsUrl = new URL('/api/posts/posts', Astro.url);
	if (categorySlug) postsUrl.searchParams.set('category', categorySlug);
	const response = await fetch(postsUrl);
	const result = await response.json() as  PostResponse
	if(!response.ok) throw new Error(`Failed to fetch ${response.status}`)
  posts = result.posts ?? []
 } catch (err) {
	console.error("Faied to fetch posts:", err)
	error = err instanceof Error ? err.message: " Failded to fetch post";
 }

---



<Layout>
	{error?(
		<p role="alert" class="text-sm text-destructive">{error}</p>
	):
	(<section class=" grid grid-cols-3 gap-2">
		{posts.map(post=>
			<a 
				href={post.category
					? `/post/${encodeURIComponent(post.category.slug)}/${encodeURIComponent(post.slug)}`
					: `/post/${encodeURIComponent(post.slug)}`}
				class="group cursor-pointer rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-card-light dark:bg-card-dark p-6 sm:p-7 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
			>
				<div>
				<!-- Top Meta Row -->

				<div class="flex items-center justify-between gap-2 mb-4">
					{post.category && <span class="text-xs font-medium px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
						{post.category?.name}
					</span>
					}
					
					<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500">
					{post.createdAt }
					</span>
				</div>

				<!-- Title -->
				<h3 class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
					{post.title}
				</h3>

				<!-- Excerpt -->
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-1 mb-6">
					{post.excerpt}
				</p>
				</div>

				<!-- Footer Row -->
				<div class="pt-4 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between text-xs">
				{post.author && <span class="font-medium text-zinc-700 dark:text-zinc-300">{post.author?.name}</span>}
				<span class="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
					អានបន្ត <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
				</span>
				</div>
			</a>


		)}
			
	</section>)
	}
	

</Layout>




```
****

````
<Layout>
	<div class="flex justify-self-end my-2 p-2 border border-0.5 rounded-sm space-x-3">
		<button class=" bg-gray-600 p-1.5 rounded-sm text-gray-200 hover:text-gray-50"><LayoutGrid size={12}/></button>
		<button><TextAlignJustify size={12}/></button>	
	</div>
	{error?(
		<p role="alert" class="text-sm text-destructive">{error}</p>
	):
	(<section class=" grid grid-cols-3 gap-2">
		{posts.map(post=>
			<a 
				href={post.category
					? `/post/${encodeURIComponent(post.category.slug)}/${encodeURIComponent(post.slug)}`
					: `/post/${encodeURIComponent(post.slug)}`}
					data-astro-prefetch="viewport"
				class="group cursor-pointer rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-card-light dark:bg-card-dark p-6 sm:p-7 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
			>
				<div>
				<!-- Top Meta Row -->

				<div class="flex items-center justify-between gap-2 mb-4">
					{post.category && <span class="text-xs font-medium px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
						{post.category?.name}
					</span>
					}
					
					<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500">
					{post.createdAt }
					</span>
				</div>

				<!-- Title -->
				<h3 class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
					{post.title}
				</h3>

				<!-- Excerpt -->
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-1 mb-6">
					{post.excerpt}
				</p>
				</div>

				<!-- Footer Row -->
				<div class="pt-4 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between text-xs">
				{post.author && <span class="font-medium text-zinc-700 dark:text-zinc-300">{post.author?.name}</span>}
				<span class="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
					អានបន្ត <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
				</span>
				</div>
			</a>


		)}
			
	</section>)
	}
	

</Layout>
```