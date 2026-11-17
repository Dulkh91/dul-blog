import { useState, type FormEvent } from 'react';

export default function CreateCategory() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const categoryName = name.trim();
    if (!categoryName) {
      setError('សូមបញ្ចូលឈ្មោះ category។');
      setSuccess('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/category/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      const result = await response.json().catch(() => null);
      
      if (!response.ok) {
        throw new Error(result?.error || 'មិនអាចបង្កើត category បានទេ។');
      }

      setName('');
      setSuccess(`បានបង្កើត category "${result.name}" ដោយជោគជ័យ។`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'មិនអាចបង្កើត category បានទេ។');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="category-name" className="sr-only">ឈ្មោះ category</label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input w-full rounded-md border px-3 py-2"
            placeholder="បញ្ចូលឈ្មោះ category..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'កំពុងបង្កើត...' : 'បង្កើត Category'}
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-green-700">{success}</p>}

    </section>
  );
}
