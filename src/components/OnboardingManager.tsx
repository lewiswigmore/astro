import { useEffect, useState } from 'react';
import OnboardingModal from './OnboardingModal';

const OnboardingManager = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('astro_kql_onboarded');
    if (!hasOnboarded) {
      // Small delay for effect
      const timer = setTimeout(() => setShowModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Award completion bonus and achievements
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      let updated = false;

      // 1. Award Stardust if not already onboarded
      const hasOnboarded = localStorage.getItem('astro_kql_onboarded');
      if (!hasOnboarded) {
        const launchBonus = localStorage.getItem('astro_onboarding_launch_bonus') === 'true';
        if (launchBonus) {
          profile.stardust = (profile.stardust || 0) + 25;
          updated = true;
        }

        try {
          localStorage.removeItem('astro_onboarding_launch_bonus');
        } catch {
          // ignore
        }
      }

      // 2. Award Badges if missing
      profile.badges = profile.badges || [];
      const newBadges = ['first-steps', 'first-contact', 'identity-verified'];
      newBadges.forEach(badge => {
        if (!profile.badges.includes(badge)) {
          profile.badges.push(badge);
          updated = true;
        }
      });

      // 3. Award Achievements if missing
      profile.achievements = profile.achievements || [];
      
      const achievementsToAward = [
        {
          id: 'orientation-complete',
          name: 'Orientation Complete',
          description: 'Successfully completed the Academy orientation.',
          icon: '🚀',
          earnedAt: new Date().toISOString(),
          category: 'special',
          rarity: 'common'
        },
        {
          id: 'neural-link-established',
          name: 'Neural Link Established',
          description: 'Synchronized your pilot profile with the Academy archives.',
          icon: '🧠',
          earnedAt: new Date().toISOString(),
          category: 'special',
          rarity: 'common'
        },
        {
          id: 'first-contact',
          name: 'First Contact',
          description: 'Initiated communication with the KQL Nebula.',
          icon: '📡',
          earnedAt: new Date().toISOString(),
          category: 'special',
          rarity: 'common'
        }
      ];

      achievementsToAward.forEach(achievement => {
        if (!profile.achievements.find((a: any) => a.id === achievement.id)) {
          profile.achievements.push(achievement);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('astro_pilot_profile', JSON.stringify(profile));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('astro:profile-update', { detail: profile }));
      }
    }

    localStorage.setItem('astro_kql_onboarded', 'true');
    setShowModal(false);
  };

  const handleOpen = () => {
    setShowModal(true);
  };

  return (
    <>
      <OnboardingModal isOpen={showModal} onClose={handleClose} />
      
      {!showModal && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-space-700 bg-space-800 px-4 py-2 font-mono text-xs font-bold text-thrust-400 shadow-lg transition-all hover:border-thrust-400 hover:bg-space-700 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          title="Replay Mission Briefing"
        >
          <span className="text-lg">🚀</span>
          <span className="hidden sm:inline">MISSION BRIEFING</span>
        </button>
      )}
    </>
  );
};

export default OnboardingManager;
