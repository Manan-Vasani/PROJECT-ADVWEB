import React from 'react';

export interface Repository {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  updated_at?: string;
}

interface RepoListProps {
  repos: Repository[];
}

export const RepoList: React.FC<RepoListProps> = ({ repos }) => {
  if (repos.length === 0) {
    return (
      <div className="empty-repos-state">
        <p>No public repositories found for this GitHub account.</p>
      </div>
    );
  }

  return (
    <div className="projects-grid">
      {repos.map((repo) => (
        <div key={repo.id} className="project-card repo-card">
          <div className="repo-header-badge">
            <span className="repo-lang-badge">
              {repo.language || 'Code'}
            </span>
            {typeof repo.stargazers_count === 'number' && (
              <span className="repo-stars">
                ⭐ {repo.stargazers_count}
              </span>
            )}
          </div>

          <h3 className="project-title repo-title">{repo.name}</h3>
          
          <p className="project-description repo-description">
            {repo.description || 'No description provided for this GitHub repository.'}
          </p>

          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="project-link"
          >
            View Repository on GitHub ➔
          </a>
        </div>
      ))}
    </div>
  );
};
