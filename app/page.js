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
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Page() {
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [advice, setAdvice] = useState('');
  const [trendData, setTrendData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=4.8156&longitude=7.0498&current_weather=true&hourly=temperature_2m,precipitation'
        );
        const data = await res.json();
        setWeather(data.current_weather);

        // Hourly trend (last 6 hours)
        const temps = data.hourly.temperature_2m.slice(0, 6);
        setTrendData(temps);

        // Advice based on rain and temperature
        const rain = data.hourly.precipitation[0];
        const temp = data.current_weather.temperature;
        let msg = '';
        if (rain > 0) msg += '☔ Carry an umbrella. ';
        if (temp < 15) msg += '🧥 Wear a jacket. ';
        if (temp > 30) msg += '🥵 Stay hydrated and wear light clothes. ';
        if (msg === '') msg = '😊 Enjoy your day!';
        setAdvice(msg);

        // Cache for offline
        localStorage.setItem('cachedWeather', JSON.stringify({ weather: data.current_weather, trend: temps, advice: msg }));
      } catch (err) {
        console.error(err);
        const cached = localStorage.getItem('cachedWeather');
        if (cached) {
          const { weather, trend, advice } = JSON.parse(cached);
          setWeather(weather);
          setTrendData(trend);
          setAdvice(advice);
        }
      }
    };
    fetchWeather();
  }, []);

  // Fetch location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            setLocation(data.address.city || data.address.town || 'Your location');
          } catch {
            setLocation('Unable to fetch location');
          }
        },
        () => setLocation('Location access denied')
      );
    } else {
      setLocation('Geolocation not supported');
    }
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
      y: { ticks: { color: darkMode ? '#fff' : '#333' } },
      x: { ticks: { color: darkMode ? '#fff' : '#333' } },
    },
  };

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border`}>
        <h1 className="text-2xl font-bold text-center mb-4">🌤️ Smart Weather App</h1>
        <p className="text-center mb-2">Location: {location}</p>
        <p className="text-center mb-4">Time: {time}</p>

        {weather ? (
          <>
            <p className="text-center mb-2 text-lg">Temperature: {weather.temperature}°C</p>
            <p className="text-center mb-2 text-lg">Wind Speed: {weather.windspeed} km/h</p>
            <p className="text-center mb-4 text-sm">{advice}</p>

            <div className="mt-4">
              <Line data={chartData} options={chartOptions} />
            </div>
          </>
        ) : (
          <p className="text-center mb-4">Loading weather data...</p>
        )}

        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            onClick={() => setDarkMode(!darkMode)}
          >
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </main>
  );
}


