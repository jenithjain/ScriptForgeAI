'use client';

import {
  Brain,
  Network,
  Clock,
  CheckSquare,
  Sparkles,
  Search,
  Film,
  HelpCircle
} from 'lucide-react';

const iconMap = {
  Brain,
  Network,
  Clock,
  CheckSquare,
  Sparkles,
  Search,
  Film,
};

export default function AgentIcon({ name, className = "w-5 h-5", color }) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} style={{ color }} />;
}

export { iconMap };
