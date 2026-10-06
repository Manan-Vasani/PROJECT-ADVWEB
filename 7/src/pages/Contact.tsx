import React, { useState } from 'react';

export const Contact: React.FC = () => {
  // 1. useState for Controlled input (managing form inputs)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // 2. useState for toggling UI visibility
  const [showTooltip, setShowTooltip] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="section-header">
        <h2 className="section-title"><span className="number">04.</span> Get In Touch</h2>
        <div className="section-line"></div>
      </div>

      <div className="contact-layout">
        <div className="contact-info-panel">
          <h3>Let's talk about your next project.</h3>
          <p>
            Whether you have a question, want to collaborate on an open-source initiative, 
            or just want to say hello, fill out the form and I'll get back to you within 24 hours.
          </p>

          {/* Practical 2 UI Visibility Toggle Button */}
          <button 
            type="button" 
            className="tooltip-trigger-btn"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            {showTooltip ? 'Hide Guide' : 'Show Guide'} 💡
          </button>

          {showTooltip && (
            <div className="tooltip-box">
              <h4>🎯 Practical 2 Requirements Guide</h4>
              <p>
                This guide is toggled dynamically using React's <code>useState</code> state variable.
                It verifies that UI element visibility can be updated reactively on user click.
              </p>
            </div>
          )}
        </div>

        <div>
          {submitted ? (
            <div className="form-preview-card" style={{ borderStyle: 'solid', borderColor: 'var(--color-primary)' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>✓ Message Received</h3>
              <p style={{ fontSize: '15px', color: 'var(--color-ink-muted-80)' }}>
                Thank you for reaching out, <strong>{formData.name}</strong>! Your message has been simulated successfully.
              </p>
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '16px', padding: '6px 12px', fontSize: '14px' }}
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', message: '' });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Your Name</label>
                <input 
                  className="form-input"
                  type="text" 
                  id="name"
                  name="name"
                  placeholder="e.g. Manan Vasani"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Your Email</label>
                <input 
                  className="form-input"
                  type="email" 
                  id="email"
                  name="email"
                  placeholder="e.g. mananvasani801@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Your Message</label>
                <textarea 
                  className="form-input form-input-message"
                  id="message"
                  name="message"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Real-time controlled preview section */}
              {(formData.name || formData.email || formData.message) && (
                <div className="form-preview-card">
                  <h4>⚡ Real-Time Input Preview</h4>
                  {formData.name && <p className="form-preview-text"><strong>From:</strong> {formData.name}</p>}
                  {formData.email && <p className="form-preview-text"><strong>Email:</strong> {formData.email}</p>}
                  {formData.message && <p className="form-preview-text"><strong>Message:</strong> {formData.message}</p>}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
