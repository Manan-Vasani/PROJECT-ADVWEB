import React, { useState, useEffect } from 'react';
import { Stethoscope, AlertTriangle, RefreshCw, Mail, CheckCircle, XCircle } from 'lucide-react';

/**
 * Task 4 Component: DoctorsPage
 * Consumes Express REST API GET /api/v1/doctors via useEffect()
 * Strictly maintains 3 states: data, loading, error
 */
const DoctorsPage = () => {
  // 3 distinct state hooks required by Task 4
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch doctors from Express REST API
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/v1/doctors');
      
      if (!response.ok) {
        throw new Error(`Server responded with status HTTP ${response.status} (${response.statusText})`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch doctor records:', err);
      setError(err.message || 'Unable to connect to backend server. Please verify the Express API is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on initial component mount via useEffect
  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="doctors-page">
      <div className="section-title-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="section-title">Medical Specialists & Doctors</h1>
          <p className="section-subtitle">
            Live doctor availability loaded dynamically from Express REST API (<code>GET /api/v1/doctors</code>)
          </p>
        </div>
        <button 
          onClick={fetchDoctors} 
          className="btn-hero-secondary"
          style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={16} />
          Refresh List
        </button>
      </div>

      {/* 1. Loading State Indicator */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p style={{ fontWeight: 500 }}>Fetching specialist roster from backend API...</p>
        </div>
      )}

      {/* 2. Error State Alert Banner */}
      {!loading && error && (
        <div className="error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} />
            <div>
              <strong>Error Loading Doctors:</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{error}</p>
            </div>
          </div>
          <button className="btn-retry" onClick={fetchDoctors}>
            Retry Request
          </button>
        </div>
      )}

      {/* 3. Successful Data Render */}
      {!loading && !error && (
        <>
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p>No doctors currently registered in the database.</p>
            </div>
          ) : (
            <div className="doctor-grid">
              {data.map((doctor, index) => (
                <div key={doctor._id || doctor.id || index} className="doctor-card">
                  <div className="doctor-avatar">
                    <Stethoscope size={24} />
                  </div>
                  <h3 className="doctor-name">{doctor.name}</h3>
                  <div className="doctor-spec">{doctor.specialisation}</div>
                  
                  {doctor.email && (
                    <p className="doctor-email" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Mail size={14} />
                      {doctor.email}
                    </p>
                  )}

                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {doctor.available ? (
                      <span className="avail-badge available">
                        <span className="pulse-dot"></span>
                        <CheckCircle size={14} /> Available Today
                      </span>
                    ) : (
                      <span className="avail-badge unavailable">
                        <span className="pulse-dot"></span>
                        <XCircle size={14} /> Unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorsPage;
