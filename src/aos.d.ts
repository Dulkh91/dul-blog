declare module 'aos' {
  interface AOSOptions {
    once?: boolean;
    offset?: number;
    duration?: number;
    easing?: string;
    mirror?: boolean;
    anchorPlacement?: string;
  }

  const AOS: {
    init(options?: AOSOptions): void;
    refreshHard(): void;
  };

  export default AOS;
}
