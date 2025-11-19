# app.py

import firebase_admin
from firebase_admin import credentials, auth, firestore
from flask import Flask, jsonify
from flask_cors import CORS

# 1) Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # allow React to call this API


#2) Initialize Firebase Admin (service account)
cred = credentials.Certificate("firebase/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 3) Define routes
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

# 4) Start Flask server
if __name__ == "__main__":
    app.run(debug=True)
