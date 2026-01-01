import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GradientHeaderProps {
  module: 'sales' | 'procurement' | 'inventory' | 'finance' | 'hr' | 'projects' | 'manufacturing';
  title: string;
  description: string;
  icon: LucideIcon;
  size?: "default" | "small";
}

const MODULE_GRADIENTS = {
  sales: 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500',
  procurement: 'bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500',
  inventory: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500',
  finance: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
  hr: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
  projects: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
  manufacturing: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
};

export function GradientHeader({ module, title, description, icon: Icon, size = "default" }: GradientHeaderProps) {
  const gradientClass = MODULE_GRADIENTS[module];
  const isSmall = size === "small";

  return (
    <div className={`relative ${gradientClass} rounded-2xl ${isSmall ? "p-4" : "p-8"} mb-6 overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-20">
        <Icon size={isSmall ? 120 : 200} className="transform rotate-12" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {!isSmall && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Icon size={24} className="text-white" />
            </div>
          )}
          <span className="text-white/90 text-sm font-medium uppercase tracking-wider">
            {module} Module
          </span>
        </div>
        <h1 className={`text-white ${isSmall ? "text-2xl" : "text-4xl"} font-bold mb-2`}>{title}</h1>
        <p className={`text-white/90 ${isSmall ? "text-sm" : "text-lg"}`}>{description}</p>
      </div>

      {/* Glassmorphic effect */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
    </div>
  );
}

export default GradientHeader;
