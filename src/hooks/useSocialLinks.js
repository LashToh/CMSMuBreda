import { useEffect, useState } from 'react';
import { fetchServerInfo } from '../services/api';
import { resolveSocialLinks, SOCIAL_LINKS } from '../data/socialLinks';

/** Live social URLs from AdminCP (/api/server), with static fallbacks. */
export function useSocialLinks() {
  const [links, setLinks] = useState(SOCIAL_LINKS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchServerInfo();
        if (!cancelled) setLinks(resolveSocialLinks(res.data || {}));
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}
