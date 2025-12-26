import { useEffect } from 'react';

interface AutoSyncProps {
  slug: string;
}

const AutoSync = ({ slug }: AutoSyncProps) => {
  useEffect(() => {
    // Mark progress only when the *next* sector is viewed.
    // We do this by storing the last visited slug in sessionStorage.
    try {
      const lastSlug = sessionStorage.getItem('astro:lastSlug');

      if (lastSlug && lastSlug !== slug && lastSlug.startsWith('mission-')) {
        const storedProfile = localStorage.getItem('astro_pilot_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          profile.completedSubMissions = profile.completedSubMissions || [];

          if (!profile.completedSubMissions.includes(lastSlug)) {
            profile.completedSubMissions.push(lastSlug);
            localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
          }
        }
      }

      sessionStorage.setItem('astro:lastSlug', slug);
    } catch {
      // If sessionStorage is blocked, do nothing.
    }
  }, [slug]);

  return null; // Invisible component
};

export default AutoSync;
