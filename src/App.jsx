import React, { useState } from 'react';
import './index.css';

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

const weatherCodes = {
    0: { desc: 'Ясно', icon: '☀️' },
    1: { desc: 'В основном ясно', icon: '🌤️' },
    2: { desc: 'Переменная облачность', icon: '⛅' },
    3: { desc: 'Пасмурно', icon: '☁️' },
    45: { desc: 'Туман', icon: '🌫️' },
    51: { desc: 'Легкая морось', icon: '🌧️' },
    61: { desc: 'Дождь', icon: '🌧️' },
    71: { desc: 'Снег', icon: '🌨️' },
    95: { desc: 'Гроза', icon: '⛈️' },
};

function App() {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchWeather() {
        if (!city.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const geoRes = await fetch(`${GEO_API}?name=${city}&count=1&language=ru`);
            const geoData = await geoRes.json();

            if (!geoData.results) throw new Error('Город не найден');

            const { latitude, longitude, name, country } = geoData.results[0];

            const weatherRes = await fetch(
                `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
            );
            const weatherData = await weatherRes.json();

            setWeather({
                cityName: name,
                countryName: country,
                current: weatherData.current_weather,
                daily: weatherData.daily,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const getWeatherInfo = (code) => weatherCodes[code] || { desc: 'Неизвестно', icon: '❓' };

    return (
        <div className="container">
            <header className="header">
                <h1 className="title">Погода</h1>
                <p className="subtitle">Простой прогноз для любого города</p>
            </header>

            <div className="search-section">
                <div className="search-box">
                    <input
                        className="search-input"
                        placeholder="Введите название города..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchWeather()}
                    />
                    <button className="search-btn" onClick={fetchWeather}>🔍</button>
                </div>
            </div>

            {loading && <div className="loading"><div className="spinner"></div><p>Ищем...</p></div>}
            {error && <div className="error">⚠️ {error}</div>}

            {weather && !loading && (
                <div className="weather-container">
                    <div className="current-weather">
                        <h2 className="city-name">{weather.cityName}, {weather.countryName}</h2>

                        <div className="weather-main">
                            <div className="temperature-section">
                                <span style={{ fontSize: '5rem' }}>
                                    {getWeatherInfo(weather.current.weathercode).icon}
                                </span>
                                <div className="temp-info">
                                    <span className="temperature">{Math.round(weather.current.temperature)}°</span>
                                    <p className="description">{getWeatherInfo(weather.current.weathercode).desc}</p>
                                </div>
                            </div>

                            <div className="weather-details">
                                <div className="detail-item">
                                    <p className="detail-label">Ветер</p>
                                    <p className="detail-value">{weather.current.windspeed} км/ч</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="forecast-section">
                        <h3 className="forecast-title">На следующие дни</h3>
                        <div className="forecast-list">
                            {weather.daily.time.slice(1, 6).map((date, i) => {
                                const info = getWeatherInfo(weather.daily.weathercode[i + 1]);
                                return (
                                    <div key={date} className="forecast-item">
                                        <p className="forecast-day">{new Date(date).toLocaleDateString('ru', { weekday: 'short' })}</p>
                                        <p style={{ fontSize: '2rem' }}>{info.icon}</p>
                                        <p className="forecast-temp">{Math.round(weather.daily.temperature_2m_max[i + 1])}°</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
