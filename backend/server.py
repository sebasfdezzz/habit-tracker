from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
import base64
import calendar


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class DailyHabit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    breakfast: bool = False
    lunch: bool = False
    dinner: bool = False
    gym: bool = False
    gym_photo: Optional[str] = None  # base64 encoded image
    completed_all: bool = False
    eating_completed: bool = False  # breakfast + lunch + dinner
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DailyHabitCreate(BaseModel):
    date: str
    breakfast: Optional[bool] = False
    lunch: Optional[bool] = False
    dinner: Optional[bool] = False
    gym: Optional[bool] = False
    gym_photo: Optional[str] = None

class DailyHabitUpdate(BaseModel):
    breakfast: Optional[bool] = None
    lunch: Optional[bool] = None
    dinner: Optional[bool] = None
    gym: Optional[bool] = None
    gym_photo: Optional[str] = None

class WeeklyProgress(BaseModel):
    week_start: str
    eating_progress: dict  # {completed_days: int, total_days: 7, percentage: float}
    gym_progress: dict     # {completed_days: int, total_days: 4, percentage: float}
    overall_progress: float
    rewards_unlocked: List[str]

class MonthlyProgress(BaseModel):
    month: str  # YYYY-MM format
    total_days: int
    completed_days: int
    eating_days: int
    gym_days: int
    progress_percentage: float
    current_streak: int
    longest_streak: int
    rewards_unlocked: List[str]

class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    last_completion_date: Optional[str]

class CalendarDay(BaseModel):
    date: str
    breakfast: bool
    lunch: bool
    dinner: bool
    gym: bool
    completed_all: bool
    eating_completed: bool

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    description: str
    image_placeholder: str  # URL or placeholder text

class WorkoutDay(BaseModel):
    day: int
    name: str
    exercises: List[Exercise]
    is_active: bool

# Enhanced Workout routine data with detailed exercises
WORKOUT_ROUTINE = {
    1: {
        "name": "Leg Day 1",
        "exercises": [
            {
                "name": "Hip Abductor Machine",
                "sets": 4,
                "reps": 15,
                "description": "Seated hip abduction targeting outer glutes",
                "image_placeholder": "placeholder_abductor.jpg"
            },
            {
                "name": "Hip Adductor Machine", 
                "sets": 4,
                "reps": 15,
                "description": "Seated hip adduction targeting inner thighs",
                "image_placeholder": "placeholder_adductor.jpg"
            },
            {
                "name": "Hip Thrust",
                "sets": 4,
                "reps": 15,
                "description": "Barbell hip thrust for glute activation",
                "image_placeholder": "placeholder_hipthrust.jpg"
            },
            {
                "name": "Romanian Deadlift",
                "sets": 4,
                "reps": 15,
                "description": "Hamstring and glute focused deadlift variation",
                "image_placeholder": "placeholder_rdl.jpg"
            },
            {
                "name": "Goblet Squats",
                "sets": 4,
                "reps": 15,
                "description": "Front-loaded squat with dumbbell or kettlebell",
                "image_placeholder": "placeholder_goblet_squat.jpg"
            }
        ],
        "is_active": True
    },
    2: {
        "name": "Pull",
        "exercises": [
            {
                "name": "Lat Pulldown",
                "sets": 4,
                "reps": 15,
                "description": "Wide grip lat pulldown for back width",
                "image_placeholder": "placeholder_lat_pulldown.jpg"
            },
            {
                "name": "Seated Cable Row",
                "sets": 4,
                "reps": 15,
                "description": "Seated pulley row for mid-back thickness",
                "image_placeholder": "placeholder_cable_row.jpg"
            },
            {
                "name": "Single-Arm Dumbbell Row",
                "sets": 4,
                "reps": 15,
                "description": "Unilateral dumbbell row for back and lats",
                "image_placeholder": "placeholder_db_row.jpg"
            },
            {
                "name": "Hammer Curls",
                "sets": 4,
                "reps": 15,
                "description": "Neutral grip bicep curls",
                "image_placeholder": "placeholder_hammer_curls.jpg"
            },
            {
                "name": "Lying Bicep Curls",
                "sets": 4,
                "reps": 15,
                "description": "Supine bicep curls for peak contraction",
                "image_placeholder": "placeholder_lying_curls.jpg"
            }
        ],
        "is_active": True
    },
    3: {
        "name": "Leg Day 2",
        "exercises": [
            {
                "name": "Wall Sit (Isometric Squat)",
                "sets": 4,
                "reps": "45 sec",
                "description": "Isometric squat hold against wall",
                "image_placeholder": "placeholder_wall_sit.jpg"
            },
            {
                "name": "Bulgarian Split Squats",
                "sets": 4,
                "reps": 15,
                "description": "Single leg squat with rear foot elevated",
                "image_placeholder": "placeholder_bulgarian_squat.jpg"
            },
            {
                "name": "Donkey Kicks",
                "sets": 4,
                "reps": 15,
                "description": "Quadruped hip extension for glutes",
                "image_placeholder": "placeholder_donkey_kicks.jpg"
            },
            {
                "name": "Lateral Donkey Kicks",
                "sets": 4,
                "reps": 15,
                "description": "Side-lying hip abduction kicks",
                "image_placeholder": "placeholder_lateral_kicks.jpg"
            },
            {
                "name": "Standing Calf Raises",
                "sets": 4,
                "reps": 20,
                "description": "Standing calf raises for gastrocnemius",
                "image_placeholder": "placeholder_calf_raises.jpg"
            }
        ],
        "is_active": True
    },
    4: {
        "name": "Push",
        "exercises": [
            {
                "name": "Military Press",
                "sets": 4,
                "reps": 15,
                "description": "Standing overhead press for shoulders",
                "image_placeholder": "placeholder_military_press.jpg"
            },
            {
                "name": "Lateral Raises",
                "sets": 4,
                "reps": 15,
                "description": "Dumbbell side raises for medial deltoids",
                "image_placeholder": "placeholder_lateral_raises.jpg"
            },
            {
                "name": "Bench Dips",
                "sets": 4,
                "reps": 15,
                "description": "Tricep dips using bench or chair",
                "image_placeholder": "placeholder_bench_dips.jpg"
            },
            {
                "name": "Cable Rope Pushdown",
                "sets": 4,
                "reps": 15,
                "description": "Tricep pushdown with rope attachment",
                "image_placeholder": "placeholder_rope_pushdown.jpg"
            },
            {
                "name": "Push-ups",
                "sets": 4,
                "reps": 15,
                "description": "Standard push-ups for chest and triceps",
                "image_placeholder": "placeholder_pushups.jpg"
            }
        ],
        "is_active": True
    }
}

# Helper functions
def check_all_completed(habit_data):
    return (habit_data.get('breakfast', False) and 
            habit_data.get('lunch', False) and 
            habit_data.get('dinner', False) and 
            habit_data.get('gym', False))

def check_eating_completed(habit_data):
    return (habit_data.get('breakfast', False) and 
            habit_data.get('lunch', False) and 
            habit_data.get('dinner', False))

# Routes
@api_router.get("/")
async def root():
    return {"message": "Habit Tracker API is running! 💖"}

@api_router.post("/habits", response_model=DailyHabit)
async def create_or_update_habit(habit_data: DailyHabitCreate):
    """Create or update daily habit for a specific date"""
    try:
        # Check if habit already exists for this date
        existing = await db.daily_habits.find_one({"date": habit_data.date})
        
        habit_dict = habit_data.dict()
        habit_dict['completed_all'] = check_all_completed(habit_dict)
        habit_dict['eating_completed'] = check_eating_completed(habit_dict)
        
        if existing:
            # Update existing habit
            habit_dict['id'] = existing['id']
            await db.daily_habits.replace_one({"date": habit_data.date}, habit_dict)
        else:
            # Create new habit
            habit_obj = DailyHabit(**habit_dict)
            await db.daily_habits.insert_one(habit_obj.dict())
            
        return DailyHabit(**habit_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/habits/{date}")
async def update_habit(date: str, updates: DailyHabitUpdate):
    """Update specific fields of a daily habit"""
    try:
        existing = await db.daily_habits.find_one({"date": date})
        if not existing:
            # Create new habit if it doesn't exist
            default_habit = DailyHabit(date=date)
            existing = default_habit.dict()
        
        # Only update provided fields
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        # Update the existing habit with new data
        for key, value in update_data.items():
            existing[key] = value
        
        # Recalculate completion flags
        existing['completed_all'] = check_all_completed(existing)
        existing['eating_completed'] = check_eating_completed(existing)
        
        await db.daily_habits.replace_one({"date": date}, existing, upsert=True)
        return DailyHabit(**existing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/habits/{date}", response_model=DailyHabit)
async def get_habit(date: str):
    """Get habit for a specific date"""
    try:
        habit = await db.daily_habits.find_one({"date": date})
        if not habit:
            # Return default habit structure if not found
            default_habit = DailyHabit(date=date)
            return default_habit
        return DailyHabit(**habit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/habits", response_model=List[DailyHabit])
async def get_all_habits():
    """Get all habits (for admin view)"""
    try:
        habits = await db.daily_habits.find().sort("date", -1).to_list(1000)
        return [DailyHabit(**habit) for habit in habits]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/weekly")
async def get_weekly_progress():
    """Get weekly progress with separate eating and gym tracking"""
    try:
        # Get current week's habits
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_dates = [(week_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
        
        habits = await db.daily_habits.find({"date": {"$in": week_dates}}).to_list(100)
        habits_dict = {habit['date']: habit for habit in habits}
        
        # Calculate eating progress (7 days)
        eating_completed = 0
        for date in week_dates:
            if date in habits_dict and habits_dict[date].get('eating_completed', False):
                eating_completed += 1
        
        # Calculate gym progress (4 days target)
        gym_completed = 0
        for date in week_dates:
            if date in habits_dict and habits_dict[date].get('gym', False):
                gym_completed += 1
        
        eating_progress = {
            "completed_days": eating_completed,
            "total_days": 7,
            "percentage": (eating_completed / 7) * 100
        }
        
        gym_progress = {
            "completed_days": gym_completed,
            "total_days": 4,
            "percentage": min((gym_completed / 4) * 100, 100)  # Cap at 100%
        }
        
        # Overall progress (average of both)
        overall_progress = (eating_progress["percentage"] + gym_progress["percentage"]) / 2
        
        # Determine rewards based on progress
        rewards = []
        if overall_progress >= 25:
            rewards.append("🌟 Getting Started!")
        if overall_progress >= 50:
            rewards.append("🔥 On Fire!")
        if overall_progress >= 75:
            rewards.append("💎 Diamond Streak!")
        if overall_progress >= 90:
            rewards.append("👑 Perfect Week Queen!")
        
        return WeeklyProgress(
            week_start=week_start.strftime('%Y-%m-%d'),
            eating_progress=eating_progress,
            gym_progress=gym_progress,
            overall_progress=overall_progress,
            rewards_unlocked=rewards
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/monthly")
async def get_monthly_progress():
    """Get monthly progress and statistics"""
    try:
        today = datetime.now().date()
        month_start = today.replace(day=1)
        
        # Get days in current month
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        month_dates = [(month_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days_in_month)]
        
        habits = await db.daily_habits.find({"date": {"$in": month_dates}}).to_list(1000)
        habits_dict = {habit['date']: habit for habit in habits}
        
        # Calculate statistics
        completed_days = sum(1 for date in month_dates if date in habits_dict and habits_dict[date].get('completed_all', False))
        eating_days = sum(1 for date in month_dates if date in habits_dict and habits_dict[date].get('eating_completed', False))
        gym_days = sum(1 for date in month_dates if date in habits_dict and habits_dict[date].get('gym', False))
        
        progress_percentage = (completed_days / days_in_month) * 100
        
        # Calculate current streak
        streak_info = await get_streak_info()
        
        # Monthly rewards
        rewards = []
        if progress_percentage >= 20:
            rewards.append("🎯 Month Started!")
        if progress_percentage >= 40:
            rewards.append("💪 Strong Month!")
        if progress_percentage >= 60:
            rewards.append("🔥 Excellent Month!")
        if progress_percentage >= 80:
            rewards.append("👑 Amazing Month!")
        if progress_percentage >= 95:
            rewards.append("🏆 Perfect Month!")
        
        return MonthlyProgress(
            month=today.strftime('%Y-%m'),
            total_days=days_in_month,
            completed_days=completed_days,
            eating_days=eating_days,
            gym_days=gym_days,
            progress_percentage=progress_percentage,
            current_streak=streak_info.current_streak,
            longest_streak=streak_info.longest_streak,
            rewards_unlocked=rewards
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/streak")
async def get_streak_info():
    """Get current and longest streak information"""
    try:
        # Get all habits sorted by date
        habits = await db.daily_habits.find().sort("date", 1).to_list(1000)
        
        if not habits:
            return StreakInfo(current_streak=0, longest_streak=0, last_completion_date=None)
        
        # Calculate streaks
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        last_completion_date = None
        
        # Convert to date objects and sort
        habit_dates = []
        for habit in habits:
            if habit.get('completed_all', False):
                habit_dates.append(datetime.strptime(habit['date'], '%Y-%m-%d').date())
        
        habit_dates.sort()
        
        if not habit_dates:
            return StreakInfo(current_streak=0, longest_streak=0, last_completion_date=None)
        
        # Calculate current streak from today backwards
        today = datetime.now().date()
        current_date = today
        
        while current_date in habit_dates:
            current_streak += 1
            current_date -= timedelta(days=1)
        
        # Calculate longest streak
        if len(habit_dates) > 0:
            temp_streak = 1
            for i in range(1, len(habit_dates)):
                if habit_dates[i] - habit_dates[i-1] == timedelta(days=1):
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
            last_completion_date = habit_dates[-1].strftime('%Y-%m-%d')
        
        return StreakInfo(
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_completion_date=last_completion_date
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/calendar/{year}/{month}")
async def get_calendar_data(year: int, month: int):
    """Get calendar data for a specific month"""
    try:
        # Create date range for the month
        month_start = date(year, month, 1)
        days_in_month = calendar.monthrange(year, month)[1]
        month_dates = [(month_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days_in_month)]
        
        habits = await db.daily_habits.find({"date": {"$in": month_dates}}).to_list(1000)
        habits_dict = {habit['date']: habit for habit in habits}
        
        calendar_data = []
        for date_str in month_dates:
            if date_str in habits_dict:
                habit = habits_dict[date_str]
                calendar_data.append(CalendarDay(
                    date=date_str,
                    breakfast=habit.get('breakfast', False),
                    lunch=habit.get('lunch', False),
                    dinner=habit.get('dinner', False),
                    gym=habit.get('gym', False),
                    completed_all=habit.get('completed_all', False),
                    eating_completed=habit.get('eating_completed', False)
                ))
            else:
                calendar_data.append(CalendarDay(
                    date=date_str,
                    breakfast=False,
                    lunch=False,
                    dinner=False,
                    gym=False,
                    completed_all=False,
                    eating_completed=False
                ))
        
        return calendar_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout/{day}", response_model=WorkoutDay)
async def get_workout(day: int):
    """Get workout for a specific day (1-4)"""
    try:
        if day not in WORKOUT_ROUTINE:
            raise HTTPException(status_code=404, detail="Invalid day")
        
        workout = WORKOUT_ROUTINE[day]
        exercises = [Exercise(**exercise) for exercise in workout["exercises"]]
        
        return WorkoutDay(
            day=day,
            name=workout["name"],
            exercises=exercises,
            is_active=workout["is_active"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout")
async def get_all_workouts():
    """Get all workout days (1-4)"""
    try:
        workouts = []
        for day in range(1, 5):  # Only 4 workout days now
            workout = WORKOUT_ROUTINE[day]
            exercises = [Exercise(**exercise) for exercise in workout["exercises"]]
            workouts.append(WorkoutDay(
                day=day,
                name=workout["name"],
                exercises=exercises,
                is_active=workout["is_active"]
            ))
        return workouts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()