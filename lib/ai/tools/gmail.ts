import { auth } from '@/lib/auth/auth';
import { requireAuth } from '@/lib/auth/session';
import { tool } from 'ai';
import { z } from 'zod';

export const listEmails = tool({
  description: 'List emails from Gmail inbox',
  inputSchema: z.object({
    maxResults: z.number().optional().default(10),
    query: z.string().optional(),
  }),
  execute: async ({ maxResults, query }) => {
    try {
      // Get authenticated user
      const session = await requireAuth();
      if (!session) {
        return {
          message:
            'Authentication required. Please sign in to use Gmail integration.',
          setupRequired: true,
        };
      }

      // Get Gmail access token using Better Auth
      const tokenResponse = await auth.api.getAccessToken({
        body: {
          providerId: 'google',
          userId: session.user.id,
        },
      });

      if (!tokenResponse?.accessToken) {
        return {
          message:
            'Gmail integration requires OAuth setup. Please link your Google account to use Gmail features.',
          setupRequired: true,
        };
      }

      const accessToken = tokenResponse.accessToken;

      // Build Gmail API query
      const searchQuery = query || 'is:unread';
      const url = new URL(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      );
      url.searchParams.append('maxResults', maxResults.toString());
      url.searchParams.append('q', searchQuery);

      const gmailResponse = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!gmailResponse.ok) {
        throw new Error(
          `Failed to fetch emails: ${gmailResponse.status} ${gmailResponse.statusText}`,
        );
      }

      const data = await gmailResponse.json();

      // Fetch full message details for each email
      const messages = await Promise.all(
        (data.messages || []).slice(0, maxResults).map(async (message: any) => {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!detailResponse.ok) {
            return null;
          }

          const detail = await detailResponse.json();

          // Extract headers
          const headers = detail.payload.headers || [];
          const subject =
            headers.find((h: any) => h.name === 'Subject')?.value ||
            'No Subject';
          const from =
            headers.find((h: any) => h.name === 'From')?.value ||
            'Unknown Sender';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          return {
            id: message.id,
            threadId: message.threadId,
            subject,
            from,
            date,
            snippet: detail.snippet,
            isUnread: detail.labelIds?.includes('UNREAD') || false,
          };
        }),
      );

      return {
        messages: messages.filter(Boolean),
        resultSizeEstimate: data.resultSizeEstimate,
      };
    } catch (error) {
      console.error('Error listing emails:', error);
      throw new Error(
        `Failed to list emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

export const sendEmail = tool({
  description: 'Send an email using Gmail',
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    cc: z.string().email().optional(),
    bcc: z.string().email().optional(),
  }),
  execute: async ({ to, subject, body, cc, bcc }) => {
    try {
      // Get authenticated user
      const session = await requireAuth();
      if (!session) {
        return {
          message:
            'Authentication required. Please sign in to use Gmail integration.',
          setupRequired: true,
        };
      }

      // Get Gmail access token using Better Auth
      const tokenResponse = await auth.api.getAccessToken({
        body: {
          providerId: 'google',
          userId: session.user.id,
        },
      });

      if (!tokenResponse?.accessToken) {
        return {
          message:
            'Gmail integration requires OAuth setup. Please link your Google account to use Gmail features.',
          setupRequired: true,
        };
      }

      const accessToken = tokenResponse.accessToken;

      // Create raw email message
      const emailContent = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ...(cc ? [`Cc: ${cc}`] : []),
        ...(bcc ? [`Bcc: ${bcc}`] : []),
        '',
        body,
      ].join('\n');

      // Base64 encode the email content
      const encodedEmail = btoa(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      const sendResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        },
      );

      if (!sendResponse.ok) {
        throw new Error('Failed to send email');
      }

      const result = await sendResponse.json();
      return {
        success: true,
        messageId: result.id,
        threadId: result.threadId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

export const getEmail = tool({
  description: 'Get a specific email by ID',
  inputSchema: z.object({
    messageId: z.string(),
  }),
  execute: async ({ messageId }) => {
    try {
      // Get authenticated user
      const session = await requireAuth();
      if (!session) {
        return {
          message:
            'Authentication required. Please sign in to use Gmail integration.',
          setupRequired: true,
        };
      }

      // Get Gmail access token using Better Auth
      const tokenResponse = await auth.api.getAccessToken({
        body: {
          providerId: 'google',
          userId: session.user.id,
        },
      });

      if (!tokenResponse?.accessToken) {
        return {
          message:
            'Gmail integration requires OAuth setup. Please link your Google account to use Gmail features.',
          setupRequired: true,
        };
      }

      const accessToken = tokenResponse.accessToken;

      const gmailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!gmailResponse.ok) {
        throw new Error('Failed to fetch email');
      }

      const message = await gmailResponse.json();

      // Extract headers
      const headers = message.payload.headers || [];
      const subject =
        headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from =
        headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
      const to = headers.find((h: any) => h.name === 'To')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Extract body
      let body = '';
      if (message.payload.body?.data) {
        const decodedData = atob(
          message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'),
        );
        body = decodeURIComponent(decodedData);
      } else if (message.payload.parts) {
        // Handle multipart messages
        const textPart = message.payload.parts.find(
          (part: any) => part.mimeType === 'text/plain',
        );
        if (textPart?.body?.data) {
          const decodedData = atob(
            textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'),
          );
          body = decodeURIComponent(decodedData);
        }
      }

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body,
        snippet: message.snippet,
        isUnread: message.labelIds?.includes('UNREAD') || false,
        labelIds: message.labelIds || [],
      };
    } catch (error) {
      console.error('Error getting email:', error);
      throw new Error(
        `Failed to get email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
