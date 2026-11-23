import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY >= 400);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="ត្រឡប់ទៅលើ"
      title="ត្រឡប់ទៅលើ"
      className="backtop-responsive fixed bottom-10 z-50 flex size-12 items-center justify-center rounded-full border-0 bg-[#1677ff] text-white shadow-lg transition-colors hover:bg-[#4096ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1677ff]"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}


