import React from 'react';

interface AboutProps {
  bio: string;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
  }>;
  interests: string[];
}

export const About: React.FC<AboutProps> = ({ bio, education, interests }) => {
  return (
    <section id="about" className="about-section">
      <div className="section-header">
        <h2 className="section-title"><span className="number">01.</span> About Me</h2>
        <div className="section-line"></div>
      </div>
      
      <div className="about-grid">
        <div className="about-bio">
          <p className="bio-text">{bio}</p>
          <div className="interests-container">
            <h3>Interests & Focus Areas</h3>
            <ul className="interests-list">
              {interests.map((interest, idx) => (
                <li key={idx} className="interest-item">
                  <span className="bullet">⚡</span> {interest}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="about-education">
          <h3>Education</h3>
          <div className="timeline">
            {education.map((edu, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <span className="edu-period">{edu.period}</span>
                  <h4 className="edu-degree">{edu.degree}</h4>
                  <p className="edu-institution">{edu.institution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
