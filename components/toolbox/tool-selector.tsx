'use client';

import { GoogleToolDropdownItem } from '@/components/toolbox/gmail-tool';
import { SearchToolDropdownItem } from '@/components/toolbox/search-tool';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { PlusIcon } from '../icons';

interface ToolSelectorProps {
  enabledTools: string[];
  onEnabledToolsChange: (tools: string[]) => void;
}

export function ToolSelector({
  enabledTools,
  onEnabledToolsChange
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const enabledCount = enabledTools.length;
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 gap-1 px-2"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <PlusIcon size={16} />
          </span>
          {enabledCount > 0 && (
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {enabledCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <div className="flex items-center justify-between p-3">
          <div>
            <h4 className="font-medium text-sm">Tools</h4>
            <p className="text-muted-foreground text-xs">
              Enable additional capabilities
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          <SearchToolDropdownItem
            isEnabled={enabledTools.includes('search')}
            onToggle={(enabled) => {
              const newTools = enabled
                ? [...enabledTools, 'search']
                : enabledTools.filter((id) => id !== 'search');
              onEnabledToolsChange(newTools);
            }}
          />
          <GoogleToolDropdownItem
            isEnabled={enabledTools.includes('gmail')}
            onToggle={(enabled) => {
              const newTools = enabled
                ? [...enabledTools, 'gmail']
                : enabledTools.filter((id) => id !== 'gmail');
              onEnabledToolsChange(newTools);
            }}
          />
        </div>

        {enabledCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <p className="text-muted-foreground text-xs">
                {enabledCount} tool{enabledCount !== 1 ? 's' : ''} enabled
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
