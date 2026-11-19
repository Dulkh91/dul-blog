import { useState, type FormEvent } from 'react';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  tags: Tag[];
  createdAt: string;
}

interface Props {
  initialCategories: Category[];
}

async function send<T>(url: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? 'សកម្មភាពនេះមិនបានជោគជ័យទេ។');
  return result as T;
}

function parseSubcategories(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export default function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState('');
  const [newSubcategories, setNewSubcategories] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySubcategories, setCategorySubcategories] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [newTagNames, setNewTagNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const category = await send<Category>('/api/category/category', 'POST', {
        name: newName.trim(),
        subcategories: parseSubcategories(newSubcategories),
      });
      setCategories((items) => [...items, category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewSubcategories('');
      setNotice(`បានបង្កើត category "${category.name}" រួចរាល់។`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'មិនអាចបង្កើត category បានទេ។');
    } finally {
      setBusy(false);
    }
  };

  const startEditingCategory = (category: Category) => {
    setEditingCategory(category.id);
    setCategoryName(category.name);
    setCategorySubcategories(category.tags.map((tag) => tag.name).join(', '));
    setEditingTag(null);
    setError('');
    setNotice('');
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await send<Category>('/api/category/category', 'PUT', {
        id,
        name: categoryName.trim(),
        subcategories: parseSubcategories(categorySubcategories),
      });
      setCategories((items) => items.map((item) => item.id === id ? updated : item).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingCategory(null);
      setNotice(`បានកែ category "${updated.name}" រួចរាល់។`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'មិនអាចកែ category បានទេ។');
    } finally {
      setBusy(false);
    }
  };

  const addTag = async (category: Category) => {
    const name = (newTagNames[category.id] ?? '').trim();
    if (!name) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const tag = await send<Tag>('/api/tag/tag', 'POST', { name, categoryId: category.id });
      setCategories((items) => items.map((item) => item.id === category.id
        ? { ...item, tags: [...item.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) }
        : item));
      setNewTagNames((items) => ({ ...items, [category.id]: '' }));
      setNotice(`បានបន្ថែម tag "${tag.name}" ទៅ ${category.name}។`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'មិនអាចបន្ថែម tag បានទេ។');
    } finally {
      setBusy(false);
    }
  };

  const saveTag = async (categoryId: string, id: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await send<Tag>('/api/tag/tag', 'PUT', { id, name: tagName.trim() });
      setCategories((items) => items.map((category) => ({
        ...category,
        tags: category.tags.map((tag) => tag.id === id ? updated : tag).sort((a, b) => a.name.localeCompare(b.name)),
      })));
      setEditingTag(null);
      setNotice(`បានកែ tag "${updated.name}" រួចរាល់។`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'មិនអាចកែ tag បានទេ។');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <form onSubmit={createCategory} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">បង្កើត category</h2>
        <label className="block space-y-1 text-sm">
          <span>ឈ្មោះ category</span>
          <input value={newName} onChange={(event) => setNewName(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="បញ្ចូលឈ្មោះ category..." required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Subcategory (បំបែកដោយក្បៀស)</span>
          <input value={newSubcategories} onChange={(event) => setNewSubcategories(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="ព័ត៌មាន, បច្ចេកវិទ្យា, ការអប់រំ" />
        </label>
        <button type="submit" disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50">បង្កើត Category</button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700 dark:text-green-400">{notice}</p>}

      {categories.length ? (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category.id} className="space-y-3 rounded-lg border p-4">
              {editingCategory === category.id ? (
                <form onSubmit={(event) => saveCategory(event, category.id)} className="space-y-3">
                  <label className="block space-y-1 text-sm">
                    <span>ឈ្មោះ category</span>
                    <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" required />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span>Subcategory tags (បំបែកដោយក្បៀស)</span>
                    <input value={categorySubcategories} onChange={(event) => setCategorySubcategories(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">រក្សាទុក</button>
                    <button type="button" onClick={() => setEditingCategory(null)} className="rounded-md border px-3 py-1.5 text-sm">បោះបង់</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">{category.name}</h2>
                  <button type="button" onClick={() => startEditingCategory(category)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">កែ category</button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm">
                    {editingTag === tag.id ? (
                      <>
                        <input autoFocus value={tagName} onChange={(event) => setTagName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void saveTag(category.id, tag.id); } }} className="w-32 rounded border bg-background px-1.5 py-0.5 text-sm" aria-label="ឈ្មោះ tag" />
                        <button type="button" disabled={busy} onClick={() => void saveTag(category.id, tag.id)} className="text-xs text-blue-700 disabled:opacity-50">រក្សាទុក</button>
                        <button type="button" onClick={() => setEditingTag(null)} className="text-xs text-muted-foreground">បោះបង់</button>
                      </>
                    ) : (
                      <>
                        {tag.name}
                        <button type="button" onClick={() => { setEditingTag(tag.id); setTagName(tag.name); }} className="ml-1 text-xs text-muted-foreground hover:text-foreground" aria-label={`កែ tag ${tag.name}`}>កែ</button>
                      </>
                    )}
                  </span>
                ))}
                {!category.tags.length && <span className="text-sm text-muted-foreground">មិនទាន់មាន subcategory</span>}
              </div>

              <div className="flex gap-2">
                <input
                  value={newTagNames[category.id] ?? ''}
                  onChange={(event) => setNewTagNames((items) => ({ ...items, [category.id]: event.target.value }))}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addTag(category); } }}
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="បន្ថែម tag/subcategory..."
                  aria-label={`បន្ថែម tag ទៅ ${category.name}`}
                />
                <button type="button" disabled={busy} onClick={() => void addTag(category)} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">បន្ថែម Tag</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">មិនទាន់មាន category ទេ។</p>
      )}
    </section>
  );
}
