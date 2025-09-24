import { tool } from 'ai';
import { z } from 'zod';
import { env } from '../../../lib/env';

export const webSearch = tool({
  description: 'Search the web for current news',
  inputSchema: z.object({
    query: z.string().describe('Search query to look for information'),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum number of results to return (default: 5)'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .optional()
      .default('basic')
      .describe('Search depth level (default: basic)')
  }),
  execute: async ({ query, maxResults, searchDepth }) => {
    try {
      const apiKey = env.TAVILY_API_KEY;

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          max_results: maxResults,
          search_depth: searchDepth,
          include_answer: true,
          include_raw_content: false,
          include_images: false
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      // Transform the response to a cleaner format
      return {
        query: data.query,
        answer: data.answer,
        results: data.results.map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          rawContent: result.raw_content,
          publishedDate: result.published_date,
          score: result.score
        })),
        responseTime: data.response_time
      };
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error(
        `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});
