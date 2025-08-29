'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Page() {
  const [weather, setWeather] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [city, setCity] = useState('London');
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // 🔑 Get free key from https://openweathermap.org/

  // Fetch current weather
  const fetchWeather = async () => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      const data = await res.json();
      if (data.cod !== 200) {
        setError(data.message);
        return;
      }
      setWeather(data);
      setError('');

      // Trend: simulate last 6 hours using temp variations
      const temps = Array(6)
        .fill(0)
        .map(() => data.main.temp + (Math.random() * 2 - 1));
      setTrendData(temps);

      // Cache for offline
      localStorage.setItem('cachedWeather', JSON.stringify({ data, trend: temps }));
    } catch (err) {
      setError('Failed to fetch weather.');
      // Load cached if available
      const cached = localStorage.getItem('cachedWeather');
      if (cached) {
        const { data, trend } = JSON.parse(cached);
        setWeather(data);
        setTrendData(trend);
      }
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const chartData = {
    labels: trendData.map((_, i) => `${i + 1}h ago`),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: trendData,
        fill: true,
        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.2)',
        borderColor: darkMode ? '#fff' : 'rgba(59,130,246,1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: Math.min(...trendData) - 2, max: Math.max(...trendData) + 2, ticks: { color: darkMode ? '#fff' : '#333' } },
      x: { ticks: { color: darkMode ? '#fff' : '#333' } },
    },
  };

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 py-10 ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border rounded-xl shadow-lg p-6 space-y-6 text-center`}>
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">🌤 Smart Weather App</h1>

        {error && <p className="text-red-500">{error}</p>}

        {weather && (
          <>
            <div className="text-xl font-semibold mt-2">
              {weather.name}, {weather.sys.country}
            </div>

            <div className="text-3xl font-bold mt-2">{weather.main.temp.toFixed(1)}°C</div>
            <div className="text-sm mt-1">
              Humidity: {weather.main.humidity}% | Wind: {weather.wind.speed} m/s
            </div>

            <div className="mt-4">
              <Line data={chartData} options={chartOptions} />
            </div>
          </>
        )}

        <div className="mt-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </main>
  );
}
