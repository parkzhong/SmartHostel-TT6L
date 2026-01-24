# app.py

import firebase_admin
from firebase_admin import credentials, auth, firestore
from flask import Flask, jsonify, request
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
import re
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
load_dotenv()

# 1) Initialize Flask app
app = Flask(__name__)
CORS(app, 
     resources={r"/api/*":{"origins": ["http://localhost:3000", "http://127.0.0.1:3000"] }},
    allow_headers=["Content-Type", "Authorization"],
    methods = ["GET", "POST", "OPTIONS"]) # allow React to call this API


#2) Initialize Firebase Admin (service account)
cred = credentials.Certificate("firebase/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


def make_student_email(full_name: str, domain: str = "student.mme.edu.my") -> str:
    base = re.sub(r"[^a-z0-9]+", ".", (full_name or "").lower()).strip(".")
    if not base:
        base = "student"
    #uid suffixto avoid duplicates
    for n in range(1,1000):
        local = base if n == 1 else f"{base}{n}"
        candidate = f"{local}@{domain}"

        try:
            auth.get_user_by_email(candidate)
            continue
        except auth.UserNotFoundError:
            return candidate
        except Exception as e:
            raise RuntimeError (f"Email check failed: {e}")
        
    raise RuntimeError("Could not generate unique student email (too many duplicates)")

def send_approval_email(to_email, full_name, student_email, reset_link):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_app_password = os.getenv("SMTP_APP_PASSWORD")

    if not smtp_email or not smtp_app_password:
        raise RuntimeError("SMTP credentials not found")

    msg = EmailMessage()
    msg["Subject"] = "Smart Hostel - Student Account Approved"
    msg["From"] = smtp_email
    msg["To"] = to_email

    msg.set_content(f"""
    Hello {full_name},

    Congratulations! Your student account has been approved.

    This is your student email: {student_email}

    Please set your password using the link below:
    {reset_link}

    Please change your password after logging in for the first time.

    Best regards,
    Smart Hostel Management System
    """)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(smtp_email, smtp_app_password)
        smtp.send_message(msg)

def send_maintenance_completed_email(to_email, student_name, category, location, note):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_app_password = os.getenv("SMTP_APP_PASSWORD")

    if not smtp_email or not smtp_app_password:
        raise RuntimeError("SMTP credentials not found")

    msg = EmailMessage()
    msg["Subject"] = "Maintenance Completed - Smart Hostel"
    msg["From"] = smtp_email
    msg["To"] = to_email

    msg.set_content(f"""
Hello {student_name},

Your maintenance request has been completed.

Category:
{category}

Location:
{location}

Maintenance Note:
{note or "No additional notes"}

If you experience further issues, please submit a new maintenance request.

Thank you,
Smart Hostel Management System
""")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(smtp_email, smtp_app_password)
        smtp.send_message(msg)

def get_uid_from_bearer():
    header = request.headers.get("Authorization","")
    if not header.startswith("Bearer "):
        return None, ("Missing Bearer token",401)
    
    token = header.split("Bearer ")[1].strip()
    try:
        decoded = auth.verify_id_token(token)
        return decoded["uid"], None
    except Exception as e:
        return None, (str(e),401)
    
def require_active_role(uid: str, role: str):
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        return None, ("User profile not found", 404)

    user = snap.to_dict()
    if (user.get("role") or "").lower() != role.lower():
        return None, ("Forbidden (wrong role)", 403)

    if (user.get("status") or "").lower() != "active":
        return None, ("Account not active", 403)

    return user, None

def require_warden():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, (jsonify({"error": "Missing Bearer token"}), 401)

    token = header.split("Bearer ")[1].strip()

    try:
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]
    except Exception as e:
        return None, (jsonify({"error": f"Invalid token: {str(e)}"}), 401)

    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        return None, (jsonify({"error": "No user profile found"}), 403)

    profile = snap.to_dict()
    if (profile.get("role") or "").lower() != "warden":
        return None, (jsonify({"error": "Forbidden: not warden"}), 403)

    if (profile.get("status") or "").lower() != "active":
        return None, (jsonify({"error": "Warden account not active"}), 403)

    return {"uid": uid, "profile": profile}, None

def require_admin():
    uid, err = get_uid_from_bearer()
    if err:
        return None, err
    
    _, role_err = require_active_role(uid, "admin")
    if role_err:
        return None, (role_err[0], role_err[1])
    
    return uid, None

def require_maintenance_staff(uid: str):
    return require_active_role(uid, "maintenance_staff")

def now_ts():
    return firestore.SERVER_TIMESTAMP

# 3) Define routes
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/student/register-profile", methods=["POST"])
def register_profile():
    # read bearer token
    header = request.headers.get("Authorization")
    if not header.startswith("Bearer "):
        return jsonify({"error": "Missing Bearer token"}), 401
    
    token = header.split("Bearer ")[1].strip()

    # verify token -> get uid
    try:
        decoded = auth.verify_id_token(token)
        uid = decoded["uid"]
    except Exception as e:
        print("verify_id_token error:", e)
        return jsonify({"error": str(e)}), 401

    data = request.json or {}
    if not (data.get("fullName") or "").strip():
        return jsonify({"error": "fullName is required"}), 400
    
    if not (data.get("personalEmail") or "").strip():
        return jsonify({"error": "personalEmail is required"}), 400


    # create Firestore profile as pending
    db.collection("users").document(uid).set({
        "fullName": data["fullName"].strip(),
        "personalEmail": data["personalEmail"].strip().lower(),
        "role": "student",
        "createdAt": datetime.utcnow().isoformat(),
        "status": "pending"
    }, merge=True)

    return jsonify({"ok": True, "uid" : uid}), 201

@app.route("/api/admin/pending-students", methods=["GET"])
def admin_pending_students():
    uid, err = require_admin()
    if err:
        return jsonify({"error": err[0]}), err[1]
    students = []

    query = (
        db.collection("users")
        .where("role", "==", "student")
        .where("status", "in", ["pending","email_failed","approving"])
        .stream()
    )

    for doc in query:
        data = doc.to_dict()
        data["uid"] = doc.id
        students.append(data)

    return jsonify(students)

@app.route("/api/debug/verify", methods=["POST"])
def debug_verify():
    header = request.headers.get("Authorization", "")
    token = header.replace("Bearer ", "").strip()

    try:
        decoded = auth.verify_id_token(token)
        return jsonify({"ok": True, "uid": decoded.get("uid"), "email": decoded.get("email")})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e), "header": header[:60]}), 401
    
@app.route("/api/admin/approve-student", methods=["POST"])
def approve_student():
    uid_admin, err = require_admin()
    if err: 
        return jsonify({"error": err[0]}), err[1]
    
    data = request.json or {}
    uid = (data.get("uid") or "").strip()

    if not uid:
        return jsonify({"error": "uid is required"}), 400

    #read student doc
    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    if not snap.exists:
        return jsonify({"error": "student not found in users"}), 404
    
    student = snap.to_dict()
    full_name = (student.get("fullName", "") or "").strip()
    personal_email = (student.get("personalEmail", "") or "").strip()

    if not full_name:
        return jsonify({"error": "fullName is missing in users doc"}), 400
    if not personal_email:
        return jsonify({"error": "personalEmail is missing in users doc"}), 400
    
    # generate student email
    student_email = make_student_email(full_name)

    # Mark as "approving" in firestore first
    doc_ref.set({
        "status": "approving",
        "studentEmail": student_email,
        "approvingAt": datetime.utcnow().isoformat(),
        "lastError": firestore.DELETE_FIELD  # clear old error if any
    }, merge=True)

    try:
        # update Firebase Auth email
        auth.update_user(uid, email=student_email)

        # generate password reset link
        reset_link = auth.generate_password_reset_link(student_email)

        # send email to student's personal Gmail
        send_approval_email(personal_email, full_name, student_email, reset_link)

        # update Firestore status
        doc_ref.set({
            "studentEmail": student_email,
            "status": "active",
            "activatedAt": datetime.utcnow().isoformat(),
            "resetLinkSent": True,
        }, merge=True)

        return jsonify({
            "ok": True,
            "uid": uid,
            "studentEmail": student_email,
            "resetLink": reset_link
        })
    
    except Exception as e:
        err_msg = str(e)

        # A) Update Firestore so admin can see it failed (and can retry later)
        doc_ref.set({
            "status": "email_failed",
            "lastError": err_msg,
            "resetLinkSent": False,
            "failedAt": datetime.utcnow().isoformat()
        }, merge=True)

        # B) OPTIONAL rollback: revert Firebase Auth email back to personal email
        # This keeps account consistent if email sending failed.
        try:
            auth.update_user(uid, email=personal_email)
            doc_ref.set({"status": "pending"}, merge=True)
        except Exception as rollback_err:
            # If rollback fails, we keep email_failed and store rollback error too
            doc_ref.set({"rollbackError": str(rollback_err)}, merge=True)

        return jsonify({"error": err_msg}), 500
    
    
@app.route("/api/admin/reject-student", methods=["POST"])
def reject_student():
    uid_admin, err = require_admin()
    if err: 
        return jsonify({"error": err[0]}), err[1]
    
    data = request.json or {}
    uid = (data.get("uid") or "").strip()
    reason = (data.get("reason") or "Rejected by admin").strip()

    if not uid:
        return jsonify({"error": "uid is required"}), 400

    
    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    if not snap.exists:
        return jsonify({"error": "student not found"}), 404
    
    doc_ref.set({
        "status": "rejected",
        "rejectReason": reason
    }, merge=True)

    return jsonify({"ok": True, "uid": uid})

@app.route("/api/admin/retry-approval-email", methods=["POST"])
def retry_approval_email():
    uid_admin, err = require_admin()
    if err: 
        return jsonify({"error": err[0]}), err[1]
    
    data = request.json or {}
    uid = (data.get("uid") or "").strip()
    if not uid:
        return jsonify({"error": "uid is required"}), 400

    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    if not snap.exists:
        return jsonify({"error": "student not found"}), 404

    student = snap.to_dict()
    full_name = (student.get("fullName") or "").strip()
    personal_email = (student.get("personalEmail") or "").strip()
    student_email = (student.get("studentEmail") or "").strip()
    status = (student.get("status") or "").strip()

    if not full_name or not personal_email:
        return jsonify({"error": "Missing fullName/personalEmail in user doc"}), 400

    # If studentEmail not saved yet, generate it
    if not student_email:
        student_email = make_student_email(full_name)
        doc_ref.set({"studentEmail": student_email}, merge=True)

    try:
        # Make sure Auth email is set correctly (safe)
        auth.update_user(uid, email=student_email)

        # Generate a NEW reset link each retry
        reset_link = auth.generate_password_reset_link(student_email)

        # Send email again
        send_approval_email(personal_email, full_name, student_email, reset_link)

        # Update status after successful resend
        doc_ref.set({
            "status": "active",
            "resetLinkSent": True,
            "lastError": firestore.DELETE_FIELD,
            "retriedAt": datetime.utcnow().isoformat()
        }, merge=True)

        return jsonify({
            "ok": True,
            "uid": uid,
            "studentEmail": student_email,
            "resetLink": reset_link
        })

    except Exception as e:
        doc_ref.set({
            "status": "email_failed",
            "lastError": str(e),
            "resetLinkSent": False,
            "retriedAt": datetime.utcnow().isoformat()
        }, merge=True)
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/student/request-room", methods=["POST"])
def student_request_room():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]
    
    # check student profile + active
    user_snap = db.collection("users").document(uid).get()
    if not user_snap.exists:
        return jsonify({"error": "user profile not found"}), 404
    
    user = user_snap.to_dict()
    if (user.get("role") != "student") or ((user.get("status") or "").lower() != "active"):
        return jsonify({"error": "Only active students can request rooms"}), 403

    data = request.json or {}
    room_type = (data.get("roomType") or "").strip()
    reason = (data.get("reason") or "").strip()

    if not room_type:
        return jsonify({"error": "roomType is required"}), 400

    # Save room request in Firestore
    doc_ref = db.collection("room_requests").document()
    doc_ref.set({
        "requestId": doc_ref.id,
        "studentUid": uid,
        "studentName": user.get("fullName",""),
        "studentEmail": user.get("studentEmail", user.get("personalEmail","")),
        "roomType": room_type,
        "reason": reason,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "pending_warden"
    })

    return jsonify({"ok": True, "requestId": doc_ref.id}), 201

@app.route("/api/student/my-room-requests", methods=["GET"])
def student_my_room_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    # fetch requests
    results = []
    q = (
        db.collection("room_requests")
        .where("studentUid", "==", uid)
        .stream()
    )

    for doc in q:
        d = doc.to_dict()
        results.append(d)

    # sort newest first (simple)
    results.sort(key=lambda x: x.get("createdAt",""), reverse=True)

    return jsonify(results)

@app.route("/api/warden/pending-room-requests", methods=["GET"])
def warden_pending_room_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = (
        db.collection("room_requests")
        .where("status", "==", "pending_warden")
        .stream()
    )

    for doc in q:
        d = doc.to_dict()
        results.append(d)

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)

@app.route("/api/warden/approve-room-request", methods=["POST"])
def warden_approve_room_request():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    allocation = (data.get("allocation") or "").strip()  # e.g., "Block A - Room 203"
    remark = (data.get("remark") or "").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400
    if not allocation:
        return jsonify({"error": "allocation is required"}), 400

    req_ref = db.collection("room_requests").document(request_id)
    snap = req_ref.get()
    if not snap.exists:
        return jsonify({"error": "room request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending"}), 400

    req_ref.set({
        "status": "approved",
        "allocation": allocation,
        "wardenRemark": remark,
        "approvedBy": uid,
        "approvedByName": warden.get("fullName", ""),
        "approvedAt": datetime.utcnow().isoformat()
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})

@app.route("/api/warden/reject-room-request", methods=["POST"])
def warden_reject_room_request():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    reason = (data.get("reason") or "Rejected by warden").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400

    req_ref = db.collection("room_requests").document(request_id)
    snap = req_ref.get()
    if not snap.exists:
        return jsonify({"error": "room request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending"}), 400

    req_ref.set({
        "status": "rejected",
        "wardenRejectReason": reason,
        "rejectedBy": uid,
        "rejectedByName": warden.get("fullName", ""),
        "rejectedAt": datetime.utcnow().isoformat()
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})

@app.route("/api/warden/room-analytics", methods=["GET"])
def warden_room_analytics():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    # Fetch all room_requests (prototype-friendly)
    docs = db.collection("room_requests").stream()

    total = 0
    by_status = {"pending_warden": 0, "approved": 0, "rejected": 0, "other": 0}
    by_room_type = {}
    last7_total = 0

    approval_seconds = []  # for avg approval time

    now = datetime.now(timezone.utc)
    last7 = now - timedelta(days=7)

    def parse_iso(s):
        if not s:
            return None
        try:
            # accept "2026-01-23T12:34:56.123456" or with Z
            s = s.replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except:
            return None

    for doc in docs:
        r = doc.to_dict() or {}
        total += 1

        status = (r.get("status") or "").strip()
        if status in by_status:
            by_status[status] += 1
        else:
            by_status["other"] += 1

        room_type = (r.get("roomType") or "Unknown").strip()
        by_room_type[room_type] = by_room_type.get(room_type, 0) + 1

        created = parse_iso(r.get("createdAt"))
        if created and created >= last7:
            last7_total += 1

        # avg approval time (createdAt -> approvedAt)
        if status == "approved":
            approved = parse_iso(r.get("approvedAt"))
            if created and approved and approved >= created:
                approval_seconds.append((approved - created).total_seconds())

    avg_approval_hours = None
    if approval_seconds:
        avg_approval_hours = round(sum(approval_seconds) / len(approval_seconds) / 3600, 2)

    # sort room types
    top_room_types = sorted(by_room_type.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        "totalRequests": total,
        "byStatus": by_status,
        "last7DaysRequests": last7_total,
        "avgApprovalHours": avg_approval_hours,   # null if none yet
        "topRoomTypes": [{"roomType": k, "count": v} for k, v in top_room_types],
    })

@app.route("/api/warden/room-requests-summary", methods=["GET"])
def warden_room_requests_summary():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    docs = db.collection("room_requests").stream()

    total = 0
    pending = 0
    approved = 0
    rejected = 0

    for d in docs:
        total += 1
        s = (d.to_dict().get("status") or "").lower()
        if s == "pending_warden":
            pending += 1
        elif s == "approved":
            approved += 1
        elif s == "rejected":
            rejected += 1

    return jsonify({
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    })

@app.route("/api/student/request-maintenance", methods=["POST"])
def student_request_maintenance():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    # check student profile + active
    user_snap = db.collection("users").document(uid).get()
    if not user_snap.exists:
        return jsonify({"error": "user profile not found"}), 404

    user = user_snap.to_dict()
    if (user.get("role") != "student") or ((user.get("status") or "").lower() != "active"):
        return jsonify({"error": "Only active students can request maintenance"}), 403

    data = request.json or {}
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()
    description = (data.get("description") or "").strip()
    priority = (data.get("priority") or "normal").strip().lower()

    if not category:
        return jsonify({"error": "category is required"}), 400
    if not location:
        return jsonify({"error": "location is required"}), 400
    if not description:
        return jsonify({"error": "description is required"}), 400

    if priority not in ["low", "normal", "high"]:
        priority = "normal"

    doc_ref = db.collection("maintenance_requests").document()
    doc_ref.set({
        "requestId": doc_ref.id,
        "studentUid": uid,
        "studentName": user.get("fullName", ""),
        "studentEmail": user.get("studentEmail", user.get("personalEmail", "")),
        "category": category,
        "location": location,
        "description": description,
        "priority": priority,

        # workflow fields (warden/staff will update later)
        "status": "pending_warden",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    })

    return jsonify({"ok": True, "requestId": doc_ref.id}), 201


@app.route("/api/student/my-maintenance-requests", methods=["GET"])
def student_my_maintenance_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    results = []
    q = (
        db.collection("maintenance_requests")
        .where("studentUid", "==", uid)
        .stream()
    )

    for doc in q:
        results.append(doc.to_dict())

    # newest first
    results.sort(key=lambda x: x.get("updatedAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)

@app.route("/api/warden/maintenance-staff", methods=["GET"])
def warden_list_maintenance_staff():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    staff = []
    q = (
        db.collection("users")
        .where("role", "==", "maintenance_staff")
        .where("status", "==", "active")
        .stream()
    )

    for doc in q:
        d = doc.to_dict()
        staff.append({
            "uid": doc.id,
            "fullName": d.get("fullName", ""),
            "email": d.get("email", d.get("studentEmail", d.get("personalEmail", ""))),
        })

    return jsonify(staff)

@app.route("/api/warden/pending-maintenance-requests", methods=["GET"])
def warden_pending_maintenance_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = (
        db.collection("maintenance_requests")
        .where("status", "==", "pending_warden")
        .stream()
    )

    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)

@app.route("/api/warden/assign-maintenance-request", methods=["POST"])
def warden_assign_maintenance_request():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    staff_uid = (data.get("staffUid") or "").strip()
    remark = (data.get("remark") or "").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400
    if not staff_uid:
        return jsonify({"error": "staffUid is required"}), 400

    req_ref = db.collection("maintenance_requests").document(request_id)
    snap = req_ref.get()
    if not snap.exists:
        return jsonify({"error": "maintenance request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending_warden"}), 400

    # validate staff exists + active maintenance
    staff_snap = db.collection("users").document(staff_uid).get()
    if not staff_snap.exists:
        return jsonify({"error": "maintenance staff not found"}), 404

    staff = staff_snap.to_dict()
    if (staff.get("role") or "").lower() != "maintenance_staff" or (staff.get("status") or "").lower() != "active":
        return jsonify({"error": "selected user is not an active maintenance staff"}), 400

    req_ref.set({
        "status": "assigned",
        "assignedToUid": staff_uid,
        "assignedToName": staff.get("fullName", ""),
        "assignedByUid": uid,
        "assignedByName": warden.get("fullName", ""),
        "wardenRemark": remark,
        "assignedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})

@app.route("/api/warden/reject-maintenance-request", methods=["POST"])
def warden_reject_maintenance_request():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    reason = (data.get("reason") or "Rejected by warden").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400

    req_ref = db.collection("maintenance_requests").document(request_id)
    snap = req_ref.get()
    if not snap.exists:
        return jsonify({"error": "maintenance request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending_warden"}), 400

    req_ref.set({
        "status": "rejected",
        "rejectedByUid": uid,
        "rejectedByName": warden.get("fullName", ""),
        "wardenRejectReason": reason,
        "rejectedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})

@app.route("/api/maintenance/my-requests", methods=["GET"])
def maintenance_my_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "maintenance_staff")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = (
        db.collection("maintenance_requests")
        .where("assignedToUid", "==", uid)
        .stream()
    )

    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)

@app.route("/api/maintenance/update-request-status", methods=["POST"])
def maintenance_update_request_status():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    staff, role_err = require_active_role(uid, "maintenance_staff")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    new_status = (data.get("status") or "").strip().lower()
    note = (data.get("note") or "").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400
    if new_status not in ["in_progress", "completed"]:
        return jsonify({"error": "status must be in_progress or completed"}), 400

    req_ref = db.collection("maintenance_requests").document(request_id)
    snap = req_ref.get()
    if not snap.exists:
        return jsonify({"error": "maintenance request not found"}), 404

    req = snap.to_dict()
    if (req.get("assignedToUid") or "") != uid:
        return jsonify({"error": "Forbidden: not assigned to you"}), 403

    # only allow from assigned -> in_progress -> completed
    current = (req.get("status") or "").lower()
    allowed = (current == "assigned" and new_status == "in_progress") or (current == "in_progress" and new_status == "completed")
    if not allowed:
        return jsonify({"error": f"Invalid transition: {current} -> {new_status}"}), 400

    update = {
        "status": new_status,
        "staffLastNote": note,
        "updatedAt": datetime.utcnow().isoformat()
    }
    if new_status == "in_progress":
        update["startedAt"] = datetime.utcnow().isoformat()
    if new_status == "completed":
        update["completedAt"] = datetime.utcnow().isoformat()

        #send email to student
        try:
            student_email = req.get("studentEmail")
            student_name = req.get("studentName", "Student")

            send_maintenance_completed_email(
                student_email,
                student_name,
                req.get("category"),
                req.get("location"),
                note
            )

        except Exception as e:
            print("Email send failed:", e)

    req_ref.set(update, merge=True)
    return jsonify({"ok": True, "requestId": request_id, "status": new_status})

# =========================
# VISITOR REQUESTS
# =========================

@app.route("/api/student/request-visitor", methods=["POST"])
def student_request_visitor():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    user_snap = db.collection("users").document(uid).get()
    if not user_snap.exists:
        return jsonify({"error": "user profile not found"}), 404

    user = user_snap.to_dict()
    if (user.get("role") != "student") or ((user.get("status") or "").lower() != "active"):
        return jsonify({"error": "Only active students can request visitor"}), 403

    data = request.json or {}
    visitor_name = (data.get("visitorName") or "").strip()
    relationship = (data.get("relationship") or "").strip()
    visit_date = (data.get("visitDate") or "").strip()      # "YYYY-MM-DD"
    time_in = (data.get("timeIn") or "").strip()            # "18:00"
    time_out = (data.get("timeOut") or "").strip()          # "20:00"
    purpose = (data.get("purpose") or "").strip()
    visitor_ic = (data.get("visitorIC") or "").strip()

    if not visitor_name:
        return jsonify({"error": "visitorName is required"}), 400
    if not visit_date:
        return jsonify({"error": "visitDate is required"}), 400
    if not time_in:
        return jsonify({"error": "timeIn is required"}), 400
    if not time_out:
        return jsonify({"error": "timeOut is required"}), 400

    doc_ref = db.collection("visitor_requests").document()
    doc_ref.set({
        "requestId": doc_ref.id,
        "studentUid": uid,
        "studentName": user.get("fullName", ""),
        "studentEmail": user.get("studentEmail", user.get("personalEmail", "")),

        "visitorName": visitor_name,
        "visitorIC": visitor_ic,
        "relationship": relationship,
        "visitDate": visit_date,
        "timeIn": time_in,
        "timeOut": time_out,
        "purpose": purpose,

        "status": "pending_warden",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    })

    return jsonify({"ok": True, "requestId": doc_ref.id}), 201


@app.route("/api/student/my-visitor-requests", methods=["GET"])
def student_my_visitor_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    results = []
    q = db.collection("visitor_requests").where("studentUid", "==", uid).stream()
    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("updatedAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)


@app.route("/api/warden/pending-visitor-requests", methods=["GET"])
def warden_pending_visitor_requests():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = db.collection("visitor_requests").where("status", "==", "pending_warden").stream()
    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)


@app.route("/api/warden/approve-visitor", methods=["POST"])
def warden_approve_visitor():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    remark = (data.get("remark") or "").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400

    ref = db.collection("visitor_requests").document(request_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "visitor request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending"}), 400

    ref.set({
        "status": "approved",
        "wardenRemark": remark,
        "approvedByUid": uid,
        "approvedByName": warden.get("fullName", ""),
        "approvedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})


@app.route("/api/warden/reject-visitor", methods=["POST"])
def warden_reject_visitor():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    request_id = (data.get("requestId") or "").strip()
    reason = (data.get("reason") or "Rejected by warden").strip()

    if not request_id:
        return jsonify({"error": "requestId is required"}), 400

    ref = db.collection("visitor_requests").document(request_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "visitor request not found"}), 404

    req = snap.to_dict()
    if (req.get("status") or "") != "pending_warden":
        return jsonify({"error": "request is not pending"}), 400

    ref.set({
        "status": "rejected",
        "wardenRejectReason": reason,
        "rejectedByUid": uid,
        "rejectedByName": warden.get("fullName", ""),
        "rejectedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }, merge=True)

    return jsonify({"ok": True, "requestId": request_id})

# =========================
# VIOLATIONS
# =========================

@app.route("/api/student/report-violation", methods=["POST"])
def student_report_violation():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    user_snap = db.collection("users").document(uid).get()
    if not user_snap.exists:
        return jsonify({"error": "user profile not found"}), 404

    user = user_snap.to_dict()
    if (user.get("role") != "student") or ((user.get("status") or "").lower() != "active"):
        return jsonify({"error": "Only active students can report violation"}), 403

    data = request.json or {}
    category = (data.get("category") or "").strip()
    description = (data.get("description") or "").strip()

    if not category:
        return jsonify({"error": "category is required"}), 400
    if not description:
        return jsonify({"error": "description is required"}), 400

    doc_ref = db.collection("violations").document()
    doc_ref.set({
        "violationId": doc_ref.id,
        "studentUid": uid,
        "studentName": user.get("fullName", ""),
        "category": category,
        "description": description,
        "status": "reported",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    })

    return jsonify({"ok": True, "violationId": doc_ref.id}), 201


@app.route("/api/student/my-violations", methods=["GET"])
def student_my_violations():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    results = []
    q = db.collection("violations").where("studentUid", "==", uid).stream()
    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("updatedAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)


@app.route("/api/warden/pending-violations", methods=["GET"])
def warden_pending_violations():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = db.collection("violations").where("status", "in", ["reported", "under_review"]).stream()
    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)


@app.route("/api/warden/update-violation", methods=["POST"])
def warden_update_violation():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    violation_id = (data.get("violationId") or "").strip()
    new_status = (data.get("status") or "").strip().lower()   # under_review / resolved / rejected
    action = (data.get("wardenAction") or "").strip()
    note = (data.get("wardenNote") or "").strip()

    if not violation_id:
        return jsonify({"error": "violationId is required"}), 400
    if new_status not in ["under_review", "resolved", "rejected"]:
        return jsonify({"error": "status must be under_review/resolved/rejected"}), 400

    ref = db.collection("violations").document(violation_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "violation not found"}), 404

    update = {
        "status": new_status,
        "wardenAction": action,
        "wardenNote": note,
        "updatedAt": datetime.utcnow().isoformat(),
        "updatedByUid": uid,
        "updatedByName": warden.get("fullName", ""),
    }

    if new_status == "resolved":
        update["resolvedAt"] = datetime.utcnow().isoformat()

    ref.set(update, merge=True)
    return jsonify({"ok": True, "violationId": violation_id, "status": new_status})



# =========================
# INCIDENT REPORTS (Student ↔ Warden)
# =========================

@app.route("/api/student/report-incident", methods=["POST"])
def student_report_incident():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    student, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()
    description = (data.get("description") or "").strip()
    evidence_url = (data.get("evidenceUrl") or "").strip()

    if not category:
        return jsonify({"error": "category is required"}), 400
    if not location:
        return jsonify({"error": "location is required"}), 400
    if not description:
        return jsonify({"error": "description is required"}), 400

    doc_ref = db.collection("incident_reports").document()
    doc_ref.set({
        "reportId": doc_ref.id,
        "studentUid": uid,
        "studentName": student.get("fullName", ""),
        "studentEmail": student.get("studentEmail", student.get("personalEmail", "")),

        "category": category,
        "location": location,
        "description": description,
        "evidenceUrl": evidence_url,

        "status": "pending_warden",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    })

    return jsonify({"ok": True, "reportId": doc_ref.id}), 201


@app.route("/api/student/my-incident-reports", methods=["GET"])
def student_my_incident_reports():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = db.collection("incident_reports").where("studentUid", "==", uid).stream()
    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("updatedAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)


@app.route("/api/warden/pending-incident-reports", methods=["GET"])
def warden_pending_incident_reports():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    _, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    results = []
    q = (
        db.collection("incident_reports")
        .where("status", "in", ["pending_warden", "in_review"])
        .stream()
    )

    for doc in q:
        results.append(doc.to_dict())

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(results)


@app.route("/api/warden/update-incident", methods=["POST"])
def warden_update_incident():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    warden, role_err = require_active_role(uid, "warden")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    report_id = (data.get("reportId") or "").strip()
    new_status = (data.get("status") or "").strip().lower()  # in_review/resolved/rejected
    warden_remark = (data.get("wardenRemark") or "").strip()
    resolution = (data.get("resolution") or "").strip()
    reject_reason = (data.get("rejectReason") or "").strip()

    if not report_id:
        return jsonify({"error": "reportId is required"}), 400
    if new_status not in ["in_review", "resolved", "rejected"]:
        return jsonify({"error": "status must be in_review/resolved/rejected"}), 400

    ref = db.collection("incident_reports").document(report_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "Report not found"}), 404

    current = (snap.to_dict().get("status") or "").lower()

    allowed = {
        "pending_warden": ["in_review", "rejected"],
        "in_review": ["resolved", "rejected"],
        "resolved": [],
        "rejected": [],
    }
    if new_status not in allowed.get(current, []):
        return jsonify({"error": f"Invalid transition: {current} -> {new_status}"}), 400

    update = {
        "status": new_status,
        "wardenRemark": warden_remark,
        "updatedAt": datetime.utcnow().isoformat(),
        "updatedByUid": uid,
        "updatedByName": warden.get("fullName", ""),
        "wardenUid": uid,
        "wardenName": warden.get("fullName", ""),
    }

    if new_status == "in_review":
        # keep it simple
        pass

    if new_status == "resolved":
        if not resolution:
            return jsonify({"error": "resolution is required when resolving"}), 400
        update["resolution"] = resolution
        update["resolvedAt"] = datetime.utcnow().isoformat()

    if new_status == "rejected":
        if not reject_reason:
            return jsonify({"error": "rejectReason is required when rejecting"}), 400
        update["rejectReason"] = reject_reason

    ref.set(update, merge=True)
    return jsonify({"ok": True, "reportId": report_id, "status": new_status})

# =========================
# PAYMENT ITEMS (Admin creates, Student views)
# =========================

@app.route("/api/admin/create-payment-item", methods=["POST"])
def admin_create_payment_item():
    uid_admin, err = require_admin()
    if err:
        return jsonify({"error": err[0]}), err[1]

    admin_profile, role_err = require_active_role(uid_admin, "admin")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    amount = data.get("amount")

    if not title:
        return jsonify({"error": "title is required"}), 400
    if amount is None:
        return jsonify({"error": "amount is required"}), 400

    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return jsonify({"error": "amount must be > 0"}), 400
    except:
        return jsonify({"error": "amount must be a number"}), 400

    ref = db.collection("payment_items").document()
    ref.set({
        "itemId": ref.id,
        "title": title,
        "description": description,
        "amount": round(amount_val, 2),
        "active": True,
        "createdAt": datetime.utcnow().isoformat(),
        "createdByUid": uid_admin,
        "createdByName": admin_profile.get("fullName", "Admin"),
    })

    return jsonify({"ok": True, "itemId": ref.id}), 201


@app.route("/api/admin/payment-items", methods=["GET"])
def admin_list_payment_items():
    uid_admin, err = require_admin()
    if err:
        return jsonify({"error": err[0]}), err[1]

    items = []
    for doc in db.collection("payment_items").stream():
        items.append(doc.to_dict() or {})

    # newest first
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(items)


@app.route("/api/admin/set-payment-item-active", methods=["POST"])
def admin_set_payment_item_active():
    uid_admin, err = require_admin()
    if err:
        return jsonify({"error": err[0]}), err[1]

    data = request.json or {}
    item_id = (data.get("itemId") or "").strip()
    active = data.get("active")

    if not item_id:
        return jsonify({"error": "itemId is required"}), 400
    if type(active) is not bool:
        return jsonify({"error": "active must be true/false"}), 400

    ref = db.collection("payment_items").document(item_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "payment item not found"}), 404

    ref.set({"active": active}, merge=True)
    return jsonify({"ok": True, "itemId": item_id, "active": active})

@app.route("/api/student/payment-items", methods=["GET"])
def student_list_payment_items():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    __, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    items = []
    q = db.collection("payment_items").where("active", "==", True).stream()
    for doc in q:
        items.append(doc.to_dict() or {})

    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return jsonify(items)


@app.route("/api/student/pay-payment-item", methods=["POST"])
def student_pay_payment_item():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]

    student, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]

    data = request.json or {}
    item_id = (data.get("itemId") or "").strip()
    method = (data.get("method") or "Online").strip()
    reference_no = (data.get("referenceNo") or "").strip()

    if not item_id:
        return jsonify({"error": "itemId is required"}), 400

    item_ref = db.collection("payment_items").document(item_id)
    item_snap = item_ref.get()
    if not item_snap.exists:
        return jsonify({"error": "payment item not found"}), 404

    item = item_snap.to_dict() or {}
    if not item.get("active", False):
        return jsonify({"error": "This payment item is not active"}), 400

    # Optional: prevent duplicate payment for same item by same student
    existing = (
        db.collection("payments")
        .where("studentUid", "==", uid)
        .where("itemId", "==", item_id)
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        return jsonify({"error": "You already paid this item"}), 400

    pay_ref = db.collection("payments").document()

    receipt_url = (data.get("receiptUrl") or "").strip()

    pay_ref.set({
        "paymentId": pay_ref.id,
        "studentUid": uid,
        "studentName": student.get("fullName", ""),
        "studentEmail": student.get("studentEmail", student.get("personalEmail", "")),

        "itemId": item_id,
        "itemTitle": item.get("title", ""),
        "amount": item.get("amount", 0),

        "method": method,
        "referenceNo": reference_no,
        "receiptUrl": receipt_url,

        "status": "pending_warden",

        "createdAt": datetime.utcnow().isoformat(),
        "submittedAt": datetime.utcnow().isoformat(),
    })

    return jsonify({"ok": True, "paymentId": pay_ref.id}), 201

@app.route("/api/admin/all-payments", methods=["GET"])
def admin_all_payments():
    uid_admin, err = require_admin()
    if err:
        return jsonify({"error": err[0]}), err[1]

    results = []
    for doc in db.collection("payments").stream():
        results.append(doc.to_dict() or {})

    results.sort(key=lambda x: x.get("paidAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)

@app.route("/api/student/my-payments", methods = ["GET"])
def student_my_payments():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]
    
    student, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]
    
    results = []
    for doc in (
        db.collection("payments")
        .where("studentUid", "==", uid)
        .stream()
    ):
        results.append(doc.to_dict() or {})

    results.sort(key=lambda x:x.get("paidAt", x.get("createdAt", "")), reverse=True)
    return jsonify(results)

@app.route("/api/student/active-payment-items", methods=["GET"])
def student_active_payment_items():
    uid, err = get_uid_from_bearer()
    if err:
        return jsonify({"error": err[0]}), err[1]
    
    student, role_err = require_active_role(uid, "student")
    if role_err:
        return jsonify({"error": role_err[0]}), role_err[1]
    
    results = []
    for doc in db.collection("payment_items").where("active", "==", True).stream():
        results.append(doc.to_dict() or {})

    results.sort(key=lambda x:x.get("createdAt", ""), reverse=True)
    return jsonify(results)

# 4) Start Flask server
if __name__ == "__main__":
    app.run(debug=True)
