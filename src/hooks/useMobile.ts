import { useEffect, useState } from 'react';

export function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 850px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 850px)');
    const change = () => setMobile(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return mobile;
}
