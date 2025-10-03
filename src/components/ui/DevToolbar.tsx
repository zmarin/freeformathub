import { type ReactNode } from 'react';

interface ToolbarButtonProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  title?: string;
  shortcut?: string;
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  variant = 'ghost',
  title,
  shortcut,
}: ToolbarButtonProps) {
  const className = `dev-toolbar__button dev-toolbar__button--${variant}${
    active ? ' dev-toolbar__button--active' : ''
  }${disabled ? ' dev-toolbar__button--disabled' : ''}`;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
    >
      {icon && <span className="dev-toolbar__button-icon">{icon}</span>}
      <span className="dev-toolbar__button-label">{label}</span>
      {shortcut && <kbd className="dev-toolbar__shortcut">{shortcut}</kbd>}
    </button>
  );
}

interface ToolbarSelectProps {
  value: string;
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
  onChange: (value: string) => void;
  label?: string;
}

function ToolbarSelect({ value, options, onChange, label }: ToolbarSelectProps) {
  return (
    <div className="dev-toolbar__select-wrapper">
      {label && <label className="dev-toolbar__label">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dev-toolbar__select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToolbarToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

function ToolbarToggle({ checked, onChange, label, disabled = false }: ToolbarToggleProps) {
  return (
    <label className="dev-toolbar__toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="dev-toolbar__toggle-input"
      />
      <span className="dev-toolbar__toggle-slider"></span>
      <span className="dev-toolbar__toggle-label">{label}</span>
    </label>
  );
}

interface ToolbarDividerProps {
  vertical?: boolean;
}

function ToolbarDivider({ vertical = true }: ToolbarDividerProps) {
  return <div className={`dev-toolbar__divider${vertical ? ' dev-toolbar__divider--vertical' : ''}`} />;
}

interface ToolbarGroupProps {
  children: ReactNode;
  label?: string;
}

function ToolbarGroup({ children, label }: ToolbarGroupProps) {
  return (
    <div className="dev-toolbar__group">
      {label && <span className="dev-toolbar__group-label">{label}</span>}
      <div className="dev-toolbar__group-content">{children}</div>
    </div>
  );
}

interface DevToolbarProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function DevToolbar({ children, className = '', sticky = false }: DevToolbarProps) {
  return (
    <div className={`dev-toolbar${sticky ? ' dev-toolbar--sticky' : ''} ${className}`}>
      {children}
    </div>
  );
}

DevToolbar.Button = ToolbarButton;
DevToolbar.Select = ToolbarSelect;
DevToolbar.Toggle = ToolbarToggle;
DevToolbar.Divider = ToolbarDivider;
DevToolbar.Group = ToolbarGroup;
