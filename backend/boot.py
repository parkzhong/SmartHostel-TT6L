import sys
import subprocess
import os

def install(package):
    print(f"Installing {package}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import dotenv
    print("python-dotenv is already installed.")
except ImportError:
    print("python-dotenv not found. Installing...")
    install("python-dotenv")

try:
    import flask
    import flask_cors
    import firebase_admin
except ImportError:
    print("Missing other dependencies. Installing requirements...")
    install("flask")
    install("flask-cors")
    install("firebase-admin")

print("Starting app.py in a new process...")
# Run app.py in a separate process to ensure new packages are loaded
subprocess.check_call([sys.executable, "app.py"])
