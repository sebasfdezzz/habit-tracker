import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import confetti from "canvas-confetti";
import { Heart, Camera, CheckCircle, Circle, Trophy, Star, Flame, Crown, Calendar, Target, TrendingUp, Award, Activity, X, Play } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Exercise Detail Modal Component
const ExerciseModal = ({ exercise, isOpen, onClose }) => {
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{exercise.name}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Placeholder Image */}
        <div className="bg-gray-200 h-48 rounded-xl mb-4 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Exercise Demo</p>
            <p className="text-xs">(Coming Soon)</p>
          </div>
        </div>
        
        {/* Exercise Details */}
        <div className="space-y-3">
          <div className="bg-purple-50 p-4 rounded-xl">
            <h4 className="font-semibold text-purple-800 mb-2">Sets & Reps</h4>
            <p className="text-purple-700">
              {exercise.sets} sets × {exercise.reps} reps
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">Description</h4>
            <p className="text-blue-700">{exercise.description}</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

// Gym Routine Component
const GymRoutineView = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(1);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const loadWorkouts = async () => {
    try {
      const response = await axios.get(`${API}/workout`);
      setWorkouts(response.data);
      
      // Load first workout by default
      if (response.data.length > 0) {
        setCurrentWorkout(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    }
  };

  const loadWorkout = async (day) => {
    try {
      const response = await axios.get(`${API}/workout/${day}`);
      setCurrentWorkout(response.data);
      setSelectedWorkoutDay(day);
    } catch (error) {
      console.error("Error loading workout:", error);
    }
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const workoutDays = [
    { day: 1, name: "Leg Day 1", color: "from-green-500 to-emerald-600" },
    { day: 2, name: "Pull", color: "from-blue-500 to-indigo-600" },
    { day: 3, name: "Leg Day 2", color: "from-green-500 to-emerald-600" },
    { day: 4, name: "Push", color: "from-red-500 to-pink-600" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Workout Routine</h3>
        <p className="text-gray-600">4-day split program</p>
      </div>

      {/* 4-Day Selector */}
      <div className="grid grid-cols-2 gap-3">
        {workoutDays.map(({ day, name, color }) => {
          const isSelected = selectedWorkoutDay === day;
          
          return (
            <button
              key={day}
              onClick={() => loadWorkout(day)}
              className={`p-4 rounded-xl text-white font-semibold transition-all ${
                isSelected
                  ? `bg-gradient-to-r ${color} transform scale-105 shadow-lg`
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold">Day {day}</div>
                <div className="text-sm opacity-90">{name}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Workout */}
      {currentWorkout && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h4 className="font-bold text-gray-800 mb-4 text-center text-lg">
            {currentWorkout.name}
          </h4>
          
          <div className="space-y-3">
            {currentWorkout.exercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => handleExerciseClick(exercise)}
                className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                  {index + 1}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-800">{exercise.name}</div>
                  <div className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps} reps
                  </div>
                </div>
                <Play className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Modal */}
      <ExerciseModal
        exercise={selectedExercise}
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
      />
    </div>
  );
};

// Main Menu Component
const MainMenu = ({ onSelectView }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-pink-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Habit Tracker</h1>
          <p className="text-gray-600">Choose your view</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <button
            onClick={() => onSelectView('mich')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💖</div>
              <h2 className="text-2xl font-bold mb-2">Soy Mich</h2>
              <p className="text-pink-100">Track your daily habits</p>
            </div>
          </button>
          
          <button
            onClick={() => onSelectView('sebas')}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-2">Soy Sebas</h2>
              <p className="text-blue-100">View progress & stats</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Mich View Component (Enhanced Habit Tracker)
const MichView = ({ onBack }) => {
  const [todayHabits, setTodayHabits] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    gym: false,
    gym_photo: null
  });
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [monthlyProgress, setMonthlyProgress] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' or 'routine'

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

  // Load data functions
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

  const loadWeeklyProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/weekly`);
      setWeeklyProgress(response.data);
    } catch (error) {
      console.error("Error loading weekly progress:", error);
    }
  };

  const loadMonthlyProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/monthly`);
      setMonthlyProgress(response.data);
    } catch (error) {
      console.error("Error loading monthly progress:", error);
    }
  };

  const loadStreakInfo = async () => {
    try {
      const response = await axios.get(`${API}/progress/streak`);
      setStreakInfo(response.data);
    } catch (error) {
      console.error("Error loading streak info:", error);
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
      
      // Reload progress data
      await Promise.all([
        loadWeeklyProgress(),
        loadMonthlyProgress(),
        loadStreakInfo()
      ]);
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

  useEffect(() => {
    loadTodayHabits();
    loadWeeklyProgress();
    loadMonthlyProgress();
    loadStreakInfo();
  }, []);

  const allCompleted = todayHabits.breakfast && todayHabits.lunch && todayHabits.dinner && todayHabits.gym;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="bg-white bg-opacity-20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-30 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center">
            <Heart className="w-8 h-8 mr-2 text-pink-200" />
            <h1 className="text-2xl font-bold">Hola Mich! 💖</h1>
          </div>
          <div className="w-16"></div>
        </div>
        <p className="text-center text-pink-100 mt-2">Track your daily routine with love!</p>
      </div>

      {/* Tab Navigation */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-2 shadow-md mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-5 h-5 inline mr-2" />
              Tracker
            </button>
            <button
              onClick={() => setActiveTab('routine')}
              className={`py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'routine'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Gym Routine
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tracker' ? (
          <div className="space-y-6">
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

            {/* Streak Info */}
            {streakInfo && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-2xl text-center shadow-md">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-6 h-6 mr-2" />
                  <span className="text-lg font-bold">Streak: {streakInfo.current_streak} days</span>
                </div>
                <p className="text-sm text-yellow-100">
                  Longest streak: {streakInfo.longest_streak} days
                </p>
              </div>
            )}

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
                
                {/* Eating Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>🍽️ Eating (7 days)</span>
                    <span>{Math.round(weeklyProgress.eating_progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress.eating_progress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {weeklyProgress.eating_progress.completed_days} of {weeklyProgress.eating_progress.total_days} days
                  </p>
                </div>

                {/* Gym Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>💪 Gym (4 days)</span>
                    <span>{Math.round(weeklyProgress.gym_progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress.gym_progress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {weeklyProgress.gym_progress.completed_days} of {weeklyProgress.gym_progress.total_days} days
                  </p>
                </div>

                {/* Overall Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>🎯 Overall</span>
                    <span>{Math.round(weeklyProgress.overall_progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress.overall_progress}%` }}
                    ></div>
                  </div>
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

            {/* Monthly Progress & Roadmap */}
            {monthlyProgress && (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Monthly Progress</h3>
                
                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{monthlyProgress.completed_days}</div>
                    <div className="text-sm text-gray-600">Perfect Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{Math.round(monthlyProgress.progress_percentage)}%</div>
                    <div className="text-sm text-gray-600">Monthly Goal</div>
                  </div>
                </div>

                {/* Monthly Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${monthlyProgress.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Roadmap */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-3 text-gray-700 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Roadmap to Rewards
                  </h4>
                  <div className="space-y-2">
                    <div className={`flex items-center p-2 rounded-lg ${monthlyProgress.progress_percentage >= 20 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
                      <span className="text-sm">20% - Month Started! 🎯</span>
                    </div>
                    <div className={`flex items-center p-2 rounded-lg ${monthlyProgress.progress_percentage >= 40 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
                      <span className="text-sm">40% - Strong Month! 💪</span>
                    </div>
                    <div className={`flex items-center p-2 rounded-lg ${monthlyProgress.progress_percentage >= 60 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
                      <span className="text-sm">60% - Excellent Month! 🔥</span>
                    </div>
                    <div className={`flex items-center p-2 rounded-lg ${monthlyProgress.progress_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
                      <span className="text-sm">80% - Amazing Month! 👑</span>
                    </div>
                    <div className={`flex items-center p-2 rounded-lg ${monthlyProgress.progress_percentage >= 95 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
                      <span className="text-sm">95% - Perfect Month! 🏆</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Rewards */}
                {monthlyProgress.rewards_unlocked.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700">Monthly Rewards:</h4>
                    <div className="flex flex-wrap gap-2">
                      {monthlyProgress.rewards_unlocked.map((reward, index) => (
                        <span 
                          key={index}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <GymRoutineView />
        )}
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

// Sebas View Component (Admin Calendar)
const SebasView = ({ onBack }) => {
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [allHabits, setAllHabits] = useState([]);

  const loadCalendarData = async (year, month) => {
    try {
      const response = await axios.get(`${API}/calendar/${year}/${month}`);
      setCalendarData(response.data);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API}/progress/monthly`);
      setMonthlyStats(response.data);
    } catch (error) {
      console.error("Error loading monthly stats:", error);
    }
  };

  const loadAllHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`);
      setAllHabits(response.data);
    } catch (error) {
      console.error("Error loading all habits:", error);
    }
  };

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    loadCalendarData(year, month);
    loadMonthlyStats();
    loadAllHabits();
  }, [currentMonth]);

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + delta);
      return newMonth;
    });
  };

  const getDayColor = (day) => {
    if (day.completed_all) return 'bg-green-500 text-white';
    if (day.eating_completed && day.gym) return 'bg-blue-500 text-white';
    if (day.eating_completed) return 'bg-yellow-500 text-white';
    if (day.gym) return 'bg-purple-500 text-white';
    if (day.breakfast || day.lunch || day.dinner) return 'bg-orange-300 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="bg-white bg-opacity-20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-30 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center">
            <Calendar className="w-8 h-8 mr-2 text-blue-200" />
            <h1 className="text-2xl font-bold">Hola Sebas! 📊</h1>
          </div>
          <div className="w-16"></div>
        </div>
        <p className="text-center text-blue-100 mt-2">Progress overview & statistics</p>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        
        {/* Monthly Stats */}
        {monthlyStats && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Monthly Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monthlyStats.completed_days}</div>
                <div className="text-sm text-gray-600">Perfect Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monthlyStats.eating_days}</div>
                <div className="text-sm text-gray-600">Eating Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{monthlyStats.gym_days}</div>
                <div className="text-sm text-gray-600">Gym Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{monthlyStats.current_streak}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              ← Previous
            </button>
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
            {calendarData.map((day, index) => {
              const dayNumber = new Date(day.date).getDate();
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center font-semibold transition-all ${getDayColor(day)}`}
                >
                  <div className="text-lg">{dayNumber}</div>
                  <div className="text-xs mt-1">
                    {day.completed_all && '✅'}
                    {!day.completed_all && day.eating_completed && '🍽️'}
                    {!day.completed_all && day.gym && '💪'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 text-gray-700">Legend:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Perfect Day</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Eating + Gym</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                <span>All Meals</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                <span>Gym Only</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-300 rounded mr-2"></div>
                <span>Some Meals</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                <span>No Activity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Recent Activity</h3>
          <div className="space-y-3">
            {allHabits.slice(0, 10).map((habit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">
                    {new Date(habit.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {habit.breakfast && '🥐'} 
                    {habit.lunch && '🥗'} 
                    {habit.dinner && '🍽️'} 
                    {habit.gym && '💪'}
                  </div>
                </div>
                <div className="text-right">
                  {habit.completed_all && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Perfect!
                    </span>
                  )}
                  {!habit.completed_all && habit.eating_completed && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      All Meals
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'mich', 'sebas'

  const handleSelectView = (view) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('menu');
  };

  if (currentView === 'menu') {
    return <MainMenu onSelectView={handleSelectView} />;
  } else if (currentView === 'mich') {
    return <MichView onBack={handleBack} />;
  } else if (currentView === 'sebas') {
    return <SebasView onBack={handleBack} />;
  }

  return <MainMenu onSelectView={handleSelectView} />;
};

export default App;