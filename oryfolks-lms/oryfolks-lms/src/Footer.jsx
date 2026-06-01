import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, BookOpen, ExternalLink } from 'lucide-react';
import './Footer.css';
import logo from './assets/logo.png';

const Footer = () => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="oryfolks-professional-footer">
            <div className="footer-container">
                {/* Brand Column */}
                <div className="footer-brand-column">
                    <div className="footer-logo-container" onClick={() => handleNavigation('/employee')}>
                        <img src={logo} alt="Oryfolks Logo" className="footer-logo-image" />
                        <span className="footer-logo-text">Oryfolks <span className="highlight">LMS</span></span>
                    </div>
                    <p className="footer-brand-description">
                        Empowering professionals and teams to level up their capabilities through customized, high-impact learning paths and modern skill assessment.
                    </p>
                    <div className="footer-social-links">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
                            <Github size={18} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                            <Linkedin size={18} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Twitter">
                            <Twitter size={18} />
                        </a>
                        <a href="mailto:support@oryfolks.com" className="social-icon-btn" aria-label="Email Support">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                {/* Links Columns */}
                <div className="footer-links-grid">
                    <div className="footer-links-column">
                        <h4 className="footer-column-title">Explore Paths</h4>
                        <ul className="footer-links-list">
                            <li>
                                <button onClick={() => handleNavigation('/employee')} className="footer-link-action">
                                    Course Dashboard
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleNavigation('/employee/my-learning')} className="footer-link-action">
                                    My Learning
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleNavigation('/employee/profile')} className="footer-link-action">
                                    My Profile
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-links-column">
                        <h4 className="footer-column-title">Resources</h4>
                        <ul className="footer-links-list">
                            <li>
                                <a href="#" className="footer-link-action external">
                                    Help Center <ExternalLink size={12} className="inline-icon" />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="footer-link-action external">
                                    Support Portal <ExternalLink size={12} className="inline-icon" />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="footer-link-action external">
                                    Terms of Service <ExternalLink size={12} className="inline-icon" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-links-column">
                        <h4 className="footer-column-title">Contact</h4>
                        <ul className="footer-links-list address-list">
                            <li className="footer-text-info">
                                <strong>Address:</strong> Corporate HQ, Tech City
                            </li>
                            <li className="footer-text-info">
                                <strong>Support:</strong> support@oryfolks.com
                            </li>
                            <li className="footer-text-info">
                                <strong>Hours:</strong> Mon - Fri, 9AM - 6PM
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom-bar">
                <div className="footer-bottom-container">
                    <p className="copyright-text">
                        &copy; {new Date().getFullYear()} Oryfolks LMS. All rights reserved.
                    </p>
                    <div className="footer-bottom-meta">
                        <a href="#" className="meta-link">Privacy Policy</a>
                        <span className="separator">•</span>
                        <a href="#" className="meta-link">Cookie Preferences</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
