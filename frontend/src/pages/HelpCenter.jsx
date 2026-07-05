import React from "react";
import { useNavigate } from "react-router-dom";
import "./HelpCenter.css";

import Footer from "../component/Footer";

export default function HelpCenter() {
    const navigate = useNavigate();

    const faqs = [
        {
            question: "How do I reset my password?",
            answer: "You can change your password in the 'Profile Settings' page. If you have forgotten your password, use the 'Forgot Password' link on the login page to receive a reset link via email."
        },
        {
            question: "How can I request a room change?",
            answer: "Navigate to the 'Request Room' section on your dashboard. Select your preferred room type and provide a valid reason. Your request will be reviewed by the warden."
        },
        {
            question: "What is the visitor policy?",
            answer: "Visitors are allowed between 9:00 AM and 9:00 PM. You must register all visitors via the 'Register Visitor' button on your dashboard. Overnight stays are strictly prohibited."
        },
        {
            question: "How do I report a maintenance issue?",
            answer: "Use the 'Report Issue' button on your dashboard. Select the category (e.g., Electrical, Plumbing), provide a description, and upload a photo if possible. Maintenance staff will attend to it shortly."
        },
        {
            question: "Where can I view my lease agreement details?",
            answer: "Your lease details, including check-in date and lease end date, are visible on your Student Dashboard in the profile card section."
        },
        {
            question: "How do I pay my hostel fees?",
            answer: "Go to the 'Payments' section (if generated). You can view pending invoices and payment history. Currently, payments must be made at the administration office, but online integration is coming soon."
        },
        {
            question: "Who do I contact in case of an emergency?",
            answer: "For immediate emergencies, contact the campus security hotline or the warden on duty. Their contact numbers are displayed at the hostel entrance and usually on the digital notice board."
        },
        {
            question: "Can I extend my lease?",
            answer: "Lease extensions are subject to availability. Please submit a 'Room Request' with 'Extension' as the reason at least one month before your current lease expires."
        }
    ];

    return (
        <div className="help-center-page">
            <div className="help-center-container">
                <header className="help-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1>Help Center</h1>
                    <p>Frequently Asked Questions</p>
                </header>

                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <h3 className="faq-question">{faq.question}</h3>
                            <p className="faq-answer">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
