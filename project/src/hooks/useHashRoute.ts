import { useState, useEffect } from 'react';

export type RouteName = 'home' | 'services' | 'why-us' | 'process' | 'contact' | 'donate' | 'library' | 'updates';

export type Route = { name: RouteName };

export function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '');
  const valid: RouteName[] = ['services', 'why-us', 'process', 'contact', 'donate', 'library', 'updates'];
  if (valid.includes(hash as RouteName)) return { name: hash as RouteName };
  return { name: 'home' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(route: Route) {
  window.location.hash = route.name === 'home' ? '' : route.name;
  if (route.name === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
