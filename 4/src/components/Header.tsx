import React from 'react';

interface HeaderProps {
  name: string;
  title: string;
  tagline: string;
  themeColor?: string;
}

export const Header: React.FC<HeaderProps> = ({ name, title, tagline, themeColor }) => {
  return (
    <header className="portfolio-header">
      <div className="hero-section">
        <div className="hero-badge">Available for Projects</div>
        <h1 className="hero-title">
          Hi, I'm <span className="gradient-text" style={{ color: themeColor }}>{name}</span>
        </h1>
        <h2 className="hero-subtitle">{title}</h2>
        <p className="hero-tagline">{tagline}</p>
        <div className="hero-actions">
          <a href="/contact" className="btn btn-primary">Connect With Me</a>
          <a href="/#skills" className="btn btn-secondary">View Skills</a>
        </div>
      </div>
    </header>
  );
};
