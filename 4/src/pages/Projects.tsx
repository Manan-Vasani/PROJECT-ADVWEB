import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { RepoList } from '../components/RepoList';
import type { Repository } from '../components/RepoList';

export const Projects: React.FC = () => {
  // 1. Set up 3 state variables for data, loading, and error
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state and error simulation state
  const [username, setUsername] = useState<string>('JHON-WICK-007');
  const [inputVal, setInputVal] = useState<string>('JHON-WICK-007');
  const [simulateError, setSimulateError] = useState<boolean>(false);

  // Determine API URL based on simulateError flag
  const apiUrl = simulateError 
    ? 'https://api.github.com/users/invalid_user_nonexistent_xyz_99999/repos'
    : `https://api.github.com/users/${username}/repos`;

  // 2. Use useEffect to fetch data when component mounts or API URL changes
  const fetchRepos = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} Error: Failed to fetch repositories for GitHub user "${username}". (${res.statusText || 'User not found or API rate limited'})`);
        }
        return res.json();
      })
      .then((data: Repository[]) => {
        setRepos(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiUrl, username]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSimulateError(false);
      setUsername(inputVal.trim());
    }
  };

  const toggleErrorSimulation = () => {
    setSimulateError((prev) => !prev);
  };

  return (
    <section className="projects-section">
      <div className="section-header">
        <h2 className="section-title"><span className="number">03.</span> Dynamic GitHub Repositories</h2>
        <div className="section-line"></div>
      </div>

      {/* Practical 3 Controls - Username Search & Error Path Testing */}
      <div className="api-controls-panel">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <label htmlFor="gh-username" className="search-label">GitHub Username:</label>
          <input 
            id="gh-username"
            type="text" 
            className="search-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter GitHub username"
          />
          <button type="submit" className="btn btn-primary search-btn">
            Fetch Repos 🔍
          </button>
        </form>

        <button 
          type="button" 
          className={`btn ${simulateError ? 'btn-danger' : 'btn-secondary'}`}
          onClick={toggleErrorSimulation}
          title="Toggles an invalid URL to test the error path requirement"
        >
          {simulateError ? '⚠️ Restore Valid API URL' : '🧪 Test Error State (Break URL)'}
        </button>
      </div>

      {/* 3. Conditionally render based on state */}
      {loading ? (
        <Spinner label={`Fetching live repositories for "${username}"...`} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRepos} />
      ) : (
        /* 4. Map over repos array and render name and html_url */
        <RepoList repos={repos} />
      )}
    </section>
  );
};
