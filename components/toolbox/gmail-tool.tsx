'use client';

import { Badge } from '@/components/ui/badge';
import { authClient, useSession } from '@/lib/auth/auth-client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircleFillIcon, LogoGoogle } from '../icons';
import { DropdownMenuItem } from '../ui/dropdown-menu';


function hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
  return requiredScopes.every(scope => userScopes.includes(scope));
}

const config = {
  id: 'gmail',
  name: 'Gmail',
  description: 'Read, send, and manage emails',
  icon: <span className='flex h-4 w-4 items-center justify-center'><LogoGoogle size={16} /></span>,
  requiresOAuth: {
    provider: 'google',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
  },
};

export interface GoogleToolProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function GoogleToolDropdownItem({ isEnabled, onToggle }: GoogleToolProps) {
  const [isLoading, setIsLoading] = useState(false);
  const _session = useSession();
  const searchParams = useSearchParams();

  // Check for OAuth connections when component mounts or when session changes
  useEffect(() => {
    const checkOAuthConnections = async () => {
      try {
        // Check if OAuth was just completed (via URL parameter)
        const oauthSuccess = searchParams.get('oauth_success');
        const toolId = searchParams.get('tool');

        if (oauthSuccess === 'true' && toolId === 'gmail') {
          // Auto-enable Gmail tool after successful OAuth
          if (!isEnabled) {
            onToggle(true);
          }

          // Clean up the URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('oauth_success');
          url.searchParams.delete('tool');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (_error) {
        // If we can't get access token, user doesn't have Google OAuth connected
        console.log('Google OAuth not connected');
      }
    };

    checkOAuthConnections();
  }, [isEnabled, onToggle, searchParams]);

  const handleOAuth = async () => {
    setIsLoading(true);
    try {
      await authClient.linkSocial({
        provider: config.requiresOAuth.provider,
        scopes: config.requiresOAuth.scopes,
      });

      // On successful OAuth, enable the tool
      if (!isEnabled) {
        onToggle(true);
      }

      toast.success(`${config.name} connected successfully!`);
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error(`Failed to connect ${config.name}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isEnabled) {
      onToggle(false);
      return;
    }
      try {
        const tokenResponse = await authClient.getAccessToken({
          providerId: 'google',
        });
        if (tokenResponse.data?.accessToken &&
            config.requiresOAuth &&
            hasRequiredScopes(tokenResponse.data.scopes, config.requiresOAuth.scopes)) {
          // User already has OAuth with required scopes, enable the tool
          onToggle(true);
          toast.success(`${config.name} enabled!`);
          return;
        } else if (tokenResponse.data?.accessToken && config.requiresOAuth) {
          // User has OAuth but lacks required scopes, trigger re-authentication
          toast.info(`Additional permissions required for ${config.name}. Please reconnect your Google account.`);
          await handleOAuth();
          return;
        }
      } catch (_error) {
        // If we can't get access token, user doesn't have Google OAuth connected
        console.log('Google OAuth not connected');
      }

    await handleOAuth();
  };

  return (
    <DropdownMenuItem
      className='flex cursor-pointer items-center justify-between p-3'
      onClick={handleToggle}
      style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
    >
      <div className='flex flex-1 items-center gap-3'>
        <div className="flex-shrink-0">{config.icon}</div>
        <div className='min-w-0 flex-1'>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.name}</span>
            <Badge variant="outline" className="text-xs">
              OAuth
            </Badge>
          </div>
          <p className='truncate text-muted-foreground text-xs'>
            {config.description}
          </p>
        </div>
      </div>

      {isEnabled && (
        <span className='flex h-4 w-4 items-center justify-center text-green-500'>
          <CheckCircleFillIcon size={16} />
        </span>
      )}
    </DropdownMenuItem>
  );
}




