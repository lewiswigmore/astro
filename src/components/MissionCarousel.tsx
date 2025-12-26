import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import MissionProgressBadge from './MissionProgressBadge';
import MissionCardDecorator from './MissionCardDecorator';

interface Mission {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconColor?: string;
  gradient: string;
  totalSectors: number;
  href: string;
  buttonText: string;
  buttonColor: string;
  inDevelopment?: boolean;
}

interface MissionCarouselProps {
  missions: Mission[];
  baseUrl: string;
}

const MissionCarousel: React.FC<MissionCarouselProps> = ({ missions, baseUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextMission();
    if (isRightSwipe) prevMission();
  };

  // Auto-select the first incomplete mission on load
  useEffect(() => {
    const storedProfile = localStorage.getItem('astro_pilot_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      const completed = profile.completedMissions || [];
      setCompletedMissions(completed);
      
      const firstIncomplete = missions.findIndex(m => !completed.includes(m.id));
      if (firstIncomplete !== -1) {
        setActiveIndex(firstIncomplete);
      }
    }
  }, [missions]);

  const isMissionUnlocked = (missionId: string) => {
    // Check if mission is explicitly in development
    const mission = missions.find(m => m.id === missionId);
    if (mission?.inDevelopment) return false;

    if (missionId === 'mission-00') return true;
    const missionNum = parseInt(missionId.replace('mission-', ''));
    if (isNaN(missionNum)) return true;
    const prevMissionId = `mission-${String(missionNum - 1).padStart(2, '0')}`;
    return completedMissions.includes(prevMissionId);
  };

  const nextMission = () => {
    setActiveIndex((prev) => (prev + 1) % missions.length);
  };

  const prevMission = () => {
    setActiveIndex((prev) => (prev - 1 + missions.length) % missions.length);
  };

  return (
    <div className="relative w-full max-w-screen-2xl mx-auto px-4 pb-12">
      {/* Navigation Arrows - Hidden on mobile */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden md:block">
        <button 
          onClick={prevMission}
          className="p-4 bg-space-900/80 border border-space-700 rounded-full text-thrust-400 hover:bg-space-800 hover:border-thrust-500 transition-all shadow-lg backdrop-blur-sm"
        >
          <span className="text-2xl">←</span>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden md:block">
        <button 
          onClick={nextMission}
          className="p-4 bg-space-900/80 border border-space-700 rounded-full text-thrust-400 hover:bg-space-800 hover:border-thrust-500 transition-all shadow-lg backdrop-blur-sm"
        >
          <span className="text-2xl">→</span>
        </button>
      </div>

      {/* Carousel Container */}
      <div 
        className="relative h-[480px] md:h-[420px] flex items-center justify-center overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {missions.map((mission, index) => {
          const isActive = index === activeIndex;
          const isPrev = index === (activeIndex - 1 + missions.length) % missions.length;
          const isNext = index === (activeIndex + 1) % missions.length;
          const isUnlocked = isMissionUnlocked(mission.id);
          
          let positionClasses = "opacity-0 scale-75 pointer-events-none z-0";
          if (isActive) positionClasses = "opacity-100 scale-100 z-10 translate-x-0";
          
          // Desktop 3D effect
          if (isPrev) positionClasses = "opacity-0 md:opacity-40 scale-75 -translate-x-[85%] z-0 cursor-pointer hidden md:block";
          if (isNext) positionClasses = "opacity-0 md:opacity-40 scale-75 translate-x-[85%] z-0 cursor-pointer hidden md:block";
          
          // Mobile transition (simple fade/slide)
          if (!isActive && !isPrev && !isNext) positionClasses = "opacity-0 scale-90 pointer-events-none";

          return (
            <div 
              key={mission.id}
              onClick={() => !isActive && setActiveIndex(index)}
              className={`absolute transition-all duration-500 ease-out w-full max-w-[90%] md:max-w-lg ${positionClasses}`}
            >
              <div className={`block group relative ${!isActive || !isUnlocked ? 'pointer-events-none' : ''}`}>
                <MissionCardDecorator targetId={`carousel-${mission.id}`} missionId={mission.id} totalSectors={mission.totalSectors} />
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${isUnlocked ? mission.gradient : 'from-slate-800 to-slate-900'} rounded-xl ${isUnlocked ? 'opacity-75 group-hover:opacity-100' : 'opacity-50'} blur transition duration-200`}></div>
                <div className={`relative h-full bg-space-900 border ${isUnlocked ? 'border-space-700' : 'border-space-800'} rounded-xl p-6 md:p-8 ${isUnlocked ? 'hover:bg-space-800' : 'opacity-80'} transition-colors shadow-2xl`}>
                  {isUnlocked && (
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                      <MissionProgressBadge missionId={mission.id} totalSectors={mission.totalSectors} />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4 md:mb-6">
                    <div className={`p-2 md:p-3 bg-space-800 border ${isUnlocked ? 'border-space-700 group-hover:border-thrust-400' : 'border-space-800'} rounded-xl mr-4 md:mr-5 transition-colors`}>
                      {isUnlocked ? (
                        <Icon name={mission.icon as any} className={`w-6 h-6 md:w-8 md:h-8 ${mission.iconColor || 'text-white'}`} />
                      ) : (
                        <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-slate-600">
                          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{mission.title}</h2>
                      <span className={`text-[9px] md:text-[10px] font-mono tracking-[0.3em] uppercase ${isUnlocked ? mission.buttonColor : 'text-slate-600'}`}>
                        {mission.inDevelopment ? 'IN DEVELOPMENT' : isUnlocked ? mission.subtitle : 'LOCKED'}
                      </span>
                    </div>
                  </div>

                  <p className={`mb-6 md:mb-8 leading-relaxed text-sm md:text-base ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    {mission.inDevelopment 
                      ? 'Our engineers are currently calibrating these training modules. Check back soon for deployment.' 
                      : isUnlocked 
                        ? mission.description 
                        : 'Complete the previous mission to unlock these classified training modules.'}
                  </p>

                  {isUnlocked ? (
                    <a 
                      href={mission.href}
                      className={`flex items-center ${mission.buttonColor} font-mono font-bold text-[10px] md:text-xs tracking-widest pointer-events-auto`}
                    >
                      [ {mission.buttonText} ]
                      <span className="ml-3 group-hover:translate-x-2 transition-transform">→</span>
                    </a>
                  ) : (
                    <div className="flex items-center text-slate-700 font-mono font-bold text-[10px] md:text-xs tracking-widest">
                      [ {mission.inDevelopment ? 'OFFLINE' : 'ACCESS DENIED'} ]
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicators */}
      <div className="flex justify-center space-x-3 mt-8">
        {missions.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 transition-all duration-300 rounded-full ${
              index === activeIndex ? 'w-8 bg-thrust-500' : 'w-2 bg-space-700 hover:bg-space-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionCarousel;
