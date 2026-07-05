"""
Seed script to populate initial server logs in Firestore
Run this script once to add sample server logs to the database
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_ADMIN_SDK_PATH", "firebase/serviceAccountKey.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_server_logs():
    """Add initial server logs to Firestore"""
    
    log_types = ["info", "warning", "error"]
    
    log_entries = [
        ("info", "System startup completed successfully", "System"),
        ("info", "Database connection established", "Database"),
        ("info", "User authentication successful", "Auth Service"),
        ("info", "Student account approved: student001@smarthostel.edu.my", "Admin Service"),
        ("info", "New student registration: John Doe", "Auth Service"),
        ("info", "Payment transaction completed", "Payment Service"),
        ("info", "Room allocation updated for Block A", "Room Service"),
        ("info", "Maintenance request assigned to staff", "Maintenance Service"),
        ("info", "Email notification sent successfully", "Email Service"),
        ("info", "Scheduled backup completed", "Backup Service"),
        ("info", "Cache cleared successfully", "System"),
        ("info", "API request processed: GET /api/health", "API Gateway"),
        ("warning", "High memory usage detected: 85%", "System"),
        ("warning", "Slow database query detected (>2s)", "Database"),
        ("warning", "Multiple failed login attempts detected", "Auth Service"),
        ("warning", "Email delivery delayed", "Email Service"),
        ("warning", "Low disk space warning: 15% remaining", "System"),
        ("error", "Failed to connect to external payment gateway", "Payment Service"),
        ("error", "Database connection timeout", "Database"),
        ("error", "Invalid request parameters received", "API Gateway"),
        ("error", "Email sending failed: SMTP error", "Email Service"),
        ("error", "Session expired for user", "Auth Service"),
    ]
    
    print("Seeding server logs...")
    
    # Add logs with timestamps spread over the last 7 days
    for i, (log_type, message, source) in enumerate(log_entries):
        # Create timestamps spread over the last week
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        
        timestamp = datetime.now() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
        
        log_data = {
            "timestamp": timestamp,
            "type": log_type,
            "message": message,
            "source": source
        }
        
        db.collection("server_logs").add(log_data)
        print(f"Added log {i+1}/{len(log_entries)}: [{log_type.upper()}] {message}")
    
    # Add a few more random logs
    additional_messages = [
        "User profile updated successfully",
        "Visitor registration approved",
        "Incident report submitted",
        "Room request processed",
        "Maintenance task completed",
        "System health check passed",
        "API rate limit reached",
        "File upload completed",
        "Data export requested",
        "Configuration updated"
    ]
    
    for i in range(30):
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        timestamp = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
        
        log_data = {
            "timestamp": timestamp,
            "type": random.choice(log_types),
            "message": random.choice(additional_messages),
            "source": random.choice(["System", "API Gateway", "Database", "Auth Service", "Email Service"])
        }
        
        db.collection("server_logs").add(log_data)
    
    print(f"\n[SUCCESS] Successfully seeded {len(log_entries) + 30} server logs!")
    print("You can now view these logs in the Admin Server Logs page.")

if __name__ == "__main__":
    seed_server_logs()
