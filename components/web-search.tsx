'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SearchIcon, ExternalLinkIcon, ClockIcon, AlertCircleIcon, GlobeIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Web search response types
interface SearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  publishedDate?: string;
  score: number;
}

interface WebSearchResponse {
  query: string;
  answer?: string;
  results: SearchResult[];
  responseTime: number;
  error?: string;
  setupRequired?: boolean;
}

interface SetupRequiredResponse {
  error: string;
  setupRequired: boolean;
}

// Helper function to format publication date
function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date';

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function WebSearchResults({ data }: { data: WebSearchResponse }) {
  const { query, answer, results, responseTime } = data;

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium text-muted-foreground text-sm">
            Search results for: "{query}"
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <ClockIcon className="h-3 w-3" />
            <span>{responseTime}ms • {results.length} results</span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          <SearchIcon className="mr-1 h-3 w-3" />
          Web Search
        </Badge>
      </div>

      {/* AI-generated answer if available */}
      {answer && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-blue-800 text-sm">
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-blue-700 text-sm leading-relaxed">{answer}</p>
          </CardContent>
        </Card>
      )}

      {/* Search results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <SearchResultItem key={`${result.url}-${index}`} result={result} />
        ))}
      </div>

      {results.length === 0 && (
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">No search results found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SearchResultItem({ result }: { result: SearchResult }) {
  const domain = extractDomain(result.url);

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title and URL */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 font-medium text-sm leading-tight">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-blue-600"
                >
                  {result.title}
                </a>
              </h4>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <GlobeIcon className="h-3 w-3" />
                <span>{domain}</span>
                {result.publishedDate && (
                  <>
                    <span>•</span>
                    <span>{formatDate(result.publishedDate)}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-1"
            >
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Content snippet */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {truncateText(result.content, 200)}
          </p>

          {/* Relevance score indicator */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <div className={cn("h-3 w-1 rounded-full", result.score >= 0.2 && "bg-blue-500")} />
              <div className={cn("h-3 w-1 rounded-full", result.score >= 0.4 && "bg-blue-500")} />
              <div className={cn("h-3 w-1 rounded-full", result.score >= 0.6 && "bg-blue-500")} />
              <div className={cn("h-3 w-1 rounded-full", result.score >= 0.8 && "bg-blue-500")} />
              <div className={cn("h-3 w-1 rounded-full", result.score >= 1.0 && "bg-blue-500")} />
              <span className="ml-2 text-muted-foreground text-xs">
                {Math.round(result.score * 100)}% relevant
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SetupRequired({ setupData }: { setupData: SetupRequiredResponse }) {
  return (
    <Card className="max-w-md">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertCircleIcon className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle className="text-lg">Web Search Setup Required</CardTitle>
        <CardDescription className="text-amber-600">
          {setupData.error}
        </CardDescription>
      </CardHeader>

      {setupData.setupRequired && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-muted-foreground text-sm">
              <p className="mb-2">To enable web search functionality:</p>
              <ol className="list-inside list-decimal space-y-1 text-left">
                <li>Sign up for a Tavily API key at <a href="https://tavily.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tavily.com</a></li>
                <li>Add your API key as <code className="rounded bg-muted px-1 py-0.5 text-xs">TAVILY_API_KEY</code> to your environment variables</li>
                <li>Restart the development server</li>
              </ol>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Tavily API Key
              </a>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Main WebSearch component that handles different response types
export function WebSearch({ data }: { data: any }) {
  // Check if this is a setup required response
  if (data.setupRequired) {
    return <SetupRequired setupData={data} />;
  }

  // Check if this is an error response
  if (data.error) {
    return <SetupRequired setupData={data} />;
  }

  // Check if this is a valid search response
  if (data.results && Array.isArray(data.results)) {
    return <WebSearchResults data={data} />;
  }

  // Fallback for unknown response types
  return (
    <Card className="max-w-md">
      <CardContent className="p-4">
        <div className="text-center">
          <SearchIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Web search data format not recognized</p>
        </div>
      </CardContent>
    </Card>
  );
}