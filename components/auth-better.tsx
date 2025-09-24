'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'register';
  redirectTo?: string;
}

export function AuthBetter({ mode, redirectTo = '/' }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0] // Use email prefix as name
        });

        if (result.error) {
          setError(result.error.message || 'Failed to create account');
        } else {
          // Auto-login after successful registration
          const loginResult = await authClient.signIn.email({
            email,
            password
          });

          if (loginResult.error) {
            setError(
              loginResult.error.message || 'Failed to login after registration'
            );
          } else {
            router.push(redirectTo);
          }
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password
        });

        if (result.error) {
          setError(result.error.message || 'Invalid credentials');
        } else {
          router.push(redirectTo);
        }
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (
    provider: 'google' | 'github' | 'discord'
  ) => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectTo
      });
    } catch (_err) {
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center font-bold text-2xl">
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login'
            ? 'Enter your credentials to access your account'
            : 'Create a new account to get started'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-center text-red-500 text-sm">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? 'Loading...'
              : mode === 'login'
                ? 'Sign In'
                : 'Sign Up'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('github')}
            disabled={isLoading}
          >
            <Icons.gitHub className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('google')}
            disabled={isLoading}
          >
            <Icons.google className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialSignIn('discord')}
            disabled={isLoading}
          >
            <Icons.discord className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-sm">
          {mode === 'login' ? (
            <span className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
