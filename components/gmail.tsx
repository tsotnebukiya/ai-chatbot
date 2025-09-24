'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MailIcon, SendIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

// Gmail tool response types
interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
  to?: string;
  body?: string;
  labelIds?: string[];
}

interface EmailListResponse {
  messages: GmailMessage[];
  resultSizeEstimate?: number;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  threadId?: string;
}

interface AuthRequiredResponse {
  message: string;
  setupRequired: boolean;
}

// Helper function to format email date
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return format(date, 'h:mm a');
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  } catch {
    return dateString;
  }
}

// Helper function to extract sender name
function extractSender(from: string): string {
  if (from.includes('<')) {
    const match = from.match(/^(.*?)\s*</);
    return match ? match[1].trim().replace(/"/g, '') : from;
  }
  return from;
}

// Helper function to extract sender email
function extractEmail(from: string): string {
  if (from.includes('<')) {
    const match = from.match(/<(.*?)>/);
    return match ? match[1] : from;
  }
  return from;
}

export function EmailList({ emailList }: { emailList: EmailListResponse }) {
  const { messages, resultSizeEstimate } = emailList;

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">
          {messages.length} of {resultSizeEstimate || messages.length} emails
        </h3>
        <Badge variant="secondary" className="text-xs">
          <MailIcon className="mr-1 h-3 w-3" />
          Gmail
        </Badge>
      </div>

      <div className="space-y-2">
        {messages.map((email) => (
          <EmailListItem key={email.id} email={email} />
        ))}
      </div>

      {messages.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <MailIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-sm">No emails found</p>
        </div>
      )}
    </div>
  );
}

function EmailListItem({ email }: { email: GmailMessage }) {
  const senderName = extractSender(email.from);
  const _senderEmail = extractEmail(email.from);

  return (
    <Card className={cn(
      "cursor-pointer transition-all hover:shadow-md",
      email.isUnread && "border-blue-200 bg-blue-50/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className={cn(
                "truncate font-medium text-sm",
                email.isUnread && "font-semibold"
              )}>
                {email.subject || 'No Subject'}
              </h4>
              {email.isUnread && (
                <Badge variant="default" className="px-1.5 py-0.5 text-xs">
                  New
                </Badge>
              )}
            </div>

            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <UserIcon className="h-3 w-3 text-muted-foreground" />
                <span className="truncate text-muted-foreground text-xs">
                  {senderName}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-xs">
                {formatDate(email.date)}
              </span>
            </div>

            <p className="line-clamp-2 text-muted-foreground text-xs">
              {email.snippet}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SingleEmail({ email }: { email: GmailMessage }) {
  const senderName = extractSender(email.from);
  const senderEmail = extractEmail(email.from);

  return (
    <Card className="max-w-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{email.subject || 'No Subject'}</CardTitle>
          <Badge variant="outline" className="text-xs">
            <MailIcon className="mr-1 h-3 w-3" />
            Gmail
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">From:</span>
            <span>{senderName}</span>
            {senderEmail !== senderName && (
              <span className="text-muted-foreground">&lt;{senderEmail}&gt;</span>
            )}
          </div>

          {email.to && (
            <div className="flex items-center gap-2">
              <span className="font-medium">To:</span>
              <span>{email.to}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-medium">Date:</span>
            <span>{new Date(email.date).toLocaleString()}</span>
          </div>

          {email.labelIds && email.labelIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Labels:</span>
              {email.labelIds.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="border-t pt-4">
          <div className="prose prose-sm max-w-none">
            {email.body ? (
              <div className="whitespace-pre-wrap text-sm">{email.body}</div>
            ) : (
              <p className="text-muted-foreground text-sm">No body content available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SendEmailConfirmation({ result }: { result: SendEmailResponse }) {
  if (result.success) {
    return (
      <Card className="max-w-md">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <SendIcon className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800 text-lg">Email Sent!</CardTitle>
          <CardDescription className="text-green-600">
            Your email has been successfully delivered
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Message ID:</span>
              <span className="font-mono text-xs">{result.messageId}</span>
            </div>
            {result.threadId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thread ID:</span>
                <span className="font-mono text-xs">{result.threadId}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md border-red-200">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <SendIcon className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-lg text-red-800">Send Failed</CardTitle>
        <CardDescription className="text-red-600">
          Unable to send your email
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AuthRequired({ authData }: { authData: AuthRequiredResponse }) {
  return (
    <Card className="max-w-md">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-lg">Authentication Required</CardTitle>
        <CardDescription className="text-blue-600">
          {authData.message}
        </CardDescription>
      </CardHeader>

      {authData.setupRequired && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button className="w-full" variant="default">
              <ShieldCheckIcon className="mr-2 h-4 w-4" />
              Set Up Gmail Integration
            </Button>
            <p className="text-center text-muted-foreground text-xs">
              You'll need to link your Google account to use Gmail features
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Main Gmail component that handles different response types
export function Gmail({ data }: { data: any }) {
  // Check if this is an auth required response
  if (data.setupRequired) {
    return <AuthRequired authData={data} />;
  }

  // Check if this is a send email response
  if (data.success !== undefined) {
    return <SendEmailConfirmation result={data} />;
  }

  // Check if this is a single email (has body)
  if (data.body) {
    return <SingleEmail email={data} />;
  }

  // Check if this is an email list (has messages array)
  if (data.messages && Array.isArray(data.messages)) {
    return <EmailList emailList={data} />;
  }

  // Fallback for unknown response types
  return (
    <Card className="max-w-md">
      <CardContent className="p-4">
        <div className="text-center">
          <MailIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Gmail data format not recognized</p>
        </div>
      </CardContent>
    </Card>
  );
}