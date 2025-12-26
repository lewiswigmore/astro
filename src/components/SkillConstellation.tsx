import { useEffect, useState } from 'react';

interface Skill {
  id: string;
  label: string;
  slug: string;
  x: string;
  y: string;
  isPatch?: boolean;
}

interface Connection {
  from: string;
  to: string;
  isPatchConnection?: boolean;
}

interface SkillConstellationProps {
  skills?: Skill[];
  connections?: Connection[];
  title?: string;
  forceCompleted?: string[];
  currentNode?: string;
}

const DEFAULT_SKILLS: Skill[] = [
  // Main Mission Nodes
  { id: 'orientation', label: 'ORIENTATION', slug: 'mission-00/introduction', x: '10%', y: '50%' },
  { id: 'fundamentals', label: 'FUNDAMENTALS', slug: 'mission-01/introduction', x: '30%', y: '30%' },
  { id: 'filtering', label: 'FILTERING', slug: 'mission-01/filtering-projecting', x: '45%', y: '50%' },
  { id: 'aggregation', label: 'AGGREGATION', slug: 'mission-02/aggregation-time', x: '60%', y: '30%' },
  { id: 'temporal', label: 'TEMPORAL', slug: 'mission-02/temporal-navigation', x: '75%', y: '55%' },
  { id: 'joins', label: 'JOINS', slug: 'mission-03/joining-tables', x: '88%', y: '40%' },
  { id: 'deep-space', label: 'DEEP SPACE', slug: 'mission-03/advanced-challenges', x: '95%', y: '75%' },

  // Patch Nodes (Children) - Angled forward with min 10% spacing
  { id: 'patch-identity', label: 'IDENTITY VERIFIED', slug: 'identity-verified', x: '20%', y: '70%', isPatch: true },
  { id: 'patch-steps', label: 'FIRST STEPS', slug: 'first-steps', x: '25%', y: '45%', isPatch: true },
  { id: 'patch-contact', label: 'FIRST CONTACT', slug: 'first-contact', x: '40%', y: '15%', isPatch: true },
  { id: 'patch-star', label: 'RISING STAR', slug: 'rising-star', x: '70%', y: '15%', isPatch: true },
  { id: 'patch-nav', label: 'COSMIC NAVIGATOR', slug: 'cosmic-navigator', x: '85%', y: '75%', isPatch: true },
];

const DEFAULT_CONNECTIONS: Connection[] = [
  // Main Path
  { from: 'orientation', to: 'fundamentals' },
  { from: 'fundamentals', to: 'filtering' },
  { from: 'filtering', to: 'aggregation' },
  { from: 'aggregation', to: 'temporal' },
  { from: 'temporal', to: 'joins' },
  { from: 'joins', to: 'deep-space' },

  // Patch Connections
  { from: 'orientation', to: 'patch-identity', isPatchConnection: true },
  { from: 'orientation', to: 'patch-steps', isPatchConnection: true },
  { from: 'fundamentals', to: 'patch-contact', isPatchConnection: true },
  { from: 'aggregation', to: 'patch-star', isPatchConnection: true },
  { from: 'temporal', to: 'patch-nav', isPatchConnection: true },
];

const SkillConstellation = ({ 
  skills = DEFAULT_SKILLS, 
  connections = DEFAULT_CONNECTIONS,
  title = "SECURITY SENTINEL",
  forceCompleted = [],
  currentNode
}: SkillConstellationProps) => {
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  useEffect(() => {
    const loadProfile = () => {
      const storedProfile = localStorage.getItem('astro_pilot_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setCompletedSlugs(profile.completedSubMissions || []);
        setEarnedBadges(profile.badges || []);
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    window.addEventListener('astro:profile-update' as any, loadProfile);
    return () => {
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener('astro:profile-update' as any, loadProfile);
    };
  }, []);

  const isCompleted = (skill: Skill) => {
    if (skill.isPatch) {
      return earnedBadges.includes(skill.slug) || forceCompleted.includes(skill.slug);
    }
    return completedSlugs.includes(skill.slug) || forceCompleted.includes(skill.slug);
  };

  return (
    <div className="relative w-full h-80 bg-space-900/50 rounded-xl border border-space-700 overflow-hidden mb-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-2xl h-full">
            {/* Constellation Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((conn, i) => {
                    const fromSkill = skills.find(s => s.id === conn.from);
                    const toSkill = skills.find(s => s.id === conn.to);
                    if (!fromSkill || !toSkill) return null;
                    
                    const active = isCompleted(toSkill);
                    return (
                        <line 
                            key={i}
                            x1={fromSkill.x} 
                            y1={fromSkill.y} 
                            x2={toSkill.x} 
                            y2={toSkill.y} 
                            stroke={active ? (toSkill.isPatch ? '#fbbf24' : '#0ea5e9') : '#334155'} 
                            strokeWidth={toSkill.isPatch ? "1" : "2"} 
                            strokeDasharray={toSkill.isPatch ? "4 2" : "0"}
                            className="transition-colors duration-1000" 
                        />
                    );
                })}
            </svg>

            {/* Stars */}
            {skills.map((skill) => {
                const active = isCompleted(skill);
                const isCurrent = currentNode === skill.slug || currentNode === skill.id;
                
                return (
                    <div 
                        key={skill.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ top: skill.y, left: skill.x }}
                    >
                        {/* Current Location Glow */}
                        {isCurrent && (
                          <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-thrust-500/20 rounded-full animate-ping"></div>
                        )}
                        
                        <div className={`rounded-full transition-all duration-500 relative z-10 ${
                            skill.isPatch
                            ? active 
                              ? 'w-2.5 h-2.5 bg-stardust shadow-[0_0_10px_rgba(251,191,36,0.6)]' 
                              : 'w-2 h-2 bg-slate-700 group-hover:bg-slate-500'
                            : isCurrent
                            ? 'w-5 h-5 bg-thrust-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] border-2 border-white'
                            : active 
                            ? 'w-4 h-4 bg-nebula-500 shadow-[0_0_15px_rgba(14,165,233,0.6)] animate-pulse' 
                            : 'w-3 h-3 bg-slate-600 group-hover:bg-slate-400'
                        }`}></div>
                        
                        <div className={`absolute top-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-mono whitespace-nowrap transition-all duration-300 ${
                            isCurrent ? 'text-thrust-400 opacity-100 font-bold' : active ? (skill.isPatch ? 'text-stardust' : 'text-nebula-400') + ' opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                        }`}>
                            {skill.label} {isCurrent && '(YOU ARE HERE)'}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-500 uppercase">
        SECTOR: {title}
      </div>
    </div>
  );
};

export default SkillConstellation;

