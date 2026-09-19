import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  mockMode: String(process.env.MOCK_MODE || 'true').toLowerCase() === 'true',
  dronahqApiKey: process.env.DRONAHQ_API_KEY || '',
  dronahqVoiceAgentId: process.env.DRONAHQ_VOICE_AGENT_ID || '',
  dronahqWorkspaceId: process.env.DRONAHQ_WORKSPACE_ID || ''
};
