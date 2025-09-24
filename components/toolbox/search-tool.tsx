'use client';

import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CheckCircleFillIcon, GlobeIcon } from '../icons';

const config = {
  id: 'search',
  name: 'Web Search',
  description: 'Search the web for current and news',
  icon: (
    <span className="flex h-4 w-4 items-center justify-center">
      <GlobeIcon size={16} />
    </span>
  ),
  requiresOAuth: false
};

export interface SearchToolProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SearchToolDropdownItem({
  isEnabled,
  onToggle
}: SearchToolProps) {
  const handleToggle = () => {
    onToggle(!isEnabled);
  };

  return (
    <DropdownMenuItem
      className="flex cursor-pointer items-center justify-between p-3"
      onClick={handleToggle}
    >
      <div className="flex flex-1 items-center gap-3">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.name}</span>
            <Badge variant="outline" className="text-xs">
              Built-in
            </Badge>
          </div>
          <p className="truncate text-muted-foreground text-xs">
            {config.description}
          </p>
        </div>
      </div>

      {isEnabled && (
        <span className="flex h-4 w-4 items-center justify-center text-green-500">
          <CheckCircleFillIcon size={16} />
        </span>
      )}
    </DropdownMenuItem>
  );
}
