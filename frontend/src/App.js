import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import confetti from "canvas-confetti";
import { Heart, Camera, CheckCircle, Circle, Trophy, Star, Flame, Crown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [todayHabits, setTodayHabits] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    gym: false,
    gym_photo: null
  });
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(1);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Celebration function
  const celebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff69b4', '#ff1493', '#ffd700', '#ff6347', '#9370db']
    });
  };

  // Load today's habits
  const loadTodayHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits/${today}`);
      setTodayHabits(response.data);
      
      // Check if just completed all tasks
      if (response.data.completed_all && !todayHabits.completed_all) {
        celebrate();
      }
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  // Load weekly progress
  const loadWeeklyProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/weekly`);
      setWeeklyProgress(response.data);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  // Load workouts
  const loadWorkouts = async () => {
    try {
      const response = await axios.get(`${API}/workout`);
      setWorkouts(response.data);
      
      // Load first workout by default
      const firstWorkout = await axios.get(`${API}/workout/1`);
      setCurrentWorkout(firstWorkout.data);
    } catch (error) {
      console.error("Error loading workouts:", error);
    }
  };

  // Update habit
  const updateHabit = async (habitType, value, photo = null) => {
    setLoading(true);
    try {
      const updateData = { [habitType]: value };
      if (photo) {
        updateData.gym_photo = photo;
      }
      
      const response = await axios.patch(`${API}/habits/${today}`, updateData);
      setTodayHabits(response.data);
      
      // Celebrate if all tasks completed
      if (response.data.completed_all) {
        celebrate();
      }
      
      // Reload progress
      loadWeeklyProgress();
    } catch (error) {
      console.error("Error updating habit:", error);
    }
    setLoading(false);
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        updateHabit('gym', true, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load workout for specific day
  const loadWorkout = async (day) => {
    try {
      const response = await axios.get(`${API}/workout/${day}`);
      setCurrentWorkout(response.data);
      setSelectedWorkoutDay(day);
    } catch (error) {
      console.error("Error loading workout:", error);
    }
  };

  useEffect(() => {
    loadTodayHabits();
    loadWeeklyProgress();
    loadWorkouts();
  }, []);

  const allCompleted = todayHabits.breakfast && todayHabits.lunch && todayHabits.dinner && todayHabits.gym;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 mr-2 text-pink-200" />
          <h1 className="text-2xl font-bold">Daily Habits 💖</h1>
        </div>
        <p className="text-center text-pink-100">Track your daily routine with love!</p>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        
        {/* Today's Date */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Breakfast */}
          <div 
            className={`p-4 rounded-2xl shadow-md transition-all duration-300 cursor-pointer ${
              todayHabits.breakfast 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white transform scale-105' 
                : 'bg-white hover:shadow-lg'
            }`}
            onClick={() => updateHabit('breakfast', !todayHabits.breakfast)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🥐</span>
                <span className="font-semibold">Breakfast</span>
              </div>
              {todayHabits.breakfast ? 
                <CheckCircle className="w-6 h-6" /> : 
                <Circle className="w-6 h-6 text-gray-400" />
              }
            </div>
          </div>

          {/* Lunch */}
          <div 
            className={`p-4 rounded-2xl shadow-md transition-all duration-300 cursor-pointer ${
              todayHabits.lunch 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white transform scale-105' 
                : 'bg-white hover:shadow-lg'
            }`}
            onClick={() => updateHabit('lunch', !todayHabits.lunch)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🥗</span>
                <span className="font-semibold">Lunch</span>
              </div>
              {todayHabits.lunch ? 
                <CheckCircle className="w-6 h-6" /> : 
                <Circle className="w-6 h-6 text-gray-400" />
              }
            </div>
          </div>

          {/* Dinner */}
          <div 
            className={`p-4 rounded-2xl shadow-md transition-all duration-300 cursor-pointer ${
              todayHabits.dinner 
                ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white transform scale-105' 
                : 'bg-white hover:shadow-lg'
            }`}
            onClick={() => updateHabit('dinner', !todayHabits.dinner)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🍽️</span>
                <span className="font-semibold">Dinner</span>
              </div>
              {todayHabits.dinner ? 
                <CheckCircle className="w-6 h-6" /> : 
                <Circle className="w-6 h-6 text-gray-400" />
              }
            </div>
          </div>

          {/* Gym */}
          <div 
            className={`p-4 rounded-2xl shadow-md transition-all duration-300 ${
              todayHabits.gym 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white transform scale-105' 
                : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💪</span>
                <span className="font-semibold">Gym</span>
              </div>
              {todayHabits.gym ? 
                <CheckCircle className="w-6 h-6" /> : 
                <Circle className="w-6 h-6 text-gray-400" />
              }
            </div>
            
            {/* Photo Upload */}
            <div className="mt-3">
              <input
                type="file"
                id="gym-photo"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="gym-photo"
                className={`flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all ${
                  todayHabits.gym_photo 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-5 h-5 mr-2" />
                <span className="text-sm">
                  {todayHabits.gym_photo ? 'Photo uploaded! ✨' : 'Upload gym photo'}
                </span>
              </label>
              
              {/* Display uploaded photo */}
              {todayHabits.gym_photo && (
                <div className="mt-3">
                  <img 
                    src={todayHabits.gym_photo} 
                    alt="Gym proof" 
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Status */}
        {allCompleted && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-2xl text-center shadow-lg">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold mb-2">Amazing Day!</h3>
            <p>You completed all your habits today! You're incredible! 💖</p>
          </div>
        )}

        {/* Weekly Progress */}
        {weeklyProgress && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Weekly Progress</h3>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(weeklyProgress.progress_percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgress.progress_percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {weeklyProgress.completed_days} of {weeklyProgress.total_days} days completed
              </p>
            </div>

            {/* Rewards */}
            {weeklyProgress.rewards_unlocked.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">Rewards Unlocked:</h4>
                <div className="flex flex-wrap gap-2">
                  {weeklyProgress.rewards_unlocked.map((reward, index) => (
                    <span 
                      key={index}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {reward}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gym Routine Section */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Gym Routine</h3>
            <button
              onClick={() => setShowWorkouts(!showWorkouts)}
              className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
            >
              {showWorkouts ? 'Hide' : 'Show'} Workouts
            </button>
          </div>

          {showWorkouts && (
            <>
              {/* 7-Day Selector */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const isActive = [1, 2, 4, 5].includes(day);
                  const isSelected = selectedWorkoutDay === day;
                  
                  return (
                    <button
                      key={day}
                      onClick={() => loadWorkout(day)}
                      className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white transform scale-105'
                          : isActive
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Day {day}
                    </button>
                  );
                })}
              </div>

              {/* Current Workout */}
              {currentWorkout && (
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h4 className="font-bold text-purple-800 mb-3 text-center">
                    Day {currentWorkout.day}: {currentWorkout.name}
                  </h4>
                  
                  <div className="space-y-2">
                    {currentWorkout.exercises.map((exercise, index) => (
                      <div key={index} className="flex items-center p-2 bg-white rounded-lg">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{exercise}</span>
                      </div>
                    ))}
                  </div>
                  
                  {!currentWorkout.is_active && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg text-center">
                      <span className="text-blue-700 font-medium">🌙 Rest Day - Take it easy!</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Updating...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;