// Weather Forecast JS using Open-Meteo (no API key required)

const geoApiBase = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherApiBase = 'https://api.open-meteo.com/v1/forecast';

// DOM elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const weatherContainer = document.getElementById('weatherContainer');

const cityNameEl = document.getElementById('cityName');
const dateEl = document.getElementById('date');
const weatherIconEl = document.getElementById('weatherIcon');
const temperatureEl = document.getElementById('temperature');
const descriptionEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const pressureEl = document.getElementById('pressure');
const forecastListEl = document.getElementById('forecastList');

function showLoading(show) {
	if (show) loadingEl.classList.remove('hidden');
	else loadingEl.classList.add('hidden');
}

function showError(msg) {
	if (!msg) {
		errorEl.classList.add('hidden');
		errorEl.textContent = '';
		return;
	}
	errorEl.classList.remove('hidden');
	errorEl.textContent = msg;
}

function countryCodeToFlagEmoji(cc) {
	if (!cc || cc.length !== 2) return '';
	const A = 0x1F1E6;
	return String.fromCodePoint(...[...cc.toUpperCase()].map(c => A + c.charCodeAt(0) - 65));
}

function emojiToSvgDataUrl(emoji, size = 160) {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><text x='50%' y='50%' font-size='${Math.floor(size*0.6)}' text-anchor='middle' dominant-baseline='central'>${emoji}</text></svg>`;
	return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const weatherCodeMap = {
	0: {desc: 'Clear sky', emoji: '☀️'},
	1: {desc: 'Mainly clear', emoji: '🌤️'},
	2: {desc: 'Partly cloudy', emoji: '⛅'},
	3: {desc: 'Overcast', emoji: '☁️'},
	45: {desc: 'Fog', emoji: '🌫️'},
	48: {desc: 'Depositing rime fog', emoji: '🌫️'},
	51: {desc: 'Light drizzle', emoji: '🌦️'},
	53: {desc: 'Moderate drizzle', emoji: '🌦️'},
	55: {desc: 'Dense drizzle', emoji: '🌧️'},
	56: {desc: 'Light freezing drizzle', emoji: '🌧️❄️'},
	57: {desc: 'Dense freezing drizzle', emoji: '🌧️❄️'},
	61: {desc: 'Slight rain', emoji: '🌧️'},
	63: {desc: 'Moderate rain', emoji: '🌧️'},
	65: {desc: 'Heavy rain', emoji: '⛈️'},
	66: {desc: 'Light freezing rain', emoji: '🌧️❄️'},
	67: {desc: 'Heavy freezing rain', emoji: '🌧️❄️'},
	71: {desc: 'Slight snow', emoji: '🌨️'},
	73: {desc: 'Moderate snow', emoji: '🌨️'},
	75: {desc: 'Heavy snow', emoji: '❄️'},
	77: {desc: 'Snow grains', emoji: '❄️'},
	80: {desc: 'Slight rain showers', emoji: '🌦️'},
	81: {desc: 'Moderate rain showers', emoji: '🌧️'},
	82: {desc: 'Violent rain showers', emoji: '⛈️'},
	85: {desc: 'Slight snow showers', emoji: '🌨️'},
	86: {desc: 'Heavy snow showers', emoji: '❄️'},
	95: {desc: 'Thunderstorm', emoji: '⛈️'},
	96: {desc: 'Thunderstorm with slight hail', emoji: '⛈️'},
	99: {desc: 'Thunderstorm with heavy hail', emoji: '⛈️'},
};

function getWeatherDescAndEmoji(code) {
	return weatherCodeMap[code] || {desc: 'Unknown', emoji: '❓'};
}

function findNearestIndex(timeArray, targetIso) {
	// timeArray are ISO strings
	let bestIdx = 0;
	let bestDiff = Infinity;
	const target = new Date(targetIso).getTime();
	timeArray.forEach((t, i) => {
		const diff = Math.abs(new Date(t).getTime() - target);
		if (diff < bestDiff) {
			bestDiff = diff;
			bestIdx = i;
		}
	});
	return bestIdx;
}

async function geocodeCity(name) {
	const url = `${geoApiBase}?name=${encodeURIComponent(name)}&count=1&language=ru`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Geocoding failed');
	const data = await res.json();
	if (!data.results || data.results.length === 0) throw new Error('City not found');
	return data.results[0];
}

async function fetchWeather(lat, lon, timezone = 'auto') {
	const params = new URLSearchParams({
		latitude: lat,
		longitude: lon,
		current_weather: 'true',
		hourly: 'relativehumidity_2m,surface_pressure',
		daily: 'temperature_2m_max,temperature_2m_min,weathercode',
		timezone: timezone
	});
	const url = `${weatherApiBase}?${params.toString()}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Weather fetch failed');
	return res.json();
}

function renderCurrentWeather(place, weatherData) {
	const cw = weatherData.current_weather;
	const tz = weatherData.timezone || '';

	const nowIso = cw.time;
	const humIdx = findNearestIndex(weatherData.hourly.time, nowIso);
	const humidity = weatherData.hourly.relativehumidity_2m[humIdx];
	const pressure = weatherData.hourly.surface_pressure[humIdx];

	const wc = getWeatherDescAndEmoji(cw.weathercode);

	const flag = countryCodeToFlagEmoji(place.country_code);
	cityNameEl.textContent = `${flag} ${place.name}${place.admin1 ? ', ' + place.admin1 : ''}, ${place.country}`;

	const d = new Date(nowIso);
	dateEl.textContent = d.toLocaleString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});

	weatherIconEl.src = emojiToSvgDataUrl(wc.emoji, 160);
	weatherIconEl.alt = wc.desc;
	temperatureEl.textContent = `${Math.round(cw.temperature)}°C`;
	descriptionEl.textContent = wc.desc;
	feelsLikeEl.textContent = `${Math.round(cw.temperature)}°C`;
	humidityEl.textContent = `${humidity}%`;
	windSpeedEl.textContent = `${cw.windspeed} m/s`;
	pressureEl.textContent = `${Math.round(pressure)} hPa`;

	weatherContainer.classList.remove('hidden');
}

function renderForecast(weatherData) {
	const days = weatherData.daily.time.slice(0, 5);
	forecastListEl.innerHTML = '';
	for (let i = 0; i < days.length; i++) {
		const dateStr = days[i];
		const maxT = weatherData.daily.temperature_2m_max[i];
		const minT = weatherData.daily.temperature_2m_min[i];
		const wcode = weatherData.daily.weathercode[i];
		const wc = getWeatherDescAndEmoji(wcode);

		const day = new Date(dateStr);
		const dayName = day.toLocaleDateString(undefined, {weekday: 'short'});

		const item = document.createElement('div');
		item.className = 'forecast-item';
		item.innerHTML = `
			<div class="forecast-day">${dayName}</div>
			<img class="forecast-icon" src="${emojiToSvgDataUrl(wc.emoji, 96)}" alt="${wc.desc}">
			<div class="forecast-temp">${Math.round(maxT)}° / ${Math.round(minT)}°</div>
			<div class="forecast-desc">${wc.desc}</div>
		`;
		forecastListEl.appendChild(item);
	}
}

async function searchAndShow(city) {
	showError('');
	showLoading(true);
	weatherContainer.classList.add('hidden');
	try {
		const place = await geocodeCity(city);
		const weatherData = await fetchWeather(place.latitude, place.longitude, place.timezone || 'auto');
		renderCurrentWeather(place, weatherData);
		renderForecast(weatherData);
	} catch (err) {
		console.error(err);
		showError('Не удалось получить данные о погоде. Попробуйте другой город.');
	} finally {
		showLoading(false);
	}
}

searchBtn.addEventListener('click', () => {
	const city = cityInput.value.trim();
	if (!city) return;
	searchAndShow(city);
});

cityInput.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		const city = cityInput.value.trim();
		if (!city) return;
		searchAndShow(city);
	}
});

// Optional: initial sample city
// searchAndShow('Moscow');

