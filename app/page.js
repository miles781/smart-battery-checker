'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [umbrellaAdvice, setUmbrellaAdvice] = useState('');

  useEffect(() => {
    // Fetch current time
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000); // Update every minute

    // Fetch weather data
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=4.8156&longitude=7.0498&current_weather=true&hourly=precipitation');
        const data = await res.json();
        setWeather(data.current_weather);
        setUmbrellaAdvice(data.hourly.precipitation[0] > 0 ? '☔ Carry an umbrella!' : '🌞 No rain expected.');
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };
    fetchWeather();

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Fetch location data
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            setLocation(data.address.city || data.address.town || 'Your location');
          } catch (error) {
            setLocation('Unable to fetch location');
          }
        },
        () => setLocation('Location access denied')
      );
    } else {
      setLocation('Geolocation not supported');
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">🌤️ Weather & Time App</h1>
        <p className="text-center text-lg mb-4">Location: {location}</p>
        <p className="text-center text-lg mb-4">Time: {time}</p>
        {weather ? (
          <>
            <p className="text-center text-lg mb-4">Temperature: {weather.temperature}°C</p>
            <p className="text-center text-lg mb-4">Wind Speed: {weather.windspeed} km/h</p>
            <p className="text-center text-lg mb-4">{umbrellaAdvice}</p>
          </>
        ) : (
          <p className="text-center text-lg mb-4">Loading weather data...</p>
        )}
      </div>
    </main>
  );
}

