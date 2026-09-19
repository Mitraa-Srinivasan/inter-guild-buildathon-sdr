import { useEffect, useMemo, useState } from 'react';
import {
  getCampaigns,
  getDashboardOverview,
  getProspects,
  callProspect,
  getAnalyticsOverview,
  getCalls,
  getApprovals,
  getEscalations,
  getAgents,
  getKnowledge,
  getConversations
} from './services/api';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [calls, setCalls] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [callingId, setCallingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeView, setActiveView] = useState('Overview');

  const navItems = ['Overview', 'Campaigns', 'Prospects', 'Conversations', 'Calls', 'Approvals', 'Escalations', 'Knowledge', 'Agents', 'Analytics'];

  const summary = useMemo(() => {
    if (!dashboard) return null;
    return [
      ['Active campaigns', dashboard.activeCampaigns],
      ['Total prospects', dashboard.totalProspects.toLocaleString()],
      ['Qualified leads', dashboard.qualifiedLeads],
      ['Meetings booked', dashboard.meetingsBooked],
      ['Positive responses', dashboard.positiveResponses],
      ['Calls completed', dashboard.callsCompleted],
      ['Emails sent', dashboard.emailsSent],
      ['Conversion rate', `${dashboard.conversionRate}%`]
    ];
  }, [dashboard]);

  useEffect(() => {
    async function loadApp() {
      try {
        const [overview, campaignData, prospectData, analyticsData, callData, approvalData, escalationData, agentData, knowledgeData, conversationData] = await Promise.all([
          getDashboardOverview(),
          getCampaigns(),
          getProspects(),
          getAnalyticsOverview(),
          getCalls(),
          getApprovals(),
          getEscalations(),
          getAgents(),
          getKnowledge(),
          getConversations()
        ]);

        setDashboard(overview);
        setCampaigns(campaignData);
        setProspects(prospectData);
        setAnalytics(analyticsData);
        setCalls(callData);
        setApprovals(approvalData);
        setEscalations(escalationData);
        setAgents(agentData);
        setKnowledge(knowledgeData);
        setConversations(conversationData);
        setSelectedProspect(prospectData[0] || null);
      } catch (error) {
        console.error('Failed to load app', error);
        setNotice('Connection issue — backend unavailable.');
      } finally {
        setLoading(false);
      }
    }

    loadApp();
  }, []);

  const handleCall = async (prospectId) => {
    try {
      setCallingId(prospectId);
      const result = await callProspect(prospectId);
      setNotice(`Call initiated: ${result.status}`);

      const updatedProspects = prospects.map((item) => item.id === prospectId ? { ...item, status: 'ENGAGED', nextAction: 'Follow up with meeting recap' } : item);
      setProspects(updatedProspects);
      if (selectedProspect?.id === prospectId) {
        setSelectedProspect(updatedProspects.find((item) => item.id === prospectId));
      }
    } catch (error) {
      setNotice('Call failed or backend is offline.');
    } finally {
      setCallingId(null);
    }
  };

  const renderView = () => {
    if (activeView === 'Overview') {
      return (
        <>
          <section className="kpi-grid">
            {summary && summary.map(([label, value]) => (
              <article key={label} className="card metric-card">
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <section className="card panel">
            <div className="panel-header">
              <h2>Campaign overview</h2>
              <button className="primary-button small">Create campaign</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>ICP</th>
                  <th>Status</th>
                  <th>Prospects</th>
                  <th>Contacted</th>
                  <th>Engaged</th>
                  <th>Meetings</th>
                  <th>Conversion</th>
                  <th>Agent status</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.icp}</td>
                    <td><span className={`status-badge ${String(c.status).toLowerCase()}`}>{c.status}</span></td>
                    <td>{c.prospects}</td>
                    <td>{c.contacted}</td>
                    <td>{c.qualified}</td>
                    <td>{c.meetings}</td>
                    <td>{c.conversion}%</td>
                    <td>{c.agentStatus}</td>
                    <td>{c.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="content-grid">
            <div className="card panel">
              <div className="panel-header">
                <h2>Prospect pipeline</h2>
              </div>

              <div className="prospect-list">
                {prospects.map((p) => (
                  <div
                    className={`prospect-row ${selectedProspect?.id === p.id ? 'selected' : ''}`}
                    key={p.id}
                    onClick={() => setSelectedProspect(p)}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.title} · {p.company}</small>
                    </div>
                    <span className="status-badge qualified">{p.status}</span>
                    <span>{p.score}</span>
                    <span>{p.campaign}</span>
                    <button
                      className="ghost-button small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(p.id);
                      }}
                      disabled={callingId === p.id}
                    >
                      {callingId === p.id ? 'Calling...' : 'Call'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel detail-panel">
              {selectedProspect ? (
                <>
                  <div className="profile-header">
                    <div className="avatar large">{selectedProspect.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                    <div>
                      <h2>{selectedProspect.name}</h2>
                      <p>{selectedProspect.title} · {selectedProspect.company}</p>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div>
                      <label>Location</label>
                      <strong>{selectedProspect.location || 'Remote'}</strong>
                    </div>
                    <div>
                      <label>ICP score</label>
                      <strong>{selectedProspect.score}</strong>
                    </div>
                    <div>
                      <label>Campaign</label>
                      <strong>{selectedProspect.campaign}</strong>
                    </div>
                    <div>
                      <label>Next action</label>
                      <strong>{selectedProspect.nextAction || 'Manual follow-up'}</strong>
                    </div>
                  </div>
                  <div className="research-box">
                    <h3>AI Research Summary</h3>
                    <p><strong>Company overview:</strong> High-fit enterprise buyer with active AI tooling evaluation.</p>
                    <p><strong>Relevant product fit:</strong> Strong alignment with platform automation and sales workflow orchestration.</p>
                    <p><strong>Possible objections:</strong> Budget, governance, and integration concerns.</p>
                  </div>
                </>
              ) : (
                <p>No prospect selected.</p>
              )}
            </div>
          </section>

          <section className="lower-grid">
            <div className="card panel">
              <div className="panel-header">
                <h2>Live calls</h2>
              </div>
              <div className="stack-list">
                {calls.map((call) => (
                  <div key={call.id} className="list-row">
                    <div>
                      <strong>{call.prospect}</strong>
                      <small>{call.company}</small>
                    </div>
                    <span className="tiny-tag">{call.outcome}</span>
                    <span>{call.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <h2>Approvals</h2>
              </div>
              <div className="stack-list">
                {approvals.map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.prospect}</strong>
                      <small>{item.action}</small>
                    </div>
                    <span className="tiny-tag warning">{item.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <h2>Escalations</h2>
              </div>
              <div className="stack-list">
                {escalations.map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.prospect}</strong>
                      <small>{item.category}</small>
                    </div>
                    <span className="tiny-tag critical">{item.priority}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <h2>Agent network</h2>
              </div>
              <div className="stack-list">
                {agents.map((agent) => (
                  <div key={agent.id} className="agent-row">
                    <div>
                      <strong>{agent.name}</strong>
                      <small>{agent.successRate}% success</small>
                    </div>
                    <span className={`tiny-tag ${agent.status.toLowerCase()}`}>{agent.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="card panel">
              <div className="panel-header">
                <h2>Channel performance</h2>
              </div>
              <div className="metrics-grid">
                {analytics && Object.entries(analytics.channelMetrics).map(([channel, stats]) => (
                  <div key={channel} className="mini-card">
                    <strong>{channel.toUpperCase()}</strong>
                    <div className="chip-row">
                      <span>{stats.sent} sent</span>
                      <span>{stats.replied} replies</span>
                      <span>{stats.meetings} mtgs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <h2>Conversations</h2>
              </div>
              <div className="stack-list">
                {conversations.map((entry) => (
                  <div key={entry.id} className="list-row">
                    <div>
                      <strong>{entry.prospect}</strong>
                      <small>{entry.preview}</small>
                    </div>
                    <span className="tiny-tag">{entry.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <h2>Knowledge base</h2>
              </div>
              <div className="stack-list">
                {knowledge.map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.category}</small>
                    </div>
                    <span className="tiny-tag">{item.source}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      );
    }

    if (activeView === 'Campaigns') {
      return (
        <section className="card panel">
          <div className="panel-header">
            <h2>Campaign library</h2>
            <button className="primary-button small">Create campaign</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Channels</th>
                <th>Prospects</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.owner}</td>
                  <td><span className={`status-badge ${String(c.status).toLowerCase()}`}>{c.status}</span></td>
                  <td>{c.channels.join(', ')}</td>
                  <td>{c.prospects}</td>
                  <td>{c.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }

    if (activeView === 'Prospects') {
      return (
        <section className="content-grid">
          <div className="card panel">
            <div className="panel-header">
              <h2>Prospect pipeline</h2>
            </div>
            <div className="prospect-list">
              {prospects.map((p) => (
                <div className={`prospect-row ${selectedProspect?.id === p.id ? 'selected' : ''}`} key={p.id} onClick={() => setSelectedProspect(p)}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.title} · {p.company}</small>
                  </div>
                  <span className="status-badge qualified">{p.status}</span>
                  <span>{p.score}</span>
                  <span>{p.campaign}</span>
                  <button className="ghost-button small" onClick={(e) => { e.stopPropagation(); handleCall(p.id); }} disabled={callingId === p.id}>{callingId === p.id ? 'Calling...' : 'Call'}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel detail-panel">
            {selectedProspect && (
              <>
                <div className="profile-header">
                  <div className="avatar large">{selectedProspect.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                  <div>
                    <h2>{selectedProspect.name}</h2>
                    <p>{selectedProspect.title} · {selectedProspect.company}</p>
                  </div>
                </div>
                <div className="detail-grid">
                  <div><label>Location</label><strong>{selectedProspect.location || 'Remote'}</strong></div>
                  <div><label>ICP score</label><strong>{selectedProspect.score}</strong></div>
                  <div><label>Campaign</label><strong>{selectedProspect.campaign}</strong></div>
                  <div><label>Next action</label><strong>{selectedProspect.nextAction || 'Manual follow-up'}</strong></div>
                </div>
                <div className="research-box">
                  <h3>AI Research Summary</h3>
                  <p><strong>Company overview:</strong> {selectedProspect.company} is an active fit for the current outbound motion.</p>
                  <p><strong>Likely next step:</strong> {selectedProspect.nextAction || 'Put them back into a nurture sequence'}.</p>
                </div>
              </>
            )}
          </div>
        </section>
      );
    }

    if (activeView === 'Conversations') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Conversations</h2></div>
          <div className="stack-list">
            {conversations.map((entry) => (
              <div key={entry.id} className="list-row">
                <div>
                  <strong>{entry.prospect}</strong>
                  <small>{entry.preview}</small>
                </div>
                <span className="tiny-tag">{entry.status}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeView === 'Calls') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Live calls</h2></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Company</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Agent</th>
                <th>Recording</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>{call.prospect}</td>
                  <td>{call.company}</td>
                  <td>{call.outcome}</td>
                  <td>{call.duration}</td>
                  <td>{call.agent}</td>
                  <td>{call.recording}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }

    if (activeView === 'Approvals') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Approvals</h2></div>
          <div className="stack-list">
            {approvals.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.prospect}</strong>
                  <small>{item.reason}</small>
                </div>
                <span className="tiny-tag warning">{item.risk}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeView === 'Escalations') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Escalations</h2></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Campaign</th>
              </tr>
            </thead>
            <tbody>
              {escalations.map((item) => (
                <tr key={item.id}>
                  <td>{item.prospect}</td>
                  <td>{item.category}</td>
                  <td>{item.priority}</td>
                  <td>{item.status}</td>
                  <td>{item.campaign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }

    if (activeView === 'Knowledge') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Knowledge base</h2></div>
          <div className="stack-list">
            {knowledge.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.category}</small>
                </div>
                <span className="tiny-tag">{item.source}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeView === 'Agents') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Agent network</h2></div>
          <div className="stack-list">
            {agents.map((agent) => (
              <div key={agent.id} className="agent-row">
                <div>
                  <strong>{agent.name}</strong>
                  <small>{agent.successRate}% success · {agent.latency}</small>
                </div>
                <span className={`tiny-tag ${agent.status.toLowerCase()}`}>{agent.status}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeView === 'Analytics') {
      return (
        <section className="card panel">
          <div className="panel-header"><h2>Analytics</h2></div>
          <div className="metrics-grid">
            {analytics && Object.entries(analytics.channelMetrics).map(([channel, stats]) => (
              <div key={channel} className="mini-card">
                <strong>{channel.toUpperCase()}</strong>
                <div className="chip-row">
                  <span>{stats.sent} sent</span>
                  <span>{stats.replied} replies</span>
                  <span>{stats.meetings} mtgs</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Autonomous</strong>
            <span>SDR</span>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${item === activeView ? 'active' : ''}`}
              onClick={() => setActiveView(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">Settings</button>
          <button className="nav-item">Help</button>
          <div className="user-pill">
            <div className="avatar">AM</div>
            <div>
              <strong>Ava Manager</strong>
              <small>ADMIN</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Good morning, Ava</p>
            <h1>Autonomous SDR Overview</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button">Search</button>
            <button className="ghost-button">Command palette</button>
            <button className="primary-button">Call Prospect</button>
          </div>
        </header>

        {notice && <div className="notice-bar">{notice}</div>}

        {loading ? (
          <div className="loading-grid">
            <div className="skeleton card large" />
            <div className="skeleton card" />
            <div className="skeleton card" />
            <div className="skeleton card" />
            <div className="skeleton card wide" />
          </div>
        ) : (
          renderView()
        )}
      </main>
    </div>
  );
}

export default App;
