import React from 'react';
import {
  FileText,
  RefreshCw,
  Lock,
  Type,
  Shield,
  Code,
  Palette,
  Clock,
  Calculator,
  Globe,
  HelpCircle
} from 'lucide-react';

// Icon mapping for tool categories
const iconMap = {
  FileText,
  RefreshCw,
  Lock,
  Type,
  Shield,
  Code,
  Palette,
  Clock,
  Calculator,
  Globe,
} as const;

export interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', size = 24 }) => {
  const IconComponent = iconMap[name as keyof typeof iconMap] || HelpCircle;
  
  return (
    <IconComponent 
      className={className} 
      size={size}
    />
  );
};

export default Icon;
