import { tool } from 'ai';
import { z } from 'zod';

async function geocodeLocation(location: string) {
  // Check if location is already coordinates (lat,lon format)
  const coordRegex = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
  const coordMatch = location.match(coordRegex);

  if (coordMatch) {
    return {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
      name: location
    };
  }

  // Use Open-Meteo geocoding API for city names
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Location "${location}" not found`);
  }

  const result = data.results[0];
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: `${result.name}, ${result.country || ''}`.trim()
  };
}

export const getWeather = tool({
  description: 'Get the current weather at a location. Provide city name (e.g., "London") or coordinates (e.g., "51.5074,-0.1278")',
  inputSchema: z.object({
    location: z.string().describe('City name or latitude,longitude coordinates'),
  }),
  execute: async ({ location }) => {
    try {
      // Geocode the location to get coordinates
      const coords = await geocodeLocation(location);

      // Get weather data using the coordinates
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m&daily=sunrise,sunset,weather_code&timezone=auto`,
      );

      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.statusText}`);
      }

      const weatherData = await response.json();

      // Add location info to the response
      return {
        ...weatherData,
        location: {
          name: coords.name,
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      };
    } catch (error) {
      throw new Error(`Weather lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
