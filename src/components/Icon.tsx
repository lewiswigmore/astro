// Direct imports
import { AzureDataExplorerClusters as AzureDataExplorerClustersAnalytics } from '@threeveloper/azure-react-icons/dist/components/analytics/10145-icon-service-Azure-Data-Explorer-Clusters';
import { LogAnalyticsWorkspaces as LogAnalyticsWorkspacesAnalytics } from '@threeveloper/azure-react-icons/dist/components/analytics/00009-icon-service-Log-Analytics-Workspaces';
import { Monitor as MonitorMonitor } from '@threeveloper/azure-react-icons/dist/components/monitor/00001-icon-service-Monitor';
import { AzureSQL } from '@threeveloper/azure-react-icons/dist/components/databases/02390-icon-service-Azure-SQL';
import { VirtualMachine } from '@threeveloper/azure-react-icons/dist/components/compute/10021-icon-service-Virtual-Machine';
import { StorageAccounts } from '@threeveloper/azure-react-icons/dist/components/storage/10086-icon-service-Storage-Accounts';

const AstroIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
    <defs>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor:'#cbd5e1', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#f1f5f9', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="noseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor:'#0891b2', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#0e7490', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="flameGrad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" style={{stopColor:'#fbbf24', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#f59e0b', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#dc2626', stopOpacity:0.8}} />
      </linearGradient>
      <radialGradient id="windowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{stopColor:'#a78bfa', stopOpacity:1}} />
        <stop offset="70%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#6d28d9', stopOpacity:1}} />
      </radialGradient>
      <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#a78bfa', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#7c3aed', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="leftFinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor:'#64748b', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="rightFinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#64748b', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="frontFinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#cbd5e1', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#94a3b8', stopOpacity:1}} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0B0C15" stroke="url(#circleGrad)" strokeWidth="5"/>
    <path d="M50 15 Q62 20 62 35 H38 Q38 20 50 15 Z" fill="url(#noseGrad)"/>
    <line x1="38" y1="35" x2="62" y2="35" stroke="#64748b" strokeWidth="1.5"/>
    <rect x="38" y="35" width="24" height="38" fill="url(#bodyGrad)"/>
    <rect x="43" y="35" width="2" height="38" fill="#ffffff" opacity="0.25"/>
    <path d="M38 60L28 70L38 68Z" fill="url(#leftFinGrad)"/>
    <path d="M62 60L72 70L62 68Z" fill="url(#rightFinGrad)"/>
    <rect x="49" y="60" width="2" height="10" fill="url(#frontFinGrad)"/>
    <line x1="38" y1="73" x2="62" y2="73" stroke="#64748b" strokeWidth="1.5"/>
    <circle cx="50" cy="48" r="7.5" fill="#6d28d9" opacity="0.5"/>
    <circle cx="50" cy="48" r="6.5" fill="#1e1b4b"/>
    <circle cx="50" cy="48" r="5.5" fill="url(#windowGrad)"/>
    <circle cx="48" cy="46" r="2" fill="#ffffff" opacity="0.6"/>
    <path d="M38 73L32 85L38 80L44 88L50 78L56 88L62 80L68 85L62 73Z" fill="url(#flameGrad)"/>
  </svg>
);

const StardustIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

// Map of icon names to components
const iconMap: Record<string, any> = {
  'astro': AstroIcon,
  'stardust': StardustIcon,
  'search': SearchIcon,
  'kusto': AzureDataExplorerClustersAnalytics,
  'analytics': LogAnalyticsWorkspacesAnalytics,
  'monitor': MonitorMonitor,
  'sql': AzureSQL,
  'vm': VirtualMachine,
  'storage': StorageAccounts,
  // Add more as needed
};

interface IconProps {
  name: string;
  className?: string;
}

const Icon = ({ name, className }: IconProps) => {
  const resolvedName = name.toLowerCase();
  const IconComponent = iconMap[resolvedName] || AzureDataExplorerClustersAnalytics; // Default to Kusto
  
  return (
    <div className={`${className} flex items-center justify-center`}>
      {resolvedName === 'astro' ? (
        <IconComponent className="w-full h-full" />
      ) : (
        <IconComponent 
          className="w-full h-full" 
          viewBox="0 0 18 18"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </div>
  );
};

export default Icon;
