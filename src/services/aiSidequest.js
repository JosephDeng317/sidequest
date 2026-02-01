import * as Location from 'expo-location';

const GEOAPIFY_BASE = 'https://api.geoapify.com/v2/places';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const RADIUS_M = 1000;
const POI_LIMIT = 20;
// Geoapify categories: parks, cafes, sights (statues/monuments), gyms/fitness
var POI_CATEGORIES = 'leisure.park,catering.cafe,tourism.sights,sport.fitness';

/**
 * Get current device location (foreground). Throws if permission denied or location unavailable.
 */
export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to generate an AI sidequest.');
  }
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Fetch 5–10 POIs within 500m using Geoapify Places API.
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {Promise<Array<{ name: string, categories?: string, address?: string }>>}
 */
export async function fetchNearbyPOIs(coords, category) {
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error('Geoapify API key is missing. Add EXPO_PUBLIC_GEOAPIFY_API_KEY to your .env');
  }
  const { longitude, latitude } = coords;
  const filter = `circle:${longitude},${latitude},${RADIUS_M}`;

  if (category === 'fun') {
    POI_CATEGORIES = 'leisure.park,catering.cafe,tourism.sights,sport.fitness';
  } else if (category === 'fitness') {
    POI_CATEGORIES = 'sport.fitness,leisure.park,tourism.sights';
  } else if (category === 'social') {
    POI_CATEGORIES = 'leisure.park,catering.cafe,tourism.sights,sport.fitness';
  } else {
    POI_CATEGORIES = 'leisure.park,catering.cafe,tourism.sights,sport.fitness';
  }

  const params = new URLSearchParams({
    categories: POI_CATEGORIES,
    filter,
    bias: `proximity:${longitude},${latitude}`,
    limit: String(POI_LIMIT),
    apiKey,
  });
  const url = `${GEOAPIFY_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Geoapify error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const features = data.features ?? [];
  return features.slice(0, POI_LIMIT).map((f) => {
    const p = f.properties ?? {};
    return {
      name: p.name ?? 'Unnamed place',
      categories: p.categories ?? '',
      address: p.address_line1 || p.formatted || '',
    };
  });
}

/**
 * Generate a sidequest using Google Gemini 1.5 Flash from POIs, category, and time.
 * @param {Array<{ name: string, categories?: string, address?: string }>} pois
 * @param {string} category - e.g. 'fun', 'fitness', 'social'
 * @param {number} timeMinutes - e.g. 15–120
 * @returns {Promise<{ title: string, description: string, durationMinutes: number }>}
 */
export async function generateAISidequest(pois, category, timeMinutes) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI (Gemini) API key is missing. Add EXPO_PUBLIC_GOOGLE_AI_API_KEY to your .env');
  }

  const poisText =
    pois.length > 0
      ? pois.map((p) => `- ${p.name}${p.address ? ` (${p.address})` : ''}`).join('\n')
      : 'No specific nearby places were found.';

  const prompt = `You are a friendly sidequest generator. Given the user's location and nearby points of interest (parks, cafes, statues, gyms, etc.), suggest ONE short, doable "sidequest" that fits their chosen category and time limit.

Nearby points of interest (within ~500m):
${poisText}

User preferences:
- Category: ${category}
- Time available: ${timeMinutes} minutes

Respond with ONLY a valid JSON object (no markdown, no code block, no extra text), with exactly these keys:
- "title": string (short, catchy title for the sidequest, e.g. "Coffee crawl at two cafes")
- "description": string (2–4 sentences explaining the sidequest and how to do it using the listed places when possible)
- "durationMinutes": number (should be <= ${timeMinutes})

Example format: {"title":"...","description":"...","durationMinutes":30}`;

  console.log(poisText);

  const url = `${GEMINI_BASE}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000,
      },
    }),
  });
  

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error: ${res.status}`);
  }

  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Gemini returned no text.');

  // // Strip markdown code block if present
  // const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  // if (codeMatch) text = codeMatch[1].trim();

  console.log(text);

  try {
    const parsed = JSON.parse(text);
    return {
      title: String(parsed.title ?? 'AI Sidequest').trim(),
      description: String(parsed.description ?? '').trim(),
      durationMinutes: Math.min(
        Math.max(Number(parsed.durationMinutes) || timeMinutes, 15),
        timeMinutes
      ),
    };
  } catch (e) {
    throw new Error('Could not parse AI sidequest response. Try again.');
  }
}

/**
 * Full flow: get location → fetch POIs → generate sidequest.
 */
export async function generateSidequestFromLocation(category, timeMinutes) {
  const coords = await getCurrentLocation();
  const pois = await fetchNearbyPOIs(coords, category);
  const quest = await generateAISidequest(pois, category, timeMinutes);
  return quest;
}
