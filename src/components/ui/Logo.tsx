import { cn } from '../../lib/utils/index';

interface LogoProps {
  variant?: 'horizontal' | 'icon-only';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

export default function Logo({
  variant = 'horizontal',
  size = 'medium',
  className,
  showText = true
}: LogoProps) {
  const sizeClasses = {
    small: {
      container: 'h-8',
      hub: 'w-6 h-6',
      text: 'text-lg',
      brackets: 'text-xl',
      centerNode: 'w-2 h-2',
      connection: 'w-0.5 h-3',
      outerNode: 'w-1 h-1'
    },
    medium: {
      container: 'h-12',
      hub: 'w-8 h-8',
      text: 'text-xl',
      brackets: 'text-2xl',
      centerNode: 'w-3 h-3',
      connection: 'w-0.5 h-4',
      outerNode: 'w-1.5 h-1.5'
    },
    large: {
      container: 'h-16',
      hub: 'w-12 h-12',
      text: 'text-2xl',
      brackets: 'text-3xl',
      centerNode: 'w-4 h-4',
      connection: 'w-0.5 h-6',
      outerNode: 'w-2 h-2'
    }
  };

  const classes = sizeClasses[size];

  const HubSymbol = () => (
    <div className={`relative ${classes.hub}`}>
      {/* Connections */}
      {[0, 60, 120, 180, 240, 300].map((rotation, index) => (
        <div
          key={index}
          className={`absolute bg-white ${classes.connection} top-1/2 left-1/2 transform-gpu`}
          style={{
            transformOrigin: 'bottom',
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`
          }}
        />
      ))}

      {/* Outer nodes */}
      {[
        { top: '-2px', left: '50%', transform: 'translateX(-50%)' },
        { top: '25%', right: '-2px' },
        { bottom: '25%', right: '-2px' },
        { bottom: '-2px', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '25%', left: '-2px' },
        { top: '25%', left: '-2px' }
      ].map((position, index) => (
        <div
          key={index}
          className={`absolute bg-white rounded-full ${classes.outerNode}`}
          style={position}
        />
      ))}

      {/* Center node */}
      <div
        className={`absolute bg-white rounded-full ${classes.centerNode} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg`}
        style={{ boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}
      />
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={cn(
        'bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center',
        classes.container,
        'aspect-square',
        className
      )}>
        <HubSymbol />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl',
      classes.container,
      className
    )}>
      {/* Left bracket */}
      <div className={`text-white font-bold ${classes.brackets} opacity-90`}>
        {'{'}
      </div>

      {/* Hub symbol */}
      <HubSymbol />

      {/* Text */}
      {showText && (
        <div className={`text-white font-semibold ${classes.text} tracking-tight`}>
          <span className="text-green-300">Free</span>FormatHub
        </div>
      )}

      {/* Right bracket */}
      <div className={`text-white font-bold ${classes.brackets} opacity-90`}>
        {'}'}
      </div>
    </div>
  );
}

// Simplified version for use as a link
export function LogoLink({
  href = '/',
  variant = 'horizontal',
  size = 'medium',
  className
}: LogoProps & { href?: string }) {
  return (
    <a
      href={href}
      className={cn(
        'inline-block hover:opacity-90 transition-opacity',
        className
      )}
    >
      <Logo variant={variant} size={size} />
    </a>
  );
}