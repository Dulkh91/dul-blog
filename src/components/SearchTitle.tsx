import { useRef, useState } from 'react';

interface Props {
  query: string;
  category: string;
}

export default function SearchTitle({ query, category }: Props) {
  const [open, setOpen] = useState(Boolean(query));
  const [value, setValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const closeSearch = () => {
    setValue('');
    setOpen(false);
    if (query) {
      if (inputRef.current) inputRef.current.value = '';
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      method="get"
      action="/"
      role="search"
      className="flex h-[38px] items-center justify-end rounded-lg border border-zinc-200 bg-zinc-100/80 text-zinc-500 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      onSubmit={() => setOpen(true)}
    >
      {category && <input type="hidden" name="category" value={category} />}

      <button
        type="button"
        aria-label="បិទការស្វែងរក"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        disabled={!open}
        onClick={() => closeSearch()}
        className={`inline-flex h-9 shrink-0 items-center justify-center overflow-hidden text-zinc-500 transition-all duration-200 dark:text-zinc-400 ${open ? 'w-[34px] opacity-100' : 'w-0 opacity-0'}`}
      >
        <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeSearch();
          }
        }}
        placeholder="ស្វែងរក..."
        aria-label="ស្វែងរកអត្ថបទ"
        tabIndex={open ? 0 : -1}
        className={`h-[34px] min-w-0 border-0 bg-transparent text-inherit outline-none transition-all duration-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 ${open ? 'w-[clamp(110px,24vw,240px)] px-2 opacity-100' : 'w-0 px-0 opacity-0'}`}
      />

      <button
        type="submit"
        aria-label={open ? 'ស្វែងរក' : 'បើកការស្វែងរក'}
        aria-expanded={open}
        onClick={(event) => {
          if (!open) {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }
        }}
        className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-3 text-inherit"
      >
        <svg aria-hidden="true" className="h-5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
        </svg>
        {!open && <span className="hidden text-xs sm:inline sm:text-sm">ស្វែងរក...</span>}
        {!open && <kbd className="hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 md:inline-block">⌘K</kbd>}
      </button>
    </form>
  );
}
