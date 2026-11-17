import { useState, type MouseEvent } from 'react';

export default function ButtonDelete({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm('តើអ្នកប្រាកដថាចង់លុបអត្ថបទនេះមែនទេ?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/posts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? 'មិនអាចលុបអត្ថបទបានទេ។');
      }

      window.location.assign('/dashboard');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'មិនអាចលុបអត្ថបទបានទេ។');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting ? 'កំពុងលុប…' : 'លុប'}
      </button>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
