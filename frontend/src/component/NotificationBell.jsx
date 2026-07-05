import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebaseClient";
import "./NotificationBell.css";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/student/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                // Calculate unread
                const unread = data.filter(n => !n.read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    // Fetch on mount and poll
    useEffect(() => {
        fetchNotifications();
        // Poll every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = async () => {
        if (!open) {
            // Opening: fetch latest first
            await fetchNotifications();
            setOpen(true);

            // Then mark as read if needed
            if (unreadCount > 0) {
                try {
                    const user = auth.currentUser;
                    const token = await user.getIdToken();
                    await fetch("http://127.0.0.1:5000/api/student/mark-notifications-read", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // We don't setUnreadCount(0) immediately here because we just fetched.
                    // But technically the backend will mark them read. 
                    // Let's just set local state to 0 for UI responsiveness.
                    setUnreadCount(0);
                } catch (err) {
                    console.error("Failed to mark read:", err);
                }
            }
        } else {
            setOpen(false);
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="icon-button" onClick={handleToggle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">No notifications</div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`notification-item ${!n.read ? "unread" : ""}`}>
                                    <div className="notification-title">{n.title}</div>
                                    <div className="notification-message">{n.message}</div>
                                    <div className="notification-date">
                                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
