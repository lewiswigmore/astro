import { useEffect, useState } from 'react';
import Icon from './Icon';
import KnowledgeSyncCard from './KnowledgeSyncCard';

interface ResourceGridProps {
  totalSectors: number;
  baseUrl: string;
}

const ResourceGrid = ({ totalSectors, baseUrl }: ResourceGridProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="grid md:grid-cols-2 gap-6 animate-pulse">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-space-900 border border-space-700 rounded-xl" />)}
  </div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Mission 00: Flight Manuals */}
      <KnowledgeSyncCard 
        missionId="mission-00"
        title="Flight Manuals"
        subtitle="ACCESS GRANTED"
        description="Initialize your neural link. Decrypt the history of the Archives and master the interface of the Holodeck."
        icon="astro"
        color="thrust-400"
        totalSectors={5}
        baseUrl={baseUrl}
      />

      {/* Mission 01: Star Charts */}
      <KnowledgeSyncCard 
        missionId="mission-01"
        title="The Star Charts"
        subtitle="ENCRYPTED"
        description="The foundation of sight. Learn to filter the noise of the cosmos and project only the truths you seek."
        icon="analytics"
        color="nebula-400"
        totalSectors={6}
        baseUrl={baseUrl}
      />

      {/* Mission 02: Black Box */}
      <KnowledgeSyncCard 
        missionId="mission-02"
        title="The Black Box"
        subtitle="OFFLINE"
        description="Master the flow of time and the patterns of the stars. Scan frequencies for hidden threats across the temporal rift."
        icon="monitor"
        color="purple-400"
        totalSectors={4}
        baseUrl={baseUrl}
      />

      {/* Mission 03: Holographic Archives */}
      <KnowledgeSyncCard 
        missionId="mission-03"
        title="Holographic Archives"
        subtitle="NO SIGNAL"
        description="The final synchronization. Bridge disparate data streams and command complex variables to reveal the ultimate truth."
        icon="storage"
        color="red-400"
        totalSectors={5}
        baseUrl={baseUrl}
      />
    </div>
  );
};

export default ResourceGrid;
