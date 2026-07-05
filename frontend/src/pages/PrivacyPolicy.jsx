import React from "react";
import { useNavigate } from "react-router-dom";
import "./HelpCenter.css"; // Reuse shared CSS
import Footer from "../component/Footer";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="privacy-policy-page">
            <div className="privacy-policy-container">
                <header className="privacy-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1>Privacy Policy</h1>
                    <p>Last updated: June 1, 2026</p>
                </header>

                <div className="policy-content">
                    <section>
                        <h2>1. Introduction</h2>
                        <p>Welcome to SmartHostel. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                    </section>

                    <section>
                        <h2>2. Data We Collect</h2>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                        <ul>
                            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier, and student ID.</li>
                            <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Room Request Data:</strong> includes your preferences for room types, roommates, and lease periods.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. How We Use Your Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul>
                            <li>To register you as a new student resident.</li>
                            <li>To process room allocation and manage your accommodation.</li>
                            <li>To manage our relationship with you including notifying you about changes to our terms or privacy policy.</li>
                            <li>To administer and protect our business and this website.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Data Security</h2>
                        <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
                    </section>

                    <section>
                        <h2>5. Your Legal Rights</h2>
                        <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p>
                    </section>

                    <section>
                        <h2>6. Third-Party Links</h2>
                        <p>This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.</p>
                    </section>

                    <section>
                        <h2>7. Children's Privacy</h2>
                        <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13.</p>
                    </section>

                    <section>
                        <h2>8. Changes to This Privacy Policy</h2>
                        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                    </section>

                    <section>
                        <h2>9. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us:</p>
                        <ul>
                            <li>By email: support@smarthostel.edu.my</li>
                            <li>By phone: +60 12-345 6789</li>
                        </ul>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
