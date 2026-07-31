import { useContext, useState, useEffect, useRef } from "react";

import { LayoutContext, LayoutTokens } from "theme/BuildTheme";

export const useLayout = (): LayoutTokens => useContext(LayoutContext);

export function useIsMobile(): boolean {
  const { mobileBreakpoint } = useLayout();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < mobileBreakpoint);
    fn();
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [mobileBreakpoint]);

  return mobile;
}

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}