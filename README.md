### Google auth
### គំនិតសំខាន់
Google login គឺជាវិធីឱ្យ Google បញ្ជាក់ថា «អ្នកនេះជានរណា» ជំនួសឱ្យគេហទំព័ររបស់អ្នកទទួល និងរក្សាទុកពាក្យសម្ងាត់របស់អ្នកប្រើ។ ក្នុងគម្រោងនេះ កម្មវិធីទទួលព័ត៌មានប្រវត្តិរូបពី Google បន្ទាប់មកពិនិត្យថា email មានសិទ្ធិចូលឬអត់ ហើយបង្កើត session សម្រាប់ឱ្យអ្នកប្រើបន្តប្រើគេហទំព័រ។
ពាក្យសំខាន់៖
- Authentication៖ បញ្ជាក់អត្តសញ្ញាណ—អ្នកជានរណា។
- Authorization៖ ពិនិត្យសិទ្ធិ—អ្នកអាចចូលឬធ្វើអ្វីបានខ្លះ។
- Session៖ សញ្ញាសម្គាល់ថាកម្មវិធីបានផ្ទៀងផ្ទាត់អ្នករួចហើយ។
- Cookie៖ ទិន្នន័យតូចដែល browser ផ្ញើត្រឡប់ទៅ server សម្រាប់សំណើបន្ទាប់ៗ។
ដំណើរការតាមលំដាប់
<details>
<summary>Click Showmore</summary>

1. បើកទំព័រ Login

ទំព័រ login.astro ហៅ getSessionUser() មុនបង្ហាញមាតិកា៖
- បើមាន session ត្រឹមត្រូវ វាបង្ហាញថាបានចូលជា user ណា និងបង្ហាញប៊ូតុងទៅ Dashboard ឬចាកចេញ។
- បើមិនទាន់ចូល វាបង្ហាញប៊ូតុង «បន្តជាមួយ Google»។

ប៊ូតុងនេះមិនទាន់ចូល Google ដោយផ្ទាល់ទេ។ វាបញ្ជូន browser ទៅ endpoint ក្នុងគេហទំព័ររបស់យើង៖/api/auth/google/google។

2. Server រៀបចំសំណើទៅ Google

Endpoint google.ts ធ្វើការងារមួយចំនួន មុនបញ្ជូន browser ទៅ Google៖

1. អាន GOOGLE_CLIENT_ID និងពិនិត្យថា credentials ត្រូវបានកំណត់។
2. បង្កើតតម្លៃចៃដន្យ state និង verifier។
3. រក្សាទុក state, verifier និងទំព័រដែលចង់ត្រឡប់ទៅក្នុង cookies។
4. បង្កើត URL ស្នើសុំទៅ Google ហើយបញ្ជូន browser ទៅទីនោះ។

Google ទទួលប៉ារ៉ាម៉ែត្រដូចជា៖

- client_id៖ កំណត់ថា application ណាកំពុងស្នើ login។
- redirect_uri៖ អាសយដ្ឋាន callback ដែល Google ត្រូវត្រឡប់មកក្រោយ។
- scope: openid email profile៖ ស្នើអត្តសញ្ញាណ និងព័ត៌មាន email/profile មូលដ្ឋាន។
- state៖ តម្លៃសម្រាប់ពិនិត្យថាការត្រឡប់មកនេះជាការបន្តពី login ដែលយើងបានចាប់ផ្ដើម។
- code_challenge៖ ផ្នែកនៃការការពារ PKCE ដើម្បីឱ្យអ្នកទីបីមិនអាចយក authorization code ទៅប្រើបានងាយ។
- prompt: select_account៖ ស្នើឱ្យអ្នកប្រើជ្រើសរើស Google account។

Cookies សម្រាប់ដំណាក់កាលនេះផុតកំណត់ក្រោយ 10 នាទី។ វាមិនមែនជា session login ចុងក្រោយទេ—វាគ្រាន់តែជាទិន្នន័យបណ្ដោះអាសន្នសម្រាប់ដំណើរការ OAuth។

3. អ្នកប្រើចូលនៅលើ Google

Browser បង្ហាញទំព័ររបស់ Google។ អ្នកប្រើជ្រើស account និងអនុញ្ញាតសិទ្ធិដែលបានស្នើ។

ពាក្យសម្ងាត់ Google មិនត្រូវបានបញ្ជូនមកគេហទំព័រនេះទេ។ អ្នកប្រើបញ្ចូលពាក្យសម្ងាត់ជាមួយ Google ដោយផ្ទាល់។ បន្ទាប់ពីយល់ព្រម Google នឹងបញ្ជូន browser ត្រឡប់មក callback URL ជាមួយ code និង state។

4. Callback ពិនិត្យការត្រឡប់ពី Google

ក្នុង callback.ts server ពិនិត្យថា៖

- Google មិនបានត្រឡប់ error មកទេ។
មាន code និង state។
- state ដែល Google ត្រឡប់មក ត្រូវគ្នានឹងតម្លៃក្នុង cookie ដែល server បានរក្សាទុក។
- មាន verifier សម្រាប់ផ្គូផ្គងជាមួយ PKCE។

ការផ្គូផ្គង state ជួយការពារការបន្លំឱ្យ server ទទួលការឆ្លើយតប OAuth ដែលមិនមែនមកពី login ដែលអ្នកប្រើបានចាប់ផ្ដើម។ បើការពិនិត្យមិនជោគជ័យ កម្មវិធីលុប cookies បណ្ដោះអាសន្ន ហើយបញ្ជូនអ្នកប្រើត្រឡប់ទៅ login ជាមួយ error។

5. Server ដោះដូរ code ដើម្បីទទួល token

បើ callback ត្រឹមត្រូវ server ផ្ញើ code ទៅ Google ដើម្បីប្ដូរយក access token។ ការស្នើនេះប្រើ៖
```bash
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
redirect_uri
code_verifier
```
GOOGLE_CLIENT_SECRET ត្រូវនៅខាង server ប៉ុណ្ណោះ មិនគួរដាក់ក្នុងកូដ frontend ឬបញ្ជូនឱ្យ browser ទេ។ Google ពិនិត្យថា code និងព័ត៌មានសម្ងាត់ត្រឹមត្រូវ ហើយទើបផ្ដល់ token។ ក្នុងកូដនេះ បើមិនទទួលបាន access token នោះ login ត្រូវបរាជ័យ។

6. Server យក និងពិនិត្យ profile

កម្មវិធីប្រើ access token ស្នើ profile ពី Google។ វាត្រូវការយ៉ាងហោចណាស់៖
- sub៖ លេខសម្គាល់ Google account។
email៖ email។
- email_verified ត្រូវជា true។

បើ Google មិនបានបញ្ជាក់ email ឬខ្វះព័ត៌មានចាំបាច់ កម្មវិធីមិនបន្តទេ។

7. ពិនិត្យថា email មានសិទ្ធិចូលឬអត់

កម្មវិធីអាន GOOGLE_ALLOWED_EMAILS ហើយប្រៀបធៀប email ដែលបានបញ្ជាក់ជាមួយបញ្ជីនេះ។ ដូច្នេះ ការចូលដោយ Google បានជោគជ័យ មិនមានន័យថាអ្នកគ្រប់គ្នាអាចចូលគេហទំព័របានទេ—email ត្រូវមាននៅក្នុងបញ្ជីអនុញ្ញាត។

ឧទាហរណ៍៖
```
GOOGLE_ALLOWED_EMAILS=person@example.com,editor@example.com
```
បើ email មិនមានសិទ្ធិ កម្មវិធីបញ្ជូនត្រឡប់ទៅ login ហើយបង្ហាញសារ not_allowed។

8. រក្សាទុក ឬកែប្រែ user ក្នុង database

បន្ទាប់ពី email មានសិទ្ធិ កម្មវិធីប្រើ Prisma រក user តាម email៖

- បើមានរួច វាធ្វើបច្ចុប្បន្នភាពឈ្មោះបើ Google ផ្ដល់ឈ្មោះ។
- បើមិនទាន់មាន វាបង្កើត user ថ្មី។

តារាង User ស្ថិតក្នុង schema.prisma។ តាម callback បច្ចុប្បន្ន កម្មវិធីរក្សាទុក email និង name ប៉ុណ្ណោះ។ ទោះបី schema មាន fields googleId និង avatar ក៏ដោយ callback នេះមិនបានរក្សាទុក fields ទាំងនោះទេ។

9. បង្កើត session និងត្រឡប់ទៅគេហទំព័រ

មុខងារ createSession បង្កើតទិន្នន័យមាន userId និងពេលផុតកំណត់ 30 ថ្ងៃ។ វាចុះហត្ថលេខាលើទិន្នន័យនោះដោយ GOOGLE_CLIENT_SECRET ហើយរក្សាទុកក្នុង cookie ឈ្មោះ session។

Cookie ត្រូវបានកំណត់ជា៖

- HttpOnly៖ JavaScript នៅក្នុង browser មិនអាចអានតម្លៃ cookie បានដោយផ្ទាល់។
- Secure នៅ production៖ ផ្ញើតែតាម HTTPS។
- SameSite=Lax៖ ជួយកាត់បន្ថយការផ្ញើ cookie ពីសំណើ cross-site មួយចំនួន។
- ផុតកំណត់ក្រោយ 30 ថ្ងៃ។

បន្ទាប់មក callback បញ្ជូនអ្នកប្រើទៅ URL ដែលបានស្នើដំបូង ប្រសិនបើវាជា URL ក្នុងគេហទំព័រដដែល; បើមិនដូច្នោះទេ វាបញ្ជូនទៅ /dashboard។ ការត្រួតពិនិត្យនេះជួយកុំឱ្យ URL មិនទុកចិត្តបញ្ជូនអ្នកប្រើចេញទៅគេហទំព័រផ្សេង។

នៅពេល browser ស្នើទំព័របន្ទាប់ វាផ្ញើ session cookie មកវិញ។ getSessionUser() ពិនិត្យ signature និងថ្ងៃផុតកំណត់ រួចស្វែងរក user ក្នុង database។ ការធ្វើបែបនេះជួយឱ្យ server ដឹងថាអ្នកប្រើបានចូលរួច ដោយមិនចាំបាច់ឱ្យអ្នកប្រើចូល Google ម្ដងទៀតរាល់ទំព័រ។

ចំណាំ៖ ទោះ schema មានតារាង Session ក៏ដោយ flow ដែលអាននៅទីនេះមិនបង្កើត record ក្នុងតារាងនោះទេ។ វារក្សា session ជា signed cookie ដែលមាន userId និងថ្ងៃផុតកំណត់។

10. ចាកចេញ

ប៊ូតុងចាកចេញក្នុង login.astro ផ្ញើ POST ទៅ logout.ts។ Server លុប session cookie ហើយ browser ត្រឡប់ទៅ /login។ នេះលុប session របស់គេហទំព័រនេះ ប៉ុន្តែមិនចាំបាច់មានន័យថាអ្នកប្រើបាន sign out ពី Google account ទេ។

### ការកំណត់សំខាន់ៗ

ជាទូទៅត្រូវកំណត់៖

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_ALLOWED_EMAILS
- GOOGLE_REDIRECT_URI — អាចកំណត់ដោយផ្ទាល់ ឬប្រើតម្លៃលំនាំដើម 
- /api/auth/google/callback
- DATABASE_URL

អាសយដ្ឋាន redirect_uri ត្រូវតែត្រូវគ្នានឹង callback URL ដែលបានកំណត់ក្នុង Google OAuth settings។ បើខុសគ្នា login អាចបរាជ័យនៅដំណាក់កាល callback/token។

### Error ដែលអាចជួប

ទំព័រ login បង្ហាញសារតាម error ដែល callback ត្រឡប់មក៖

- not_allowed៖ email មិនមានក្នុងបញ្ជីអនុញ្ញាត។
- provider៖ Google បដិសេធ ឬអ្នកប្រើបោះបង់ការចូល។
- state៖ callback មិនមានទិន្នន័យត្រឹមត្រូវ ឬដំណើរការផុតកំណត់។
- token៖ ដោះដូរ code ជាមួយ Google មិនបាន—ពិនិត្យ credentials និង callback URL។
- profile៖ មិនអាចទាញ profile ឬ email ដែលបានបញ្ជាក់។
- database៖ រក្សាទុក user មិនបាន។
- session៖ បង្កើត session មិនបាន—ពិនិត្យ GOOGLE_CLIENT_ID និង GOOGLE_CLIENT_SECRET។

សរុបជាខ្សែដំណើរការ៖ Login page → server រៀបចំ OAuth → Google ផ្ទៀងផ្ទាត់អ្នកប្រើ → callback ពិនិត្យ code/state → server ទទួល profile → ពិនិត្យ email មានសិទ្ធិ → រក្សាទុក user → បង្កើត session cookie → ចូលប្រើទំព័រដែលត្រូវការ។

</details


## Add Feature 
ការបន្ថែម Function ផ្សេងៗទៀតនោគ្នុង Dashboard ត្រូវតែគោរពគោលការដូចខាងក្រោម៖

ត្រូវតែ import ពីរនេះទើបវាចេញ login ម្ដងទៀត

```bash
---
import DashboardLayout from './DashboardLayout.astro'
export const prerender = false
---
```
code example
```bash
---
import DashboardLayout from './DashboardLayout.astro'
export const prerender = false
---

<DashboardLayout>
    <h1>Helllo Add user</h1>
</DashboardLayout>
```



```bash
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

####  callback.ts

```bash
import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { createSession } from '../../../../lib/session';
import {
  getGoogleCredentials,
  getGoogleRedirectUri,
  getAllowedGoogleEmails,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  GOOGLE_RETURN_COOKIE,
} from '../../../../lib/oauth';

export const prerender = false;

interface GoogleTokens {
  access_token?: string;
  error?: string;
}

interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const clearOAuthCookies = () => {
    cookies.delete(GOOGLE_STATE_COOKIE, { path: '/' });
    cookies.delete(GOOGLE_VERIFIER_COOKIE, { path: '/' });
    cookies.delete(GOOGLE_RETURN_COOKIE, { path: '/' });
  };
  const fail = (reason = 'google') => {
    clearOAuthCookies();
    return Response.redirect(new URL(`/login?error=${reason}`, url), 302);
  };

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const expectedState = cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const verifier = cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;
  if (url.searchParams.has('error')) return fail('provider');
  if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) return fail('state');

  let stage = 'token';
  try {
    const { clientId, clientSecret } = getGoogleCredentials();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(url),
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    const tokens = await tokenResponse.json() as GoogleTokens;
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed.');

    stage = 'profile';
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json() as GoogleProfile;
    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error('Google did not return a verified email address.');
    }

    const allowedEmails = getAllowedGoogleEmails();
    if (!allowedEmails.length || !allowedEmails.includes(profile.email.toLowerCase())) {
      return fail('not_allowed');
    }

    stage = 'database';
    const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });
    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: { name: profile.name ?? existingUser.name },
        })
      : await prisma.user.create({
          data: { email: profile.email, name: profile.name },
        });

    stage = 'session';
    await createSession(user.id, cookies);
    const returnTo = cookies.get(GOOGLE_RETURN_COOKIE)?.value ?? '/dashboard';
    const returnUrl = new URL(returnTo, url.origin);
    clearOAuthCookies();
    return Response.redirect(returnUrl.origin === url.origin ? returnUrl : new URL('/dashboard', url), 302);
  } catch (error) {
    console.error(`Google OAuth callback failed during ${stage}:`, error);
    return fail(stage);
  }
};

```