import { useEffect, useRef, useState, type FormEvent } from 'react';
import TiptapEditor from './TiptapEditor';

interface FormData {
  title: string;
  content: string;
  published: boolean;
  categoryId: string;
  tagIds: string[];
}

interface SaveResult {
  id: string;
}

interface InitialPost extends Omit<FormData, 'categoryId' | 'tagIds'> {
  categoryId?: string | null;
  tagIds?: string[];
}

interface Tag {
  id: string;
  name: string;
  slug?: string;
}

interface Category {
  id: string;
  name: string;
  tags: Tag[];
}

const emptyForm: FormData = { title: '', content: '', published: false, categoryId: '', tagIds: [] };

function createSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

function hasText(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

function hasDraftData(data: FormData) {
  return Boolean(data.title.trim() || hasText(data.content));
}

export default function FormPost({
  postId,
  initialPost,
  initialLoadError = '',
}: {
  postId?: string;
  initialPost?: InitialPost;
  initialLoadError?: string;
}) {
  const [formData, setFormData] = useState<FormData>(
    initialPost
      ? { ...initialPost, categoryId: initialPost.categoryId ?? '', tagIds: initialPost.tagIds ?? [] }
      : emptyForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState(initialLoadError);
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [tagError, setTagError] = useState('');

  const draftIdRef = useRef<string | null>(postId ?? null);
  const currentDataRef = useRef(formData);
  const dirtyRef = useRef(false);
  const savePromiseRef = useRef<Promise<SaveResult> | null>(null);
  currentDataRef.current = formData;
  const selectedCategory = categories.find((category) => category.id === formData.categoryId);
  const availableTags = formData.categoryId
    ? tags.filter((tag) => selectedCategory?.tags.some((subcategory) => subcategory.id === tag.id) || formData.tagIds.includes(tag.id))
    : tags;

  useEffect(() => {
    void fetch('/api/category/category')
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? 'មិនអាចទាញយក category បានទេ។');
        setCategories(result.categories ?? []);
      })
      .catch((loadError: unknown) => {
        setCategoryError(loadError instanceof Error ? loadError.message : 'មិនអាចទាញយក category បានទេ។');
      });
  }, []);

  useEffect(() => {
    void fetch('/api/tag/tag')
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? 'មិនអាចទាញយក tag បានទេ។');
        setTags(result.tags ?? []);
      })
      .catch((loadError: unknown) => {
        setTagError(loadError instanceof Error ? loadError.message : 'មិនអាចទាញយក tag បានទេ។');
      });
  }, []);

  const persist = async (data: FormData, published: boolean, keepalive = false) => {
    const previousSave = savePromiseRef.current;
    const request = (async (): Promise<SaveResult> => {
      await previousSave?.catch(() => undefined);

      const id = draftIdRef.current ?? crypto.randomUUID();
      draftIdRef.current = id;
      const title = data.title.trim();
      const slug = createSlug(title) || `draft-${id}`;
      const response = await fetch('/api/posts/posts', {
        method: postId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({
          id,
          title,
          slug,
          content: data.content,
          categoryId: data.categoryId || undefined,
          tagIds: data.tagIds,
          published,
        }),
        keepalive,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = result?.error;
        const message = typeof apiError === 'string'
          ? apiError
          : Array.isArray(apiError)
            ? apiError.join(' ')
            : 'មិនអាចរក្សាទុកអត្ថបទបានទេ។';
        throw new Error(message);
      }

      return result as SaveResult;
    })();

    savePromiseRef.current = request;
    try {
      return await request;
    } finally {
      if (savePromiseRef.current === request) savePromiseRef.current = null;
    }
  };

  useEffect(() => {
    if (isSubmitting || !isDirty || !hasDraftData(formData)) return;

    const timer = window.setTimeout(() => {
      setSaveStatus('កំពុងរក្សាទុក Draft…');
      void persist(formData, formData.published)
        .then(() => {
          if (currentDataRef.current === formData) {
            dirtyRef.current = false;
            setIsDirty(false);
            setSaveStatus(formData.published? 'បានរក្សាទុកការកែប្រែ' : 'បានរក្សាទុកជា Draft');
          }
        })
        .catch((saveError: unknown) => {
          setSaveStatus('រក្សាទុក Draft មិនបាន');
          setError(saveError instanceof Error ? saveError.message : 'រក្សាទុក Draft មិនបានទេ។');
        });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [formData, isDirty, isSubmitting]);

  useEffect(() => {
    const saveOnExit = () => {
      const data = currentDataRef.current;
      if (dirtyRef.current && hasDraftData(data)) void persist(data, data.published, true).catch(() => undefined);
    };

    window.addEventListener('pagehide', saveOnExit);
    return () => window.removeEventListener('pagehide', saveOnExit);
  }, []);

  const updateForm = (updates: Partial<FormData>) => {
    dirtyRef.current = true;
    setIsDirty(true);
    setFormData((current) => ({ ...current, ...updates }));
    setSaveStatus('មានការកែប្រែមិនទាន់រក្សាទុក');
    setError('');
    setSuccess('');
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    setIsCreatingTag(true);
    setTagError('');
    try {
      const response = await fetch('/api/tag/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...(formData.categoryId ? { categoryId: formData.categoryId } : {}) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'មិនអាចបង្កើត tag បានទេ។');

      setTags((current) => current.some((tag) => tag.id === result.id) ? current : [...current, result]);
      if (formData.categoryId) {
        setCategories((current) => current.map((category) => category.id === formData.categoryId && !category.tags.some((tag) => tag.id === result.id)
          ? { ...category, tags: [...category.tags, result] }
          : category));
      }
      updateForm({ tagIds: [...formData.tagIds, result.id] });
      setNewTagName('');
    } catch (createError) {
      setTagError(createError instanceof Error ? createError.message : 'មិនអាចបង្កើត tag បានទេ។');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formData.title.trim();
    if (!title || !hasText(formData.content)) {
      setError('សូមបញ្ចូលចំណងជើង និងខ្លឹមសារអត្ថបទ មុនពេលផ្សាយ។');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus('');
    setError('');
    setSuccess('');
    

    try {
      await savePromiseRef.current?.catch(() => undefined);
      const published = postId ? formData.published : true;
      await persist({ ...formData, title }, published);
      dirtyRef.current = false;
      setIsDirty(false);
      if (postId) {
        setFormData((current) => ({ ...current, published }));
        setSuccess(published ? 'បានធ្វើបច្ចុប្បន្នភាពអត្ថបទដែលបានផ្សាយ។' : 'បានធ្វើបច្ចុប្បន្នភាព Draft។');
       
      } else {
        draftIdRef.current = null;
        setFormData(emptyForm);
        setEditorVersion((version) => version + 1);
        setSuccess('បានផ្សាយអត្ថបទដោយជោគជ័យ។');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'មិនអាចផ្សាយអត្ថបទបានទេ។');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid h-full max-h-full grid-cols-6">
      <div className="col-span-5">
        <label htmlFor="post-title" className="sr-only">ចំណងជើងអត្ថបទ</label>
        <input
          id="post-title"
          type="text"
          value={formData.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          placeholder="សរសេរចំណងជើងអត្ថបទ"
          className="w-full rounded-lg border bg-background px-3 py-2.5"
          required
        />

        <TiptapEditor
          key={editorVersion}
          content={formData.content}
          onChange={(content) => updateForm({ content })}
        />
      </div>

      <aside className="col-span-1 space-y-3 pl-4">
        <div className="space-y-1">
          <label htmlFor="post-category" className="text-sm font-medium">Category</label>
          <select
            id="post-category"
            value={formData.categoryId}
            onChange={(event) => {
              const categoryId = event.target.value;
              const nextCategory = categories.find((category) => category.id === categoryId);
              const subcategoryIds = new Set(nextCategory?.tags.map((tag) => tag.id) ?? []);
              updateForm({
                categoryId,
                ...(categoryId ? { tagIds: formData.tagIds.filter((id) => subcategoryIds.has(id)) } : {}),
              });
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">គ្មាន Category</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {categoryError && <p role="alert" className="text-xs text-destructive">{categoryError}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Tags (ជ្រើសបានច្រើន)</p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
            {availableTags.length ? availableTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.tagIds.includes(tag.id)}
                  onChange={(event) => updateForm({
                    tagIds: event.target.checked
                      ? [...new Set([...formData.tagIds, tag.id])]
                      : formData.tagIds.filter((id) => id !== tag.id),
                  })}
                />
                {tag.name}
              </label>
            )) : <p className="text-xs text-muted-foreground">មិនទាន់មាន tag ទេ។</p>}
          </div>

          <div className="flex gap-2">
            <input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="បង្កើត tag ថ្មី"
              className="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={createTag}
              disabled={isCreatingTag || !newTagName.trim()}
              className="rounded-md border px-2 py-1.5 text-sm disabled:opacity-50"
            >
              {isCreatingTag ? '…' : 'បន្ថែម'}
            </button>
          </div>
          {tagError && <p role="alert" className="text-xs text-destructive">{tagError}</p>}
        </div>

        {saveStatus && <p role="status" className="text-sm text-muted-foreground">{saveStatus}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="text-sm text-green-700">{success}</p>}

        <button
          type="submit"
          disabled={isSubmitting || Boolean(postId && initialLoadError)}
          className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? postId ? 'កំពុង Update…' : 'កំពុងផ្សាយ…'
            : postId ? 'Update' : 'បង្កើតអត្ថបទ និងផ្សាយ'}
        </button>

        <p className="text-xs text-muted-foreground">
          {postId
            ? 'ការកែប្រែរក្សាទុកស្វ័យប្រវត្តិ។ ចុច Update ដើម្បីរក្សាទុកការកែប្រែ។'
            : 'សេចក្ដីព្រាងរក្សាទុកស្វ័យប្រវត្តិ។ ចុចប៊ូតុងនេះដើម្បីផ្សាយជាសាធារណៈ។'}
        </p>

      </aside>
    </form>
  );
}
