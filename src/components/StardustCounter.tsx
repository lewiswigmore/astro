import { useEffect, useState, useRef } from 'react';
import Icon from './Icon';

interface StardustCounterProps {
  className?: string;
  iconSize?: string;
  showLabel?: boolean;
}

const StardustCounter = ({ className = "", iconSize = "w-4 h-4", showLabel = true }: StardustCounterProps) => {
  const [stardust, setStardust] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const prevStardustRef = useRef(0);

  const loadStardust = () => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      const newValue = profile.stardust || 0;
      
      if (newValue > prevStardustRef.current && isLoaded) {
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 400);
      }
      
      setStardust(newValue);
      prevStardustRef.current = newValue;
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadStardust();
    window.addEventListener('storage', loadStardust);
    window.addEventListener('astro:profile-update' as any, loadStardust);
    return () => {
      window.removeEventListener('storage', loadStardust);
      window.removeEventListener('astro:profile-update' as any, loadStardust);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} data-tour="stardust-counter">
        {showLabel && <span className="text-slate-600 mr-1 hidden sm:inline">STARDUST:</span>}
        <div className="w-16 h-6 bg-space-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`} data-tour="stardust-counter">
      {showLabel && <span className="text-slate-600 mr-1 hidden sm:inline">STARDUST:</span>}
      <div className={`flex items-center space-x-1.5 px-2 py-0.5 bg-stardust/10 border border-stardust/30 rounded transition-all ${isPopping ? 'animate-pop border-stardust shadow-[0_0_10px_rgba(251,191,36,0.4)]' : ''}`}>
        <Icon name="stardust" className={`${iconSize} text-stardust`} />
        <span className="font-bold text-stardust font-mono">{stardust}</span>
      </div>
    </div>
  );
};

export default StardustCounter;
