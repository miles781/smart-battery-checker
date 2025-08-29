
'use client';

import { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
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
  Filler, // ✅ Import Filler plugin
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // ✅ Register Filler plugin
);


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Page() {
  const [battery, setBattery] = useState({ level: 100, charging: true });
  const [health] = useState(95);
  const [timeToEmpty, setTimeToEmpty] = useState(null);
  const [slowCharge, setSlowCharge] = useState(false);
  const [advice, setAdvice] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [location, setLocation] = useState('Fetching location...');
  const [darkMode, setDarkMode] = useState(false);
  const [speedData, setSpeedData] = useState([]);

  const prevLevel = useRef(null);
  const lastUpdateTime = useRef(Date.now());
  const batteryHistory = useRef([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            setLocation(data.address?.city || data.address?.town || data.address?.state || 'Unknown location');
          } catch {
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        () => setLocation('Location access denied.')
      );
    } else {
      setLocation('Geolocation not supported.');
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let simulationInterval;

    const updateBatteryState = (level, charging) => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTime.current) / 60000;

      setBattery({ level, charging });

      if (prevLevel.current !== null && deltaTime > 0) {
        const delta = level - prevLevel.current;
        const speed = delta / deltaTime;
        if (!isNaN(speed) && isFinite(speed)) {
          setSpeedData((prev) => [...prev.slice(-9), parseFloat(speed.toFixed(2))]);
        }

        batteryHistory.current.push({ delta, deltaTime });
        if (batteryHistory.current.length > 10) batteryHistory.current.shift();

        if (charging && delta <= 0 && deltaTime > 5) setSlowCharge(true);
        else setSlowCharge(false);

        if (!charging && delta < 0 && batteryHistory.current.length >= 3) {
          const drops = batteryHistory.current.filter((item) => item.delta < 0);
          if (drops.length > 0) {
            const avgDropRate =
              drops.reduce((acc, item) => acc + Math.abs(item.delta) / item.deltaTime, 0) / drops.length;
            if (avgDropRate > 0) setTimeToEmpty(Math.round(level / avgDropRate));
          }
        } else {
          setTimeToEmpty(null);
        }
      }

      prevLevel.current = level;
      lastUpdateTime.current = now;
    };

    if (navigator.getBattery) {
      navigator.getBattery().then((bat) => {
        const updateState = () => updateBatteryState(Math.round(bat.level * 100), bat.charging);
        updateState();
        bat.addEventListener('levelchange', updateState);
        bat.addEventListener('chargingchange', updateState);
      });
    } else {
      simulationInterval = setInterval(() => {
        setBattery((prev) => {
          let newLevel = prev.level - 1;
          if (newLevel < 0) newLevel = 100;
          updateBatteryState(newLevel, true);
          return { ...prev, level: newLevel, charging: true };
        });
      }, 5000);
    }

    return () => clearInterval(simulationInterval);
  }, []);

  useEffect(() => {
    const { level, charging } = battery;
    let msg = '';

    if (!charging && level < 20) msg = '⚠️ Battery very low! Plug in an 18W charger.';
    else if (!charging && timeToEmpty !== null) {
      const now = new Date();
      const finishTime = new Date(now.getTime() + timeToEmpty * 60000);
      const formatted = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      msg = `🔋 Battery may finish in ~${timeToEmpty} min (~${formatted})`;
    } else if (charging && level >= 100) msg = '✅ Battery fully charged! Unplug to avoid overcharging.';
    else if (charging && level >= 90) msg = '✅ Battery at 90%+. Unplug soon for long-term health.';
    else if (charging && level >= 80) msg = '🔋 Battery at 80%. Consider unplugging soon.';
    else if (slowCharge) msg = '⚠️ Charging too slow! Check your cable or try a better charger.';
    else if (charging && level < 80) msg = '⚡ Charging normally. Keep between 20–80% for best battery life.';
    else msg = '🔌 Discharging normally. Avoid deep discharge below 20%.';

    setAdvice(msg);
  }, [battery, timeToEmpty, slowCharge]);

  const bgColor = darkMode
    ? 'bg-gray-900 text-white'
    : battery.level < 20
    ? 'bg-red-100'
    : battery.level < 80
    ? 'bg-yellow-100'
    : 'bg-green-100';

  const chartData = {
    labels: Array(speedData.length).fill(''),
    datasets: [
      {
        label: '% per min',
        data: speedData,
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
      y: { min: -5, max: 5, ticks: { color: darkMode ? '#fff' : '#333' } },
      x: { ticks: { color: darkMode ? '#fff' : '#333' } },
    },
  };

  return (
    <main className={`min-h-screen transition-colors duration-700 flex items-center justify-center px-4 py-10 ${bgColor}`}>
      <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} border rounded-xl shadow-lg p-6 space-y-6 text-center`}>
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">🔋 Smart Battery Checker</h1>

        <div className="w-36 h-36 mx-auto">
          <CircularProgressbar
            value={battery.level}
            text={`${battery.level}%`}
            styles={buildStyles({
              textSize: '18px',
              pathColor: battery.level < 20 ? 'red' : battery.level < 80 ? 'orange' : 'green',
              textColor: darkMode ? '#fff' : '#333',
              trailColor: darkMode ? '#555' : '#ddd',
            })}
          />
        </div>

        <p className="text-xl font-semibold mt-2">
          Status: <span className="font-medium">{battery.charging ? 'Charging ⚡' : 'Not Charging 🔌'}</span>
        </p>

        <div className="text-sm">
          Battery Health: <span className="font-semibold text-blue-700 dark:text-blue-400">{health}%</span>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-md p-3 text-sm mt-2">
          {advice}
        </div>

        <div className="text-xs mt-4">
          ⏰ Time: <span className="font-medium">{currentTime}</span><br />
          📍 Location: <span className="font-medium">{location}</span>
        </div>

        <div className="mt-4">
          <Line data={chartData} options={chartOptions} />
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-4 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </main>
  );
}
