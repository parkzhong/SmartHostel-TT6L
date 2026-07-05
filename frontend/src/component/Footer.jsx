import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer({ showLinks = true }) {
    return (
        <footer className="student-footer">
            <div className="footer-content">
                {showLinks && (
                    <div className="footer-links">
                        <Link to="/help-center" className="footer-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            Help Center
                        </Link>
                        <span className="footer-divider">•</span>
                        <Link to="/privacy-policy" className="footer-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Privacy Policy
                        </Link>
                    </div>
                )}
                <div className="footer-copyright">
                    © {new Date().getFullYear()} Smart Hostel Management System. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
