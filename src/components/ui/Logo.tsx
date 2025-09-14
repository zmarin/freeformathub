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
      text: 'text-lg',
      square: 'w-2 h-2',
      gap: 'gap-1'
    },
    medium: {
      text: 'text-xl',
      square: 'w-3 h-3',
      gap: 'gap-1'
    },
    large: {
      text: 'text-2xl',
      square: 'w-4 h-4',
      gap: 'gap-1.5'
    }
  };

  const classes = sizeClasses[size];

  const ColorfulSquares = () => (
    <div className={`flex flex-wrap ${classes.gap} w-fit`}>
      <div className={`${classes.square} rounded-sm bg-red-500 hover:scale-110 transition-transform duration-200`} />
      <div className={`${classes.square} rounded-sm bg-orange-500 hover:scale-110 transition-transform duration-200`} />
      <div className={`${classes.square} rounded-sm bg-green-500 hover:scale-110 transition-transform duration-200`} />
      <div className={`${classes.square} rounded-sm bg-blue-500 hover:scale-110 transition-transform duration-200`} />
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={cn(
        'flex items-center justify-center p-2',
        className
      )}>
        <ColorfulSquares />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2.5',
      className
    )}>
      {/* Colorful squares symbol */}
      <ColorfulSquares />

      {/* Text */}
      {showText && (
        <div className={`font-semibold ${classes.text} tracking-tight text-gray-900 dark:text-gray-100`}>
          FreeFormatHub
        </div>
      )}
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