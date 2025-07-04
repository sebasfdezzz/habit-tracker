import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import confetti from "canvas-confetti";
import { Heart, CheckCircle, Circle, Trophy, Star, Flame, Crown, Target, TrendingUp, Award, Activity, X, Play, BarChart3 } from "lucide-react";

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
        
        {/* Video Placeholder */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-48 rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-purple-300">
          <div className="text-center text-purple-600">
            <Play className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-medium">{exercise.video_placeholder}</p>
          </div>
        </div>
        
        {/* Exercise Details */}
        <div className="space-y-3">
          <div className="bg-purple-50 p-4 rounded-xl">
            <h4 className="font-semibold text-purple-800 mb-2">Sets & Reps</h4>
            <p className="text-purple-700 text-lg font-bold">
              {exercise.sets} sets × {exercise.reps} reps
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">How to perform</h4>
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

// Log/Progress View Component
const LogProgressView = () => {
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [monthlyProgress, setMonthlyProgress] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);

  const today = new Date().toLocaleDateString('en-CA');

  // Celebration function
  const celebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    });
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

  const loadTodaySessions = async () => {
    try {
      const response = await axios.get(`${API}/workout-sessions/${today}`);
      setTodaySessions(response.data);
    } catch (error) {
      console.error("Error loading today's sessions:", error);
    }
  };

  useEffect(() => {
    loadWeeklyProgress();
    loadMonthlyProgress();
    loadStreakInfo();
    loadTodaySessions();
  }, []);

  const completedWorkoutsToday = todaySessions.filter(session => session.completed).length;

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <div className="text-3xl font-bold text-purple-600">{completedWorkoutsToday}</div>
          <div className="text-sm text-gray-600">Workouts completed today</div>
        </div>
      </div>

      {/* Streak Info */}
      {streakInfo && (
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-6 rounded-2xl text-center shadow-md">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-8 h-8 mr-3" />
            <div>
              <div className="text-2xl font-bold">{streakInfo.current_streak} days</div>
              <div className="text-sm opacity-90">Current Streak</div>
            </div>
          </div>
          <p className="text-sm text-orange-100 mt-2">
            Personal best: {streakInfo.longest_streak} days
          </p>
        </div>
      )}

      {/* Weekly Progress */}
      {weeklyProgress && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Weekly Progress</h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>💪 Workouts This Week</span>
              <span>{weeklyProgress.completed_workouts}/4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${weeklyProgress.progress_percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {Math.round(weeklyProgress.progress_percentage)}% of weekly goal
            </p>
          </div>

          {/* Workout Days Completed */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-gray-700">Days Completed:</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(day => (
                <div
                  key={day}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                    weeklyProgress.workout_days_completed.includes(day)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  Day {day}
                </div>
              ))}
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

      {/* Monthly Progress */}
      {monthlyProgress && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Monthly Progress</h3>
          
          {/* Progress Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{monthlyProgress.completed_workouts}</div>
              <div className="text-sm text-gray-600">Workouts Done</div>
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
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(monthlyProgress.progress_percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {monthlyProgress.completed_workouts} of {monthlyProgress.total_workouts} target workouts
            </p>
          </div>

          {/* Monthly Rewards */}
          {monthlyProgress.rewards_unlocked.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">Monthly Achievements:</h4>
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
  );
};

// Gym Routine View Component
const GymRoutineView = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(1);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Celebration function
  const celebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    });
  };

  const loadWorkouts = async () => {
    try {
      const response = await axios.get(`${API}/workout`);
      setWorkouts(response.data);
      
      if (response.data.length > 0) {
        setCurrentWorkout(response.data[0]);
        await loadWorkoutSession(1);
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
      await loadWorkoutSession(day);
    } catch (error) {
      console.error("Error loading workout:", error);
    }
  };

  const loadWorkoutSession = async (workoutDay) => {
    try {
      const response = await axios.get(`${API}/workout-session/${today}/${workoutDay}`);
      setCurrentSession(response.data);
    } catch (error) {
      console.error("Error loading workout session:", error);
    }
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const toggleExerciseCompletion = async (exerciseName, workoutName) => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      const currentExercise = currentSession.exercises.find(ex => ex.exercise_name === exerciseName);
      const newCompletedState = !currentExercise.completed;
      
      if (workoutName != 'Core'){
        const response = await axios.patch(
          `${API}/workout-session/${today}/${selectedWorkoutDay}/exercise`,
          {
            exercise_name: exerciseName,
            completed: newCompletedState
          }
        );
        
        setCurrentSession(response.data);
        
        // Celebrate if workout is completed
        if (response.data.completed && !currentSession.completed) {
          celebrate();
        }
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
    setLoading(false);
  };

  const getExerciseCompletionStatus = (exerciseName) => {
    if (!currentSession) return false;
    const exercise = currentSession.exercises.find(ex => ex.exercise_name === exerciseName);
    return exercise ? exercise.completed : false;
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const workoutDays = [
    { day: 1, name: "Leg Day 1", color: "from-green-500 to-emerald-600" },
    { day: 2, name: "Pull", color: "from-blue-500 to-indigo-600" },
    { day: 3, name: "Leg Day 2", color: "from-green-500 to-emerald-600" },
    { day: 4, name: "Push", color: "from-red-500 to-pink-600" },
    { day: 5, name: "Core", color: "from-red-500 to-indigo-600" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Workout Routine</h3>
        <p className="text-gray-600">4-day split program</p>
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Today's Progress</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              currentSession.completed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentSession.completed ? 'Completed!' : 'In Progress'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${currentSession.completion_percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {Math.round(currentSession.completion_percentage)}% complete
          </p>
        </div>
      )}

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
                {day === 5 ? (
                  <div className="text-lg font-bold">{name}</div>
                ) : (
                  <>
                    <div className="text-lg">Day {day}</div>
                    <div className="text-sm opacity-90">{name}</div>
                  </>
                )}
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
            {currentWorkout.exercises.map((exercise, index) => {
              const isCompleted = getExerciseCompletionStatus(exercise.name);
              
              return (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-xl transition-all ${
                    isCompleted 
                      ? 'bg-green-50 border-2 border-green-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => toggleExerciseCompletion(exercise.name, currentWorkout.name)}
                    className="mr-4 flex-shrink-0"
                    disabled={loading}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <Circle className="w-8 h-8 text-gray-400 hover:text-purple-500" />
                    )}
                  </button>
                  
                  <div className="flex-1" onClick={() => handleExerciseClick(exercise)}>
                    <div className={`font-semibold ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                      {exercise.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {exercise.sets} sets × {exercise.reps} reps
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleExerciseClick(exercise)}
                    className="ml-4 p-2 text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Workout Completion Status */}
          {currentSession && currentSession.completed && (
            <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="font-bold mb-1">Workout Complete!</h3>
              <p className="text-sm text-green-100">Amazing job! You crushed it today! 💪</p>
            </div>
          )}
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

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = useState('progress'); // 'progress' or 'routine'

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 mr-2 text-pink-200" />
            <h1 className="text-2xl font-bold">Welcome Mich! 💪</h1>
          </div>
          <p className="text-pink-100">Your personal gym tracker</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-2 shadow-md mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'progress'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Log/Progress
            </button>
            <button
              onClick={() => setActiveTab('routine')}
              className={`py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'routine'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Gym Routine
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'progress' ? <LogProgressView /> : <GymRoutineView />}
      </div>
    </div>
  );
};

export default App;