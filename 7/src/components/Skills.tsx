import React from 'react';

interface Skill {
  name: string;
  category: string;
  level: string;
  percentage: number;
}

interface SkillsProps {
  skills: Skill[];
}

export const Skills: React.FC<SkillsProps> = ({ skills }) => {
  // Group skills by category
  const categories = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <section id="skills" className="skills-section">
      <div className="section-header">
        <h2 className="section-title"><span className="number">02.</span> Skills & Expertise</h2>
        <div className="section-line"></div>
      </div>
      
      <div className="skills-categories-grid">
        {Object.entries(categories).map(([category, categorySkills]) => (
          <div key={category} className="skills-card">
            <h3 className="category-title">{category}</h3>
            <div className="skills-list">
              {categorySkills.map((skill, idx) => (
                <div key={idx} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">{skill.level}</span>
                  </div>
                  <div className="skill-bar-bg">
                    <div 
                      className="skill-bar-fill" 
                      style={{ width: `${skill.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
