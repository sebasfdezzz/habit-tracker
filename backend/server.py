from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, date, timedelta
import base64
import calendar

# test auto deploy 2
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
class ExerciseCompletion(BaseModel):
    exercise_name: str
    completed: bool = False
    timestamp: Optional[datetime] = None

class WorkoutSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    workout_day: int  # 1-4
    workout_name: str
    exercises: List[ExerciseCompletion] = []
    completed: bool = False
    completion_percentage: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WorkoutSessionCreate(BaseModel):
    date: str
    workout_day: int

class ExerciseUpdate(BaseModel):
    exercise_name: str
    completed: bool

class WeeklyProgress(BaseModel):
    week_start: str
    completed_workouts: int
    total_target: int  # 4 workouts per week
    progress_percentage: float
    workout_days_completed: List[int]
    rewards_unlocked: List[str]

class MonthlyProgress(BaseModel):
    month: str  # YYYY-MM format
    total_workouts: int
    completed_workouts: int
    progress_percentage: float
    current_streak: int
    longest_streak: int
    rewards_unlocked: List[str]

class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    last_workout_date: Optional[str]

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    description: str
    video_placeholder: str  # Placeholder for upcoming video

class WorkoutDay(BaseModel):
    day: int
    name: str
    exercises: List[Exercise]
    is_active: bool

# Enhanced Workout routine data
WORKOUT_ROUTINE = {
    1: {
        "name": "Leg Day 1",
        "exercises": [
            {
                "name": "Hip Abductor Machine",
                "sets": 4,
                "reps": 15,
                "description": "Push legs outward to work outer glutes",
                "video_placeholder": "Leg1/Abductor"
            },
            {
                "name": "Hip Adductor Machine", 
                "sets": 4,
                "reps": 15,
                "description": "Squeeze legs inward for inner thighs",
                "video_placeholder": "Leg1/Adductor"
            },
            {
                "name": "Hip Thrust",
                "sets": 4,
                "reps": 15,
                "description": "Lift hips using glutes and hamstrings",
                "video_placeholder": "Leg1/HipThrust"
            },
            {
                "name": "Romanian Deadlift",
                "sets": 4,
                "reps": 15,
                "description": "Lower weights with slight bend for hamstrings",
                "video_placeholder": "Leg1/Deadlift"
            },
            {
                "name": "Goblet Squats",
                "sets": 4,
                "reps": 15,
                "description": "Hold weight and squat for legs and glutes",
                "video_placeholder": "Leg1/GobletSquats"
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
                "description": "Pull bar to chest to target lats",
                "video_placeholder": "Pull/Pulldown"
            },
            {
                "name": "Seated Cable Row",
                "sets": 4,
                "reps": 15,
                "description": "Seating, pull cable to waist for mid-back",
                "video_placeholder": "Pull/CableRow"
            },
            {
                "name": "Single-Arm Dumbbell Row",
                "sets": 4,
                "reps": 15,
                "description": "Unilateral dumbbell row for back and lats",
                "video_placeholder": "Pull/DumbellRow"
            },
            {
                "name": "Hammer Curls",
                "sets": 4,
                "reps": 15,
                "description": "Neutral grip bicep curls",
                "video_placeholder": "Pull/Hammers"
            },
            {
                "name": "Lying Bicep Curls",
                "sets": 4,
                "reps": 15,
                "description": "Curl weights while lying 45 degrees",
                "video_placeholder": "Pull/LyingCurls"
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
                "reps": 45,
                "description": "45 sec: hold squat against wall for time",
                "video_placeholder": "Leg2/WallSit"
            },
            {
                "name": "Donkey Kicks",
                "sets": 4,
                "reps": 15,
                "description": "Kick back while on all fours for glutes",
                "video_placeholder": "Leg2/DonkeyKicks"
            },
            {
                "name": "Lateral Donkey Kicks",
                "sets": 4,
                "reps": 15,
                "description": "Kick leg sideways for hip and glutes",
                "video_placeholder": "Leg2/LateralDonkeyKicks"
            },
            {
                "name": "Standing Calf Raises",
                "sets": 4,
                "reps": 20,
                "description": "Raise heels to work calves",
                "video_placeholder": "Leg2/CalfRaises"
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
                "description": "Press weight overhead for shoulders",
                "video_placeholder": "Push/MilitaryPress"
            },
            {
                "name": "Lateral Raises",
                "sets": 4,
                "reps": 15,
                "description": "Raise dumbells to the side",
                "video_placeholder": "Push/LateralRaises"
            },
            {
                "name": "Bench Dips",
                "sets": 4,
                "reps": 15,
                "description": "Lower body on bench to hit triceps",
                "video_placeholder": "Push/BenchDips"
            },
            {
                "name": "Cable Rope Pushdown",
                "sets": 4,
                "reps": 15,
                "description": "Tricep pushdown with rope attachment",
                "video_placeholder": "Push/CablePushdown"
            },
            {
                "name": "Incline Push-ups",
                "sets": 4,
                "reps": 10,
                "description": "Push-ups on postive incline for chest/triceps",
                "video_placeholder": "Push/InclinePushUps"
            }
        ],
        "is_active": True
    },
    5: {
        "name": "Core",
        "exercises": [
            {
                "name": "Flutter Kicks",
                "sets": 3,
                "reps": 50,
                "description": "Kick your legs alternately while keeping them straight.",
                "video_placeholder": "Core/FlutterKicks"
            },
            {
                "name": "Leg Raises",
                "sets": 3,
                "reps": 12,
                "description": "Lift your legs to 90 degrees and lower slowly.",
                "video_placeholder": "Core/LegRaises"
            },
            {
                "name": "Crunches",
                "sets": 3,
                "reps": 15,
                "description": "Lift your upper body towards your knees.",
                "video_placeholder": "Core/Crunches"
            },
            {
                "name": "Sit Ups",
                "sets": 3,
                "reps": 15,
                "description": "Complete sit-ups with full range of motion.",
                "video_placeholder": "Core/SitUps"
            },
            {
                "name": "Bicycle Kicks",
                "sets": 3,
                "reps": 40,
                "description": "Alternate legs like pedaling a bicycle.",
                "video_placeholder": "Core/BicycleKicks"
            },
            {
                "name": "Plank",
                "sets": 2,
                "reps": 60,
                "description": "Hold a straight body position on your forearms.",
                "video_placeholder": "Core/Plank"
            }
        ],
        "is_active": True
    }
}

# Helper functions
def calculate_completion_percentage(exercises):
    if not exercises:
        return 0.0
    completed = sum(1 for ex in exercises if ex.completed)
    return (completed / len(exercises)) * 100

def is_workout_complete(exercises):
    return all(ex.completed for ex in exercises)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Gym Tracker API is running! 💪"}

@api_router.post("/workout-session", response_model=WorkoutSession)
async def create_workout_session(session_data: WorkoutSessionCreate):
    """Create a new workout session for a specific date and workout day"""
    try:
        # Check if session already exists for this date
        existing = await db.workout_sessions.find_one({
            "date": session_data.date,
            "workout_day": session_data.workout_day
        })
        
        if existing:
            return WorkoutSession(**existing)
        
        # Get workout routine
        if session_data.workout_day not in WORKOUT_ROUTINE:
            raise HTTPException(status_code=400, detail="Invalid workout day")
        
        routine = WORKOUT_ROUTINE[session_data.workout_day]
        
        # Create exercise completions
        exercises = [
            ExerciseCompletion(exercise_name=ex["name"], completed=False)
            for ex in routine["exercises"]
        ]
        
        # Create session
        session = WorkoutSession(
            date=session_data.date,
            workout_day=session_data.workout_day,
            workout_name=routine["name"],
            exercises=exercises,
            completed=False,
            completion_percentage=0.0
        )
        
        await db.workout_sessions.insert_one(session.dict())
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/workout-session/{date}/{workout_day}/exercise")
async def update_exercise_completion(date: str, workout_day: int, exercise_update: ExerciseUpdate):
    """Update completion status of a specific exercise"""
    try:
        session = await db.workout_sessions.find_one({
            "date": date,
            "workout_day": workout_day
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Workout session not found")
        
        # Update exercise completion
        updated = False
        for exercise in session["exercises"]:
            if exercise["exercise_name"] == exercise_update.exercise_name:
                exercise["completed"] = exercise_update.completed
                exercise["timestamp"] = datetime.utcnow() if exercise_update.completed else None
                updated = True
                break
        
        if not updated:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        # Recalculate completion stats
        exercises = [ExerciseCompletion(**ex) for ex in session["exercises"]]
        session["completion_percentage"] = calculate_completion_percentage(exercises)
        session["completed"] = is_workout_complete(exercises)
        
        await db.workout_sessions.replace_one(
            {"date": date, "workout_day": workout_day}, 
            session
        )
        
        return WorkoutSession(**session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout-session/{date}/{workout_day}", response_model=WorkoutSession)
async def get_workout_session(date: str, workout_day: int):
    """Get workout session for a specific date and workout day"""
    try:
        session = await db.workout_sessions.find_one({
            "date": date,
            "workout_day": workout_day
        })
        
        if not session:
            # Create default session
            create_data = WorkoutSessionCreate(date=date, workout_day=workout_day)
            return await create_workout_session(create_data)
        
        return WorkoutSession(**session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/workout-sessions/{date}")
async def get_all_sessions_for_date(date: str):
    """Get all workout sessions for a specific date"""
    try:
        sessions = await db.workout_sessions.find({"date": date}).to_list(10)
        return [WorkoutSession(**session) for session in sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/weekly")
async def get_weekly_progress():
    """Get weekly gym progress"""
    try:
        # Get current week's sessions
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_dates = [(week_start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
        
        sessions = await db.workout_sessions.find({
            "date": {"$in": week_dates},
            "completed": True
        }).to_list(100)
        
        completed_workouts = len(sessions)
        workout_days_completed = list(set(session["workout_day"] for session in sessions))
        
        progress_percentage = (completed_workouts / 4) * 100  # 4 workouts target per week
        progress_percentage = min(progress_percentage, 100)  # Cap at 100%
        
        # Determine rewards based on progress
        rewards = []
        if completed_workouts >= 1:
            rewards.append("🌟 First Workout!")
        if completed_workouts >= 2:
            rewards.append("🔥 Getting Strong!")
        if completed_workouts >= 3:
            rewards.append("💎 Almost There!")
        if completed_workouts >= 4:
            rewards.append("👑 Workout Queen!")
        
        return WeeklyProgress(
            week_start=week_start.strftime('%Y-%m-%d'),
            completed_workouts=completed_workouts,
            total_target=4,
            progress_percentage=progress_percentage,
            workout_days_completed=workout_days_completed,
            rewards_unlocked=rewards
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/monthly")
async def get_monthly_progress():
    """Get monthly gym progress"""
    try:
        today = datetime.now().date()
        month_start = today.replace(day=1)
        
        # Get days in current month
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        
        # Calculate target workouts for month (4 per week)
        weeks_in_month = (days_in_month // 7) + (1 if days_in_month % 7 > 0 else 0)
        target_workouts = weeks_in_month * 4
        
        # Get completed workouts this month
        sessions = await db.workout_sessions.find({
            "date": {"$regex": f"^{today.strftime('%Y-%m')}"},
            "completed": True
        }).to_list(1000)
        
        completed_workouts = len(sessions)
        progress_percentage = (completed_workouts / target_workouts) * 100 if target_workouts > 0 else 0
        
        # Calculate streak
        streak_info = await get_streak_info()
        
        # Monthly rewards
        rewards = []
        if completed_workouts >= 2:
            rewards.append("🎯 Month Started!")
        if completed_workouts >= 6:
            rewards.append("💪 Strong Month!")
        if completed_workouts >= 10:
            rewards.append("🔥 Excellent Month!")
        if completed_workouts >= 14:
            rewards.append("👑 Amazing Month!")
        if progress_percentage >= 90:
            rewards.append("🏆 Perfect Month!")
        
        return MonthlyProgress(
            month=today.strftime('%Y-%m'),
            total_workouts=target_workouts,
            completed_workouts=completed_workouts,
            progress_percentage=progress_percentage,
            current_streak=streak_info.current_streak,
            longest_streak=streak_info.longest_streak,
            rewards_unlocked=rewards
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/progress/streak")
async def get_streak_info():
    """Get current and longest workout streak"""
    try:
        # Get all completed workout sessions grouped by date
        sessions = await db.workout_sessions.find({"completed": True}).sort("date", 1).to_list(1000)
        
        if not sessions:
            return StreakInfo(current_streak=0, longest_streak=0, last_workout_date=None)
        
        # Group by date and count unique workout days per date
        workout_dates = {}
        for session in sessions:
            date = session["date"]
            if date not in workout_dates:
                workout_dates[date] = set()
            workout_dates[date].add(session["workout_day"])
        
        # Get dates where at least one workout was completed
        completed_dates = sorted(workout_dates.keys())
        
        if not completed_dates:
            return StreakInfo(current_streak=0, longest_streak=0, last_workout_date=None)
        
        # Calculate current streak from today backwards
        current_streak = 0
        today = datetime.now().date()
        current_date = today
        
        while current_date.strftime('%Y-%m-%d') in completed_dates:
            current_streak += 1
            current_date -= timedelta(days=1)
        
        # Calculate longest streak
        longest_streak = 0
        temp_streak = 1
        
        if len(completed_dates) > 0:
            for i in range(1, len(completed_dates)):
                prev_date = datetime.strptime(completed_dates[i-1], '%Y-%m-%d').date()
                curr_date = datetime.strptime(completed_dates[i], '%Y-%m-%d').date()
                
                if curr_date - prev_date == timedelta(days=1):
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
        
        return StreakInfo(
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_workout_date=completed_dates[-1] if completed_dates else None
        )
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
    """Get all workout days (1-5)"""
    try:
        workouts = []
        for day in range(1, 6):
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