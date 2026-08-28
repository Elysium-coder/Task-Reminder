import { useEffect, useState } from 'react';

/**
 * Renders a date in the Bikram Sambat (Nepali) calendar.
 *
 * `nepali-date-converter` is loaded with a dynamic import inside useEffect so
 * it only ever runs on the client — keeping it out of the SSR bundle and the
 * serverless functions. Falls back to a standard locale string on any error.
 */
export default function NepaliDate({ date, locale = 'ne', fallback = true }) {
  const [formatted, setFormatted] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      setFormatted(null);
      return;
    }
    import('nepali-date-converter')
      .then((mod) => {
        if (cancelled) return;
                try {
          const NepaliDate = mod.default || mod;
          const nd = new NepaliDate(d);
          setFormatted(nd.format(locale === 'ne' ? 'YYYY-MM-DD' : 'YYYY-MM-DD (YYYY)'));
        } catch (e) {
          if (!cancelled) setFormatted(d.toLocaleDateString());
        }
      })
      .catch(() => {
        if (!cancelled) setFormatted(d.toLocaleDateString());
      });
    return () => {
      cancelled = true;
    };
  }, [date, locale]);

  if (formatted) return <>{formatted}</>;
  const d = new Date(date);
  return <>{Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()}</>;
}
