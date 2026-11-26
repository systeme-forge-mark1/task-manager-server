// Third-party integration: Open-Meteo (https://open-meteo.com) - free, no API key required.
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
};

const getJson = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw Object.assign(new Error('Weather provider error'), { status: 502 });
  return res.json();
};

exports.getWeather = async (req, res, next) => {
  try {
    const city = (req.query.city || 'Lahore').toString().trim().slice(0, 80);
    const key = city.toLowerCase();

    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return res.json(hit.data);

    const geo = await getJson(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
    const place = geo.results && geo.results[0];
    if (!place) throw Object.assign(new Error(`City "${city}" not found`), { status: 404 });

    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '1',
    });
    const w = await getJson(`${FORECAST_URL}?${params}`);

    const data = {
      city: place.name,
      country: place.country,
      temperature: w.current.temperature_2m,
      humidity: w.current.relative_humidity_2m,
      windSpeed: w.current.wind_speed_10m,
      condition: CODES[w.current.weather_code] || 'Unknown',
      high: w.daily.temperature_2m_max[0],
      low: w.daily.temperature_2m_min[0],
      units: { temperature: w.current_units.temperature_2m, wind: w.current_units.wind_speed_10m },
    };
    cache.set(key, { at: Date.now(), data });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
