import { persistentAtom } from '@nanostores/persistent';

export type Theme = 'light' | 'dark';

export const theme = persistentAtom<Theme>('blog-theme', 'light');

export function toggleTheme() {
  theme.set(theme.get() === 'dark' ? 'light' : 'dark');
}
