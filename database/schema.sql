CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE campaign_status AS ENUM ('DRAFT', 'LIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE prospect_status AS ENUM ('DISCOVERED','RESEARCHED','QUALIFIED','CONTACTED','ENGAGED','MEETING','OPPORTUNITY','DISQUALIFIED','SUPPRESSED');
CREATE TYPE channel AS ENUM ('EMAIL','LINKEDIN','SMS','VOICE');
CREATE TYPE activity_status AS ENUM ('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED');
CREATE TYPE agent_status AS ENUM ('ACTIVE','PAUSED','ERROR');
CREATE TYPE call_status AS ENUM ('QUEUED','INITIATED','RINGING','CONNECTED','COMPLETED','FAILED','NO_ANSWER','BUSY','CANCELLED');
CREATE TYPE approval_status AS ENUM ('PENDING','APPROVED','REJECTED','EXPIRED');
CREATE TYPE escalation_status AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','DISMISSED');

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255),
  status campaign_status DEFAULT 'DRAFT',
  icp TEXT,
  agent_config JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  company VARCHAR(255),
  title VARCHAR(255),
  location VARCHAR(255),
  status prospect_status DEFAULT 'DISCOVERED',
  company_data JSONB DEFAULT '{}',
  social_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prospect_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  status prospect_status DEFAULT 'DISCOVERED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prospect_id, campaign_id)
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  agent VARCHAR(255),
  action VARCHAR(255),
  status activity_status DEFAULT 'COMPLETED',
  output JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  thread_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender VARCHAR(50) DEFAULT 'SYSTEM',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  external_call_id VARCHAR(255),
  status call_status DEFAULT 'QUEUED',
  agent VARCHAR(255),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  transcript TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE call_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id),
  outcome VARCHAR(255),
  intent VARCHAR(255),
  qualification JSONB DEFAULT '{}',
  objections JSONB DEFAULT '[]',
  next_action TEXT,
  structured_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status agent_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  agent_id UUID REFERENCES agents(id),
  status agent_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR(255),
  content TEXT,
  active_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id),
  content TEXT,
  version_number INT,
  created_by VARCHAR(255),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  title VARCHAR(255),
  description TEXT,
  source VARCHAR(255),
  content TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES knowledge_documents(id),
  chunk_index INT,
  content TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  prospect_id UUID REFERENCES prospects(id),
  action VARCHAR(255),
  reason TEXT,
  recommendation TEXT,
  risk VARCHAR(50),
  status approval_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  prospect_id UUID REFERENCES prospects(id),
  category VARCHAR(100),
  priority VARCHAR(50),
  reason TEXT,
  context JSONB DEFAULT '{}',
  status escalation_status DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  prospect_id UUID REFERENCES prospects(id),
  agent_id UUID REFERENCES agents(id),
  status activity_status DEFAULT 'COMPLETED',
  input_context JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  latency_ms INT,
  prompt_version_id UUID,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  message TEXT,
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  title VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  campaign_id UUID REFERENCES campaigns(id),
  amount NUMERIC(12,2),
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  campaign_id UUID REFERENCES campaigns(id),
  prospect_id UUID REFERENCES prospects(id),
  action VARCHAR(255),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
