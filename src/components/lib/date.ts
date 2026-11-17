import { format, formatDistanceToNow } from 'date-fns';
import { km, enUS } from 'date-fns/locale';

type Locale = 'km' | 'en';

const locales = { km, enUS };

export function formatDate(
  date: Date | string | number,
  formatStr: string = 'dd MMMM yyyy',
  locale: Locale = 'km'
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { 
    locale: locales[locale === 'en' ? 'enUS' : 'km'] 
  });
}

export function timeAgo(
  date: Date | string | number,
  locale: Locale = 'km'
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, {
    locale: locales[locale === 'en' ? 'enUS' : 'km'],
    addSuffix: true,
  });
}

// Format ពិសេសសម្រាប់ blog
export function formatPostDate(date: Date | string | number) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  // បើមិនដល់ ៧ ថ្ងៃ បង្ហាញ "៣ ថ្ងៃមុន"
  if (diffInDays < 7) {
    return timeAgo(d);
  }
  
  // បើឆ្នាំដូចគ្នា បង្ហាញ "១៧ វិច្ឆិកា"
  if (d.getFullYear() === now.getFullYear()) {
    return format(d, 'dd MMMM', { locale: km });
  }
  
  // បើឆ្នាំផ្សេង បង្ហាញ "១៧ វិច្ឆិកា ២០២៣"
  return format(d, 'dd MMMM yyyy', { locale: km });
}

export function formatShortDateTime(date: Date | string | number) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM,yy HH:mm', { locale: km });
}