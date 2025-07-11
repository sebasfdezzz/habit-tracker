#!/usr/bin/env python3
import requests
import json
import datetime
import time
import sys

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://185d52a5-e238-4b19-a2c1-9e9d4b3e25f4.preview.emergentagent.com/api"

# Test data
TODAY = datetime.datetime.now().strftime('%Y-%m-%d')
SAMPLE_BASE64_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XqoFXidXd2g=="

def test_api_health():
    """Test the root API endpoint to ensure the API is running."""
    print("\n🔍 Testing API Health...")
    response = requests.get(f"{BACKEND_URL}/")
    
    if response.status_code == 200:
        print("✅ API is healthy!")
        return True
    else:
        print(f"❌ API health check failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_daily_habit_tracking():
    """Test CRUD operations for daily habits with enhanced eating_completed flag."""
    print("\n🔍 Testing Enhanced Daily Habit Tracking API...")
    success = True
    
    # Test GET for today's date (should return default values if no entry exists)
    print(f"  Testing GET /api/habits/{TODAY}...")
    response = requests.get(f"{BACKEND_URL}/habits/{TODAY}")
    
    if response.status_code == 200:
        print(f"  ✅ Successfully retrieved habits for {TODAY}")
        print(f"  📊 Initial habit data: {response.json()}")
    else:
        print(f"  ❌ Failed to get habits with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test POST to create a new habit entry
    print(f"\n  Testing POST /api/habits...")
    habit_data = {
        "date": TODAY,
        "breakfast": True,
        "lunch": True,
        "dinner": False,
        "gym": False
    }
    
    response = requests.post(
        f"{BACKEND_URL}/habits",
        json=habit_data
    )
    
    if response.status_code == 200:
        print(f"  ✅ Successfully created habit entry")
        result = response.json()
        print(f"  📊 Created habit data: {result}")
        
        # Verify the data was saved correctly
        if (result["breakfast"] == habit_data["breakfast"] and 
            result["lunch"] == habit_data["lunch"] and
            result["dinner"] == habit_data["dinner"] and
            result["gym"] == habit_data["gym"]):
            print("  ✅ Data saved correctly")
        else:
            print("  ❌ Data mismatch in saved habit")
            success = False
            
        # Verify completed_all is calculated correctly (should be False)
        if result["completed_all"] == False:
            print("  ✅ completed_all flag calculated correctly (False)")
        else:
            print("  ❌ completed_all flag incorrect")
            success = False
            
        # Verify eating_completed is calculated correctly (should be False since dinner is False)
        if result["eating_completed"] == False:
            print("  ✅ eating_completed flag calculated correctly (False)")
        else:
            print("  ❌ eating_completed flag incorrect")
            success = False
    else:
        print(f"  ❌ Failed to create habit with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test PATCH to update dinner to True (should make eating_completed True)
    print(f"\n  Testing PATCH /api/habits/{TODAY} to complete eating...")
    update_data = {
        "dinner": True
    }
    
    response = requests.patch(
        f"{BACKEND_URL}/habits/{TODAY}",
        json=update_data
    )
    
    if response.status_code == 200:
        print(f"  ✅ Successfully updated habit entry")
        result = response.json()
        print(f"  📊 Updated habit data: {result}")
        
        # Verify eating_completed is now True (breakfast, lunch, dinner all True)
        if result["eating_completed"] == True:
            print("  ✅ eating_completed flag calculated correctly (True)")
        else:
            print("  ❌ eating_completed flag incorrect")
            success = False
            
        # Verify completed_all is still False (gym is False)
        if result["completed_all"] == False:
            print("  ✅ completed_all flag calculated correctly (False)")
        else:
            print("  ❌ completed_all flag incorrect")
            success = False
    else:
        print(f"  ❌ Failed to update habit with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test PATCH to update gym to True (should make completed_all True)
    print(f"\n  Testing PATCH /api/habits/{TODAY} to complete all habits...")
    update_data = {
        "gym": True
    }
    
    response = requests.patch(
        f"{BACKEND_URL}/habits/{TODAY}",
        json=update_data
    )
    
    if response.status_code == 200:
        print(f"  ✅ Successfully updated habit entry")
        result = response.json()
        print(f"  📊 Updated habit data: {result}")
        
        # Verify the data was updated correctly
        if (result["breakfast"] == True and 
            result["lunch"] == True and
            result["dinner"] == True and
            result["gym"] == True):
            print("  ✅ Data updated correctly")
        else:
            print("  ❌ Data mismatch in updated habit")
            success = False
            
        # Verify completed_all is calculated correctly (should be True now)
        if result["completed_all"] == True:
            print("  ✅ completed_all flag calculated correctly (True)")
        else:
            print("  ❌ completed_all flag incorrect")
            success = False
            
        # Verify eating_completed is still True
        if result["eating_completed"] == True:
            print("  ✅ eating_completed flag still True")
        else:
            print("  ❌ eating_completed flag incorrect")
            success = False
    else:
        print(f"  ❌ Failed to update habit with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test PATCH to set breakfast to False (should make eating_completed False)
    print(f"\n  Testing PATCH /api/habits/{TODAY} to make eating incomplete...")
    update_data = {
        "breakfast": False
    }
    
    response = requests.patch(
        f"{BACKEND_URL}/habits/{TODAY}",
        json=update_data
    )
    
    if response.status_code == 200:
        print(f"  ✅ Successfully updated habit entry")
        result = response.json()
        print(f"  📊 Updated habit data: {result}")
        
        # Verify eating_completed is now False
        if result["eating_completed"] == False:
            print("  ✅ eating_completed flag calculated correctly (False)")
        else:
            print("  ❌ eating_completed flag incorrect")
            success = False
            
        # Verify completed_all is now False
        if result["completed_all"] == False:
            print("  ✅ completed_all flag calculated correctly (False)")
        else:
            print("  ❌ completed_all flag incorrect")
            success = False
    else:
        print(f"  ❌ Failed to update habit with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test GET again to verify persistence
    print(f"\n  Testing GET /api/habits/{TODAY} after updates...")
    response = requests.get(f"{BACKEND_URL}/habits/{TODAY}")
    
    if response.status_code == 200:
        print(f"  ✅ Successfully retrieved updated habits")
        result = response.json()
        print(f"  📊 Retrieved habit data: {result}")
        
        # Verify all fields are set correctly
        if (result["breakfast"] == False and 
            result["lunch"] == True and
            result["dinner"] == True and
            result["gym"] == True and
            result["completed_all"] == False and
            result["eating_completed"] == False):
            print("  ✅ Data persisted correctly")
        else:
            print("  ❌ Data persistence issue")
            success = False
    else:
        print(f"  ❌ Failed to get updated habits with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    return success

def test_image_upload():
    """Test image upload functionality for gym photos."""
    print("\n🔍 Testing Image Upload for Gym Photos...")
    
    # Test PATCH with gym_photo field
    update_data = {
        "gym_photo": SAMPLE_BASE64_IMAGE
    }
    
    response = requests.patch(
        f"{BACKEND_URL}/habits/{TODAY}",
        json=update_data
    )
    
    if response.status_code == 200:
        print("  ✅ Successfully uploaded gym photo")
        result = response.json()
        
        # Verify the image was saved
        if result["gym_photo"] == SAMPLE_BASE64_IMAGE:
            print("  ✅ Image data saved correctly")
            
            # Verify retrieval
            get_response = requests.get(f"{BACKEND_URL}/habits/{TODAY}")
            if get_response.status_code == 200:
                get_result = get_response.json()
                if get_result["gym_photo"] == SAMPLE_BASE64_IMAGE:
                    print("  ✅ Image data retrieved correctly")
                    return True
                else:
                    print("  ❌ Image data retrieval mismatch")
            else:
                print(f"  ❌ Failed to retrieve habit with image with status code {get_response.status_code}")
        else:
            print("  ❌ Image data not saved correctly")
    else:
        print(f"  ❌ Failed to upload image with status code {response.status_code}")
        print(f"  Response: {response.text}")
    
    return False

def test_weekly_progress():
    """Test weekly progress tracking and reward system with separate eating/gym progress."""
    print("\n🔍 Testing Weekly Progress Tracking with Separate Eating/Gym Progress...")
    
    response = requests.get(f"{BACKEND_URL}/progress/weekly")
    
    if response.status_code == 200:
        print("  ✅ Successfully retrieved weekly progress")
        result = response.json()
        print(f"  📊 Weekly progress data: {result}")
        
        # Verify the structure of the response
        required_fields = ["week_start", "eating_progress", "gym_progress", 
                          "overall_progress", "rewards_unlocked"]
        
        for field in required_fields:
            if field not in result:
                print(f"  ❌ Missing required field: {field}")
                return False
        
        # Verify eating_progress structure
        eating_progress = result["eating_progress"]
        if not all(key in eating_progress for key in ["completed_days", "total_days", "percentage"]):
            print("  ❌ eating_progress missing required fields")
            return False
            
        # Verify gym_progress structure
        gym_progress = result["gym_progress"]
        if not all(key in gym_progress for key in ["completed_days", "total_days", "percentage"]):
            print("  ❌ gym_progress missing required fields")
            return False
            
        # Verify eating progress is tracking 7 days
        if eating_progress["total_days"] != 7:
            print(f"  ❌ eating_progress should track 7 days, got {eating_progress['total_days']}")
            return False
            
        # Verify gym progress is tracking 4 days
        if gym_progress["total_days"] != 4:
            print(f"  ❌ gym_progress should track 4 days, got {gym_progress['total_days']}")
            return False
            
        # Verify gym progress percentage is capped at 100%
        if gym_progress["completed_days"] > 4 and gym_progress["percentage"] > 100:
            print(f"  ❌ gym_progress percentage should be capped at 100%, got {gym_progress['percentage']}%")
            return False
            
        # Verify overall progress calculation (average of eating and gym progress)
        expected_overall = (eating_progress["percentage"] + gym_progress["percentage"]) / 2
        if abs(result["overall_progress"] - expected_overall) > 0.01:  # Allow small floating point difference
            print(f"  ❌ overall_progress calculation incorrect. Expected: {expected_overall}, Got: {result['overall_progress']}")
            return False
        
        # Verify reward logic
        overall_progress = result["overall_progress"]
        rewards = result["rewards_unlocked"]
        
        print(f"  📈 Overall progress: {overall_progress}%")
        print(f"  📊 Eating progress: {eating_progress['percentage']}% ({eating_progress['completed_days']}/{eating_progress['total_days']} days)")
        print(f"  📊 Gym progress: {gym_progress['percentage']}% ({gym_progress['completed_days']}/{gym_progress['total_days']} days)")
        print(f"  🏆 Rewards unlocked: {rewards}")
        
        # Check if rewards match the expected rewards based on percentage
        expected_rewards = []
        if overall_progress >= 25:
            expected_rewards.append("🌟 Getting Started!")
        if overall_progress >= 50:
            expected_rewards.append("🔥 On Fire!")
        if overall_progress >= 75:
            expected_rewards.append("💎 Diamond Streak!")
        if overall_progress >= 90:
            expected_rewards.append("👑 Perfect Week Queen!")
        
        if set(rewards) == set(expected_rewards):
            print("  ✅ Rewards calculated correctly")
            return True
        else:
            print(f"  ❌ Reward mismatch. Expected: {expected_rewards}, Got: {rewards}")
            return False
    else:
        print(f"  ❌ Failed to get weekly progress with status code {response.status_code}")
        print(f"  Response: {response.text}")
        return False

def test_gym_routine_data():
    """Test gym routine data API endpoints."""
    print("\n🔍 Testing Gym Routine Data API...")
    success = True
    
    # Test GET all workout days
    print("  Testing GET /api/workout...")
    response = requests.get(f"{BACKEND_URL}/workout")
    
    if response.status_code == 200:
        print("  ✅ Successfully retrieved all workout days")
        workouts = response.json()
        print(f"  📊 Found {len(workouts)} workout days")
        
        # Verify we have 7 days
        if len(workouts) != 7:
            print(f"  ❌ Expected 7 workout days, got {len(workouts)}")
            success = False
        
        # Check active days (1, 2, 4, 5 should be active)
        active_days = [workout["day"] for workout in workouts if workout["is_active"]]
        expected_active_days = [1, 2, 4, 5]
        
        if set(active_days) == set(expected_active_days):
            print(f"  ✅ Active days match expected: {active_days}")
        else:
            print(f"  ❌ Active days mismatch. Expected: {expected_active_days}, Got: {active_days}")
            success = False
    else:
        print(f"  ❌ Failed to get all workouts with status code {response.status_code}")
        print(f"  Response: {response.text}")
        success = False
    
    # Test GET for specific days
    for day in range(1, 8):
        print(f"\n  Testing GET /api/workout/{day}...")
        response = requests.get(f"{BACKEND_URL}/workout/{day}")
        
        if response.status_code == 200:
            print(f"  ✅ Successfully retrieved workout for day {day}")
            workout = response.json()
            
            # Verify the day number
            if workout["day"] != day:
                print(f"  ❌ Day number mismatch. Expected: {day}, Got: {workout['day']}")
                success = False
            
            # Verify active status for days 1, 2, 4, 5
            expected_active = day in [1, 2, 4, 5]
            if workout["is_active"] == expected_active:
                print(f"  ✅ Active status correct for day {day}: {workout['is_active']}")
            else:
                print(f"  ❌ Active status incorrect for day {day}. Expected: {expected_active}, Got: {workout['is_active']}")
                success = False
                
            # Verify workout has exercises
            if len(workout["exercises"]) > 0:
                print(f"  ✅ Day {day} has {len(workout['exercises'])} exercises")
            else:
                print(f"  ❌ Day {day} has no exercises")
                success = False
        else:
            print(f"  ❌ Failed to get workout for day {day} with status code {response.status_code}")
            print(f"  Response: {response.text}")
            success = False
    
    return success

def run_all_tests():
    """Run all tests and report results."""
    print("\n==================================================")
    print("🧪 STARTING BACKEND API TESTS")
    print("==================================================")
    
    # Track test results
    results = {}
    
    # Test API health
    results["API Health"] = test_api_health()
    
    # Test daily habit tracking
    results["Daily Habit Tracking"] = test_daily_habit_tracking()
    
    # Test image upload
    results["Image Upload"] = test_image_upload()
    
    # Test weekly progress
    results["Weekly Progress"] = test_weekly_progress()
    
    # Test gym routine data
    results["Gym Routine Data"] = test_gym_routine_data()
    
    # Print summary
    print("\n==================================================")
    print("📋 TEST RESULTS SUMMARY")
    print("==================================================")
    
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if not result:
            all_passed = False
        print(f"{test_name}: {status}")
    
    print("\n==================================================")
    if all_passed:
        print("🎉 ALL TESTS PASSED! The backend API is working correctly.")
    else:
        print("⚠️ SOME TESTS FAILED. Please check the logs above for details.")
    print("==================================================")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()