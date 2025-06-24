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
from datetime import datetime, date
import base64


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
    total_days: int
    completed_days: int
    progress_percentage: float
    rewards_unlocked: List[str]

class WorkoutDay(BaseModel):
    day: int
    name: str
    exercises: List[str]
    is_active: bool

# Workout routine data
WORKOUT_ROUTINE = {
    1: {
        "name": "Upper Body Power",
        "exercises": [
            "Push-ups - 3 sets of 12",
            "Dumbbell rows - 3 sets of 10",
            "Shoulder press - 3 sets of 8",
            "Bicep curls - 2 sets of 15",
            "Tricep dips - 2 sets of 12"
        ],
        "is_active": True
    },
    2: {
        "name": "Lower Body Blast",
        "exercises": [
            "Squats - 4 sets of 15",
            "Lunges - 3 sets of 12 each leg",
            "Glute bridges - 3 sets of 15",
            "Calf raises - 3 sets of 20",
            "Wall sit - 3 sets of 30 seconds"
        ],
        "is_active": True
    },
    3: {
        "name": "Rest Day",
        "exercises": [
            "Light stretching",
            "10-minute walk",
            "Deep breathing exercises"
        ],
        "is_active": False
    },
    4: {
        "name": "Core & Cardio",
        "exercises": [
            "Plank - 3 sets of 45 seconds",
            "Mountain climbers - 3 sets of 20",
            "Russian twists - 3 sets of 15",
            "Burpees - 2 sets of 8",
            "Jumping jacks - 3 sets of 30"
        ],
        "is_active": True
    },
    5: {
        "name": "Full Body Flow",
        "exercises": [
            "Deadlifts - 3 sets of 10",
            "Push-up to T - 3 sets of 8",
            "Squat to press - 3 sets of 12",
            "Plank to downward dog - 2 sets of 10",
            "Cool down stretch - 10 minutes"
        ],
        "is_active": True
    },
    6: {
        "name": "Active Recovery",
        "exercises": [
            "Yoga flow - 20 minutes",
            "Light walking",
            "Foam rolling",
            "Meditation - 10 minutes"
        ],
        "is_active": False
    },
    7: {
        "name": "Rest Day",
        "exercises": [
            "Complete rest",
            "Gentle stretching if needed",
            "Prepare for next week"
        ],
        "is_active": False
    }
}

# Helper function to check if all habits are completed
def check_all_completed(habit_data):
    return habit_data.get('breakfast', False) and habit_data.get('lunch', False) and habit_data.get('dinner', False) and habit_data.get('gym', False)

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
            raise HTTPException(status_code=404, detail="Habit not found for this date")
        
        # Only update provided fields
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        # Update the existing habit with new data
        for key, value in update_data.items():
            existing[key] = value
        
        # Check if all habits are completed
        existing['completed_all'] = check_all_completed(existing)
        
        await db.daily_habits.replace_one({"date": date}, existing)
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
    """Get weekly progress and rewards"""
    try:
        # Get current week's habits
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_dates = [(week_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
        
        habits = await db.daily_habits.find({"date": {"$in": week_dates}}).to_list(100)
        completed_days = sum(1 for habit in habits if habit.get('completed_all', False))
        
        progress_percentage = (completed_days / 7) * 100
        
        # Determine rewards based on progress
        rewards = []
        if progress_percentage >= 25:
            rewards.append("🌟 Getting Started!")
        if progress_percentage >= 50:
            rewards.append("🔥 On Fire!")
        if progress_percentage >= 75:
            rewards.append("💎 Diamond Streak!")
        if progress_percentage == 100:
            rewards.append("👑 Perfect Week Queen!")
        
        return WeeklyProgress(
            week_start=week_start.strftime('%Y-%m-%d'),
            total_days=7,
            completed_days=completed_days,
            progress_percentage=progress_percentage,
            rewards_unlocked=rewards
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout/{day}", response_model=WorkoutDay)
async def get_workout(day: int):
    """Get workout for a specific day (1-7)"""
    try:
        if day not in WORKOUT_ROUTINE:
            raise HTTPException(status_code=404, detail="Invalid day")
        
        workout = WORKOUT_ROUTINE[day]
        return WorkoutDay(
            day=day,
            name=workout["name"],
            exercises=workout["exercises"],
            is_active=workout["is_active"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout")
async def get_all_workouts():
    """Get all workout days"""
    try:
        workouts = []
        for day in range(1, 8):
            workout = WORKOUT_ROUTINE[day]
            workouts.append(WorkoutDay(
                day=day,
                name=workout["name"],
                exercises=workout["exercises"],
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