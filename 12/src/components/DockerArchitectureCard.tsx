import React, { useState, useEffect } from 'react';
import { getDockerStatus } from '../services/api';
import type { DockerStatusResponse } from '../services/api';

export const DockerArchitectureCard: React.FC = () => {
  const [data, setData] = useState<DockerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topology' | 'compose' | 'dockerfileFrontend' | 'dockerfileBackend'>('topology');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDockerStatus();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Docker status endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
      marginBottom: '28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0071e3 0%, #00c7be 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.25)'
          }}>
            🐳
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1d1d1f' }}>
              Practical 11: Multi-Container Architecture (Docker Compose)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#86868b' }}>
              Orchestrated 3-tier microservice architecture: Frontend ↔ Backend ↔ MongoDB
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '20px',
            background: data?.isContainer ? 'rgba(52, 199, 89, 0.12)' : 'rgba(0, 113, 227, 0.1)',
            color: data?.isContainer ? '#28cd41' : '#0071e3',
            border: `1px solid ${data?.isContainer ? 'rgba(52, 199, 89, 0.3)' : 'rgba(0, 113, 227, 0.2)'}`
          }}>
            {data?.isContainer ? '● Running Inside Docker' : '● Local Node Runtime (Docker Ready)'}
          </span>
          <button
            onClick={fetchStatus}
            disabled={loading}
            style={{
              background: '#f5f5f7',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#1d1d1f',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? '↻ Refreshing...' : '↻ Refresh Status'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px', marginBottom: '18px' }}>
        {[
          { id: 'topology', label: 'Topology & Network' },
          { id: 'compose', label: 'docker-compose.yml' },
          { id: 'dockerfileFrontend', label: 'Dockerfile.frontend (Multi-Stage)' },
          { id: 'dockerfileBackend', label: 'Dockerfile.backend' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 500,
              border: 'none',
              background: activeTab === tab.id ? '#0071e3' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#6e6e73',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(255, 59, 48, 0.1)',
          border: '1px solid rgba(255, 59, 48, 0.25)',
          borderRadius: '10px',
          color: '#d32f2f',
          fontSize: '12px',
          marginBottom: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tab 1: Topology */}
      {activeTab === 'topology' && (
        <div>
          {/* 3 Container Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            {/* Frontend */}
            <div style={{
              background: '#fafafa',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868b', fontWeight: 600 }}>Container 1</span>
                <span style={{ fontSize: '11px', background: '#e3f2fd', color: '#0288d1', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>PORT 5173</span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1d1d1f' }}>frontend</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6e6e73' }}>React 19 + Vite Multi-Stage Preview</p>
              <div style={{ fontSize: '11px', color: '#86868b', lineHeight: '1.5' }}>
                <div>• Image: <code>practical11-frontend</code></div>
                <div>• Build: Multi-Stage (Node 18 Alpine)</div>
                <div>• Network: <code>app-network</code> (bridge)</div>
              </div>
            </div>

            {/* Backend */}
            <div style={{
              background: '#fafafa',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868b', fontWeight: 600 }}>Container 2</span>
                <span style={{ fontSize: '11px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>PORT 5000</span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1d1d1f' }}>backend</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6e6e73' }}>Node.js / Express REST API</p>
              <div style={{ fontSize: '11px', color: '#86868b', lineHeight: '1.5' }}>
                <div>• Hostname: <code>{data?.container.hostname || 'container-host'}</code></div>
                <div>• Mongo Host: <code>{data?.orchestration.mongoHost || 'mongodb:27017'}</code></div>
                <div>• Inter-Container DNS: <code>Active</code></div>
              </div>
            </div>

            {/* MongoDB */}
            <div style={{
              background: '#fafafa',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868b', fontWeight: 600 }}>Container 3</span>
                <span style={{ fontSize: '11px', background: '#f3e5f5', color: '#7b1fa2', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>PORT 27017</span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1d1d1f' }}>mongodb</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6e6e73' }}>Official Mongo:6 Image</p>
              <div style={{ fontSize: '11px', color: '#86868b', lineHeight: '1.5' }}>
                <div>• Named Volume: <code>mongo-data</code></div>
                <div>• Mount Path: <code>/data/db</code></div>
                <div>• Persistence: Durable across restarts</div>
              </div>
            </div>
          </div>

          {/* Supplementary Checklist & One-Click Commands */}
          <div style={{ background: '#f5f5f7', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#1d1d1f' }}>
              <span>✅ <strong>Supplementary 1:</strong> .dockerignore configured</span>
              <span>✅ <strong>Supplementary 2:</strong> Multi-Stage Frontend Build</span>
              <span>✅ <strong>Supplementary 3:</strong> Named Volume Persistence</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { cmd: 'docker compose up --build', label: 'Run Stack' },
                { cmd: 'docker compose ps', label: 'View Containers' },
                { cmd: 'docker compose down -v', label: 'Stop & Reset' }
              ].map(c => (
                <button
                  key={c.label}
                  onClick={() => copyToClipboard(c.cmd, c.label)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: copiedCmd === c.label ? '#28cd41' : '#1d1d1f',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copiedCmd === c.label ? '✓ Copied!' : c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: docker-compose.yml */}
      {activeTab === 'compose' && (
        <pre style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          overflowX: 'auto',
          margin: 0
        }}>
{`services:
  mongodb:
    image: mongo:6
    container_name: practical11-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db        # Supplementary 3: Persistent Volume
    networks:
      - app-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: practical11-backend
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      MONGO_URI: mongodb://mongodb:27017/taskdb   # Service DNS name resolution!
      JWT_SECRET: charusat_itue301_practical11_jwt_secret_key_2026
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: practical11-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local`}
        </pre>
      )}

      {/* Tab 3: Dockerfile.frontend */}
      {activeTab === 'dockerfileFrontend' && (
        <pre style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          overflowX: 'auto',
          margin: 0
        }}>
{`# Practical 11: Multi-Stage Build Dockerfile for React Frontend
# Stage 1: Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# Stage 2: Serve Stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.ts ./
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]`}
        </pre>
      )}

      {/* Tab 4: Dockerfile.backend */}
      {activeTab === 'dockerfileBackend' && (
        <pre style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          overflowX: 'auto',
          margin: 0
        }}>
{`# Practical 11: Backend Node.js & Express Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js ./
COPY models/ ./models/
COPY middleware/ ./middleware/
COPY services/ ./services/
COPY events/ ./events/
COPY public/ ./public/
COPY .env.example ./.env.example
ENV PORT=5000
ENV NODE_ENV=production
ENV DOCKER_CONTAINER=true
EXPOSE 5000
CMD ["node", "server.js"]`}
        </pre>
      )}
    </div>
  );
};
