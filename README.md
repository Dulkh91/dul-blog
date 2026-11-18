```
---
import Layout from '../layouts/Layout.astro';
import ViewModeBtn from '@components/ViewModeBtn.astro'
import CardGridView  from '@components/CardGridView.astro';
import CardListView  from '@components/CardListView.astro';
import Search from  '@components/SearchTitle.astro'


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
	pagination?: { page: number; limit: number; total: number; totalPages: number };
}

let posts: Posts[] = []
let error = ''
let totalPages = 1
const categorySlug = Astro.url.searchParams.get('category');

 try {
	const postsUrl = new URL('/api/posts/posts', Astro.url);
	postsUrl.searchParams.set('page', '1');
	postsUrl.searchParams.set('limit', '10');
	if (categorySlug) postsUrl.searchParams.set('category', categorySlug);
	const response = await fetch(postsUrl);
	const result = await response.json() as  PostResponse
	if(!response.ok) throw new Error(`Failed to fetch ${response.status}`)
  posts = result.posts ?? []
  totalPages = result.pagination?.totalPages ?? 1
 } catch (err) {
	console.error("Faied to fetch posts:", err)
	error = err instanceof Error ? err.message: " Failded to fetch post";
 }
 
// const selectedCategory = Astro.url.searchParams.get('category')
---



<Layout>
    <div class="mx-auto w-full md:px-4 md:py-3 ">

        
        <!-- ផ្នែក Alpine.js Wrapper គ្រប់គ្រង View Mode -->
        <div 
            x-data={`{ 
                viewMode: localStorage.getItem('blog-view-mode') || 'grid',
                searchQuery: '',
                searchDone: false,
                searching: false,
                searchTimer: null,
                searchRequestId: 0,
                category: ${JSON.stringify(categorySlug)},
                page: 1,
                totalPages: ${totalPages},
                morePosts: [],
                loadingMore: false,
                loadError: '',
                scheduleSearch() {
                    clearTimeout(this.searchTimer);
                    const hasQuery = Boolean(this.searchQuery.trim());
                    this.searchDone = hasQuery;
                    this.searching = hasQuery;
                    this.morePosts = [];
                    this.page = 1;
                    this.totalPages = hasQuery ? 1 : ${totalPages};
                    this.searchRequestId++;
                    this.searchTimer = setTimeout(() => this.searchDatabase(), 300);
                },
                async searchDatabase() {
                    const query = this.searchQuery.trim();
                    const requestId = ++this.searchRequestId;
                    this.searchDone = Boolean(query);
                    this.searching = Boolean(query);
                    this.loadError = '';
                    this.morePosts = [];
                    this.page = 1;
                    this.totalPages = query ? 1 : ${totalPages};
                    if (!query) {
                        this.searching = false;
                        return;
                    }
                    try {
                        const params = new URLSearchParams({ page: '1', limit: '10', q: query });
                        if (this.category) params.set('category', this.category);
                        const response = await fetch('/api/posts/posts?' + params.toString());
                        if (!response.ok) throw new Error('មិនអាចស្វែងរកអត្ថបទក្នុង database បានទេ។');
                        const result = await response.json();
                        if (requestId !== this.searchRequestId) return;
                        this.morePosts = result.posts || [];
                        this.totalPages = result.pagination?.totalPages ?? 1;
                        this.$nextTick(() => {
                            if (this.page < this.totalPages && this.$refs.loadMore?.getBoundingClientRect().top < window.innerHeight + 200) this.loadMore();
                        });
                    } catch (err) {
                        if (requestId === this.searchRequestId) this.loadError = err instanceof Error ? err.message : 'មិនអាចស្វែងរកអត្ថបទក្នុង database បានទេ។';
                    } finally {
                        if (requestId === this.searchRequestId) this.searching = false;
                    }
                },
                async loadMore() {
                    if (this.loadingMore || this.searching || this.page >= this.totalPages) return;
                    const searchRequestId = this.searchRequestId;
                    this.loadingMore = true;
                    this.loadError = '';
                    try {
                        const params = new URLSearchParams({ page: String(this.page + 1), limit: '10' });
                        if (this.category) params.set('category', this.category);
                        if (this.searchDone) params.set('q', this.searchQuery.trim());
                        const response = await fetch('/api/posts/posts?' + params.toString());
                        if (!response.ok) throw new Error('មិនអាចទាញយកអត្ថបទបន្ថែមបានទេ។');
                        const result = await response.json();
                        if (searchRequestId !== this.searchRequestId) return;
                        this.morePosts.push(...(result.posts || []));
                        this.page = result.pagination?.page ?? this.page + 1;
                        this.totalPages = result.pagination?.totalPages ?? this.totalPages;
                        this.$nextTick(() => {
                            if (this.page < this.totalPages && this.$refs.loadMore?.getBoundingClientRect().top < window.innerHeight + 200) this.loadMore();
                        });
                    } catch (err) {
                        if (searchRequestId === this.searchRequestId) {
                            this.loadError = err instanceof Error ? err.message : 'មិនអាចទាញយកអត្ថបទបន្ថែមបានទេ។';
                        }
                    } finally {
                        this.loadingMore = false;
                    }
                },
                setView(mode) {
                    this.viewMode = mode;
                    localStorage.setItem('blog-view-mode', mode);
                }
            }`}
        >
        <div class="flex items-center justify-between mb-6  ">
        {categorySlug == null &&  <h3 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">អត្ថបទថ្មីៗ</h3>}
           <div class=" flex ml-auto items-center gap-2">
             <Search/>
             <ViewModeBtn/>
           </div>
        </div>
            

            {error ? (
                <p role="alert" class="text-sm text-destructive">{error}</p>
            ) : (

                <section
                    x-bind:class="viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'"
                    class="w-full min-w-0 transition-all duration-300"
                    x-on:scroll.window.throttle.200ms="if (page < totalPages && !loadingMore && !searching && $refs.loadMore.getBoundingClientRect().top < window.innerHeight + 200) loadMore()"
                >
                    {posts.map(post => (
                        
                        <div
                            class="w-full min-w-0"
                            data-post-card
                            data-search-text={`${post.title} ${post.excerpt ?? ''} ${post.category?.name ?? ''} ${post.author?.name ?? ''}`.toLocaleLowerCase()}
                            x-show="!searchDone && (!searchQuery.trim() || $el.dataset.searchText.includes(searchQuery.trim().toLocaleLowerCase()))"
                        >
                            <!-- Grid View Card -->
                            <div x-show="viewMode === 'grid'" class="h-full w-full">
                                <CardGridView post={post} />
                            </div>

                            <!-- List View Card: ត្រូវមាន w-full ដើម្បីឱ្យវាអូសពេញ Container ខាងលើ -->
                            <div x-show="viewMode === 'list'" class=" h-full w-full">
                                <CardListView post={post}/>
                            </div>
                        </div>
                    ))}
                    <template x-for="post in morePosts" x-bind:key="post.id">
                        <div
                            data-post-card
                            x-bind:data-search-text="[post.title, post.excerpt || '', post.category?.name || '', post.author?.name || ''].join(' ').toLocaleLowerCase()"
                            class="w-full min-w-0"
                        >
                            <a
                                x-bind:href="post.category ? '/post/' + encodeURIComponent(post.category.slug) + '/' + encodeURIComponent(post.slug) : '/post/' + encodeURIComponent(post.slug)"
                                x-show="viewMode === 'grid'"
                                class="group flex h-full w-full flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600"
                            >
                                <div>
                                    <div class="mb-4 flex items-center justify-between gap-2">
                                        <span x-show="post.category" x-text="post.category?.name" class="rounded-md border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-300"></span>
                                        <span x-text="new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' }).format(new Date(post.createdAt))" class="font-mono text-xs text-zinc-400 dark:text-zinc-500"></span>
                                    </div>
                                    <h3 x-text="post.title" class="mb-3 text-lg font-bold leading-snug text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-xl"></h3>
                                    <p x-text="post.excerpt" class="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"></p>
                                </div>
                                <div class="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs dark:border-zinc-800/70">
                                    <span x-text="post.author?.name" class="font-medium text-zinc-700 dark:text-zinc-300"></span>
                                    <span class="inline-flex items-center gap-1 font-medium text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white">អានបន្ត <span>→</span></span>
                                </div>
                            </a>
                            <a
                                x-bind:href="post.category ? '/post/' + encodeURIComponent(post.category.slug) + '/' + encodeURIComponent(post.slug) : '/post/' + encodeURIComponent(post.slug)"
                                x-show="viewMode === 'list'"
                                class="group flex w-full min-w-0 justify-between rounded-2xl border border-zinc-200/90 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-600"
                            >
                                <div class="w-full">
                                    <h3 x-text="post.title" class="mb-3 text-base font-bold leading-snug text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-lg"></h3>
                                    <div class="mb-1 flex w-full items-center justify-between gap-2">
                                        <span x-show="post.category" x-text="post.category?.name" class="rounded-md border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-300"></span>
                                        <span x-text="new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' }).format(new Date(post.createdAt))" class="font-mono text-xs text-zinc-400 dark:text-zinc-500"></span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </template>
                    <p
                        x-show="searchDone && !searching && !morePosts.length && !loadError"
                        class="col-span-full py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                        role="status"
                    >
                        រកមិនឃើញអត្ថបទដែលត្រូវនឹងការស្វែងរកទេ។
                    </p>
                    <p x-show="searching" class="col-span-full py-6 text-center text-sm text-zinc-500 dark:text-zinc-400" role="status">កំពុងស្វែងរកក្នុង database...</p>
                    <div x-ref="loadMore" class="col-span-full flex min-h-12 items-center justify-center py-4">
                        <span x-show="loadingMore" class="text-sm text-zinc-500 dark:text-zinc-400" role="status">កំពុងទាញយកអត្ថបទ...</span>
                        <button x-show="loadError" x-on:click="searchDone ? searchDatabase() : loadMore()" type="button" class="cursor-pointer text-sm text-red-600 underline dark:text-red-400" x-text="loadError"></button>
                        <button x-show="!loadingMore && !loadError && page < totalPages" x-on:click="loadMore()" type="button" class="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">មើលអត្ថបទបន្ថែម</button>
                    </div>
                </section>
                

            )}
        </div>

    </div>
</Layout>


```