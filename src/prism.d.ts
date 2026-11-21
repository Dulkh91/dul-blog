declare module 'prismjs' {
  const Prism: {
    languages: { markup: unknown };
    highlight(code: string, grammar: unknown, language: string): string;
  };

  export default Prism;
}

declare module 'prismjs/components/prism-markup';
