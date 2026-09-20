import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import * as Icons from "lucide-react";
import {BrowserRouter, useLocation, useNavigate} from "react-router-dom";
import "./styles.css";

const navGroups = [
  {
    label:"MAIN",
    items:[
      ["overview","Overview","LayoutDashboard"],
      ["campaigns","Campaigns","ChartNoAxesCombined"],
      ["prospects","Prospects","Users"],
      ["conversations","Conversations","MessageCircle"],
      ["agents","Agents","Bot"],
      ["tasks","Tasks & approvals","ListChecks"],
      ["analytics","Analytics","ChartSpline"],
      ["integrations","Integrations","PlugZap"],
      ["knowledge","Knowledge","BookOpen"]
    ]
  },
  {
    label:"OTHERS",
    items:[
      ["settings","Settings","Settings"],
      ["help","Help & support","CircleHelp"],
      ["account","Account","CircleUser"]
    ]
  }
];

const agents = [
  ["ICP Fitment","Scoring 6 prospects against ICP v3","182","94%","$0.41","1.8s"],
  ["Research & Enrichment","Enriching Northwind Labs (funding, hiring, stack)","141","97%","$0.68","6.4s"],
  ["Outreach Strategy","Choosing channel and timing for 4 prospects","96","91%","$0.09","1.1s"],
  ["Personalisation","Drafting email for Sarah Chen, cites funding round","88","89%","$0.68","3.9s"],
  ["Conversation","Reading 3 new replies across email and LinkedIn","47","92%","$0.20","2.2s"],
  ["Voice SDR","Idle until 2:00 PM IST call window","12","83%","$0.03","0.9s"],
  ["Follow-up","Queueing 11 day-3 follow-ups","63","95%","$0.07","1.3s"]
];

const stageLabels = {
  discovered:"Discovered",
  researched:"Researched",
  qualified:"Qualified",
  contacted:"Contacted",
  engaged:"Engaged",
  meeting:"Meeting",
  opportunity:"Opportunity",
  rejected:"Rejected"
};

function formatReadableDate(iso) {
  if (!iso) return "Today";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"});
}

function formatRelativeTime(iso) {
  if (!iso) return "Recently";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function normalizeCampaigns(campaigns = [], meetings = []) {
  const meetingMap = meetings.reduce((acc, meeting) => {
    const key = meeting.campaign_id || meeting.campaign?.id;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return campaigns.map((campaign) => {
    const name = campaign.name || "Untitled campaign";
    const status = campaign.status || "draft";
    const geo = campaign.icp_json?.geo || campaign.geo || "Global";
    const size = campaign.icp_json?.company_size || campaign.size || "Not set";
    const roles = Array.isArray(campaign.icp_json?.roles) ? campaign.icp_json.roles : (Array.isArray(campaign.roles) ? campaign.roles : []);
    const industries = Array.isArray(campaign.icp_json?.industries) ? campaign.icp_json.industries : (Array.isArray(campaign.industries) ? campaign.industries : []);
    const prospects = Array.isArray(campaign.prospects) ? campaign.prospects.length : Number(campaign.prospects || 0);
    const contacted = Array.isArray(campaign.prospects)
      ? campaign.prospects.filter((p) => ["contacted","engaged","meeting","opportunity"].includes(p.stage || p.funnel_state)).length
      : 0;

    return {
      id: campaign.id,
      name,
      status,
      prospects,
      contacted,
      meetings: Number(meetingMap[campaign.id] || 0),
      opportunities: Array.isArray(campaign.prospects)
        ? campaign.prospects.filter((p) => (p.stage || p.funnel_state) === "opportunity").length
        : 0,
      rep: campaign.owner || "Unassigned",
      geo,
      roles,
      industries,
      size,
      created: formatReadableDate(campaign.created_at)
    };
  });
}

function normalizeProspects(campaigns = [], campaignLookup = {}) {
  const rows = [];

  campaigns.forEach((campaign) => {
    const items = Array.isArray(campaign.prospects) ? campaign.prospects : [];
    items.forEach((entry) => {
      const p = entry.prospect || entry;
      const funnelStage = entry.funnel_state || entry.stage || "discovered";
      rows.push({
        id: p.id || entry.id,
        name: p.name || "Unknown prospect",
        company: p.company || "Unknown company",
        role: p.title || p.role || "Prospect",
        score: Number(entry.icp_score || p.score || 0),
        stage: funnelStage,
        last: formatRelativeTime(entry.updated_at || p.updated_at),
        campaign: campaignLookup[campaign.id] || campaign.name || "Unassigned",
        channel: entry.context_json?.channel || entry.channel || null,
        ai: entry.context_json?.ai_status || entry.ai || "active"
      });
    });
  });

  return rows;
}

function normalizeConversations(campaigns = []) {
  const rows = [];

  campaigns.forEach((campaign) => {
    const items = Array.isArray(campaign.prospects) ? campaign.prospects : [];
    items.forEach((entry) => {
      const p = entry.prospect || entry;
      const convo = entry.context_json?.last_conversation || entry.last_conversation;
      if (!convo || !convo.reply_text) return;
      rows.push({
        id: `${campaign.id}-${p.id}`,
        who: p.name || "Unknown prospect",
        company: p.company || "Unknown company",
        channel: convo.channel || "email",
        msg: convo.reply_text,
        intent: convo.intent || convo.classification || "positive",
        time: formatRelativeTime(entry.updated_at || p.updated_at),
        campaign: campaign.name || "Unassigned"
      });
    });
  });

  return rows;
}

function normalizeTasks(approvals = []) {
  return approvals.map((approval) => {
    const action = approval.proposed_action_json || {};
    const prospect = approval.prospect || {};
    const campaign = approval.campaign || {};
    const type = action.type || "approval";
    const tag = String(type).replace(/_/g, " ").toUpperCase();

    return {
      id: approval.id,
      tag,
      tone: type.includes("escalat") ? "amber" : type.includes("reply") ? "red" : "purple",
      who: prospect.name || "Unknown prospect",
      sub: `${prospect.title || "Prospect"} · ${prospect.company || "Unknown company"} · ${campaign.name || "Unnamed campaign"}`,
      body: action.summary || action.reason || "Review the proposed next action.",
      why: action.reason || "Human approval is required before continuing."
    };
  });
}

function Icon({name,size=16}) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.7}/>;
}

function initials(name) {
  return name
    .split(" ")
    .map(x => x[0])
    .slice(0,2)
    .join("")
    .toUpperCase();
}

function Badge({children,tone=""}) {
  return (
    <span className={`pill ${tone}`}>
      <i className="dot"/>
      {children}
    </span>
  );
}

function Tag({children,tone=""}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

function Avatar({name}) {
  return <span className="avatar">{initials(name)}</span>;
}

function App() {
  const nav = useNavigate();
  const loc = useLocation();

  const page = loc.pathname.slice(1) || "overview";

  const [theme,setTheme] = useState(
    () => localStorage.getItem("sdr-theme") || "dark"
  );

  const [collapsed,setCollapsed] = useState(
    () => localStorage.getItem("sdr-collapsed") === "1"
  );

  const [killed,setKilled] = useState(false);
  const [campaigns,setCampaigns] = useState([]);
  const [prospects,setProspects] = useState([]);
  const [convos,setConvos] = useState([]);
  const [tasks,setTasks] = useState([]);
  const [search,setSearch] = useState("");
  const [toast,setToast] = useState("");
  const [modal,setModal] = useState(null);
  const [drawer,setDrawer] = useState(null);
  const [integrationStatus,setIntegrationStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("sdr-theme",theme);
  },[theme]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [campaignsRes, meetingsRes, approvalsRes, killSwitchRes, servicesRes] = await Promise.all([
          fetch("/campaigns").then((res) => res.ok ? res.json() : []),
          fetch("/meetings").then((res) => res.ok ? res.json() : []),
          fetch("/approvals?status=pending").then((res) => res.ok ? res.json() : []),
          fetch("/global-settings/kill-switch").then((res) => res.ok ? res.json() : { kill_switch_on: false }),
          fetch("/health/services").then((res) => res.ok ? res.json() : { services: [] })
        ]);

        const campaignList = Array.isArray(campaignsRes) ? campaignsRes : [];
        const meetings = Array.isArray(meetingsRes) ? meetingsRes : [];
        const approvals = Array.isArray(approvalsRes) ? approvalsRes : [];
        const normalizedCampaigns = normalizeCampaigns(campaignList, meetings);
        const campaignLookup = Object.fromEntries(normalizedCampaigns.map((campaign) => [campaign.id, campaign.name]));

        const enrichedCampaigns = await Promise.all(campaignList.map(async (campaign) => {
          try {
            const res = await fetch(`/campaigns/${campaign.id}/campaign-prospects`);
            if (!res.ok) return { ...campaign, prospects: [] };
            const items = await res.json();
            return { ...campaign, prospects: items || [] };
          } catch (err) {
            return { ...campaign, prospects: [] };
          }
        }));

        const normalizedProspects = normalizeProspects(enrichedCampaigns, campaignLookup);
        const normalizedConvos = normalizeConversations(enrichedCampaigns);

        if (!active) return;
        setCampaigns(normalizedCampaigns);
        setProspects(normalizedProspects);
        setConvos(normalizedConvos);
        setTasks(normalizeTasks(approvals));
        setKilled(Boolean(killSwitchRes && killSwitchRes.kill_switch_on));
        setIntegrationStatus((servicesRes && servicesRes.integrations) || {});
        setLoading(false);
      } catch (error) {
        if (!active) return;
        setCampaigns([]);
        setProspects([]);
        setConvos([]);
        setTasks([]);
        setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sdr-collapsed",
      collapsed ? "1" : "0"
    );
  },[collapsed]);

  useEffect(() => {
    if(!toast) return;

    const t = setTimeout(
      () => setToast(""),
      2400
    );

    return () => clearTimeout(t);
  },[toast]);

  const go = p => nav(`/${p}`);

  const toggleCampaign = id => {
    setCampaigns(cs =>
      cs.map(c =>
        c.id === id
          ? {
              ...c,
              status:
                c.status === "live"
                  ? "paused"
                  : "live"
            }
          : c
      )
    );

    setToast("Campaign status updated");
  };

  const approveTask = id => {
    setTasks(ts => ts.filter(t => t.id !== id));
    setToast("Approval approved");
  };

  const rejectTask = id => {
    setTasks(ts => ts.filter(t => t.id !== id));
    setToast("Approval rejected");
  };

  const createCampaign = data => {
    const c = {
      id:`c${Date.now()}`,
      status:"draft",
      prospects:0,
      contacted:0,
      meetings:0,
      opportunities:0,
      rep:"Unassigned",
      created:"Today",
      ...data
    };

    setCampaigns(x => [c,...x]);
    setModal(null);
    setToast("Campaign created");
    go("campaigns");
  };

  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <Sidebar
        page={page}
        go={go}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        tasks={tasks.length}
      />

      <main className="main">
        <Topbar
          search={search}
          setSearch={setSearch}
          theme={theme}
          setTheme={setTheme}
          killed={killed}
          setKilled={setKilled}
          tasks={tasks.length}
          go={go}
        />

        <div className="content">
          {page === "overview" && (
            <Overview
              campaigns={campaigns}
              prospects={prospects}
              tasks={tasks}
              go={go}
            />
          )}

          {page === "campaigns" && (
            <Campaigns
              campaigns={campaigns}
              toggleCampaign={toggleCampaign}
              setModal={setModal}
              setDrawer={setDrawer}
            />
          )}

          {page === "prospects" && (
            <Prospects
              prospects={prospects}
              search={search}
              setDrawer={setDrawer}
            />
          )}

          {page === "conversations" && (
            <Conversations
              convos={convos}
              search={search}
              setDrawer={setDrawer}
            />
          )}

          {page === "agents" && (
            <Agents
              killed={killed}
              setDrawer={setDrawer}
            />
          )}

          {page === "tasks" && (
            <Tasks
              tasks={tasks}
              approveTask={approveTask}
              rejectTask={rejectTask}
            />
          )}

          {page === "analytics" && (
            <Analytics
              campaigns={campaigns}
              prospects={prospects}
            />
          )}

          {page === "integrations" && (
            <Integrations setToast={setToast} integrations={integrationStatus}/>
          )}

          {page === "knowledge" && (
            <Knowledge setToast={setToast}/>
          )}

          {page === "settings" && (
            <Settings
              killed={killed}
              setKilled={setKilled}
              setToast={setToast}
            />
          )}

          {page === "help" && <Help/>}
          {page === "account" && <Account/>}
        </div>
      </main>

      {modal?.type === "campaign" && (
        <CampaignModal
          onClose={() => setModal(null)}
          onCreate={createCampaign}
        />
      )}

      {drawer && (
        <Drawer
          data={drawer}
          onClose={() => setDrawer(null)}
          setToast={setToast}
        />
      )}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  page,
  go,
  collapsed,
  setCollapsed,
  tasks
}) {
  return (
    <aside className="side">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="Activity" size={22}/>
        </span>
        <u>SDR OS</u>
      </div>

      {navGroups.map(g =>
        <React.Fragment key={g.label}>
          <div className="nav-label">{g.label}</div>

          <div className="nav">
            {g.items.map(([id,label,icon]) =>
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={
                  page === id
                    ? "page"
                    : undefined
                }
                title={label}
              >
                <Icon name={icon}/>
                <span>{label}</span>

                {id === "tasks" &&
                  tasks > 0 &&
                  <b className="badge">{tasks}</b>
                }
              </button>
            )}
          </div>
        </React.Fragment>
      )}

      <div className="side-bottom">
        <div className="sys">
          <div className="sys-row">
            <i className="dot pulse"/>
            <span className="txt">
              All systems operational
            </span>
          </div>

          <div className="sys-sub txt">
            3 of 3 services healthy
          </div>

          <div className="spend">
            <span>AI spend today</span>
            <b>$4.18</b>

            <div className="meter">
              <i style={{width:"8%"}}/>
            </div>
          </div>
        </div>

        <div className="me">
          <Avatar name="Madhav"/>

          <div className="txt">
            <b>Madhav</b>
            <small>Workspace admin</small>
          </div>
        </div>

        <button
          className="side-collapse"
          onClick={() => setCollapsed(x => !x)}
        >
          <Icon
            name={
              collapsed
                ? "ChevronRight"
                : "ChevronLeft"
            }
          />

          <span className="lbl">
            {collapsed ? "Expand" : "Collapse"}
          </span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  search,
  setSearch,
  theme,
  setTheme,
  killed,
  setKilled,
  tasks,
  go
}) {
  return (
    <header className="top">
      <div className="search">
        <Icon name="Search" size={15}/>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search campaigns, prospects…"
        />

        <kbd>⌘K</kbd>
      </div>

      <div className="grow"/>

      <span className="ind">
        <i className="dot pulse"/>
        System operational
      </span>

      <span className={`ind ${killed ? "bad" : ""}`}>
        <i className="dot"/>
        {killed ? "AI paused" : "AI working"}
      </span>

      <button
        className="icon-btn"
        onClick={() =>
          setTheme(
            theme === "light"
              ? "dark"
              : "light"
          )
        }
        title="Toggle theme"
      >
        <Icon
          name={
            theme === "light"
              ? "Moon"
              : "Sun"
          }
          size={17}
        />
      </button>

      <button
        className="icon-btn notif"
        onClick={() => go("tasks")}
      >
        <Icon name="Bell" size={17}/>
        {tasks > 0 && <i/>}
      </button>

      <button
        className={`kill ${killed ? "on" : ""}`}
        onClick={() => setKilled(x => !x)}
      >
        <Icon
          name={killed ? "Play" : "Pause"}
          size={15}
        />

        {killed
          ? "Paused — resume"
          : "Global pause"}
      </button>
    </header>
  );
}

function PageHeader({title,sub,children}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-t">{title}</h1>

        {sub &&
          <p className="mute">{sub}</p>
        }
      </div>

      {children}
    </div>
  );
}

function Overview({
  campaigns,
  prospects,
  tasks,
  go
}) {
  const live =
    campaigns.filter(
      c => c.status === "live"
    ).length;

  const total = prospects.length;

  const contacted =
    prospects.filter(p =>
      [
        "contacted",
        "engaged",
        "meeting",
        "opportunity"
      ].includes(p.stage)
    ).length;

  const meetings =
    campaigns.reduce(
      (a,c) => a + c.meetings,
      0
    );

  const opp =
    campaigns.reduce(
      (a,c) => a + c.opportunities,
      0
    );

  const kpis = [
    [
      total,
      "Prospects in pipeline",
      "+4 today"
    ],
    [
      contacted,
      "Contacted",
      "18 dispatched today"
    ],
    [
      `${live} of ${campaigns.length}`,
      "Campaigns live",
      `${campaigns.filter(c => c.status === "paused").length} paused, ${campaigns.filter(c => c.status === "draft").length} draft`
    ],
    [
      tasks.length,
      "Needs attention",
      "pending approvals"
    ],
    [
      meetings,
      "Meetings booked",
      "6 with a time set"
    ],
    [
      opp,
      "Qualified opportunities",
      `of ${total} prospects`
    ]
  ];

  return (
    <>
      <PageHeader
        title="Good morning"
        sub="Here's what your agents did while you were away."
      >
        <button
          className="btn accent"
          onClick={() => go("campaigns")}
        >
          <Icon name="Plus" size={14}/>
          New campaign
        </button>
      </PageHeader>

      <div className="grid g6 kpis">
        {kpis.map(([v,l,d]) =>
          <div className="card kpi" key={l}>
            <div className="v num">{v}</div>
            <div className="l">{l}</div>
            <div className="d">
              <Icon name="ArrowUp" size={11}/>
              {d}
            </div>
          </div>
        )}
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="card-h">
            <h3>Prospects, last 12 months</h3>
          </div>

          <div className="card-b">
            <MiniLine/>
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h3>Meetings booked, per campaign</h3>
          </div>

          <div className="card-b">
            <Bars
              items={campaigns
                .filter(c => c.status !== "draft")
                .map(c => [
                  c.name,
                  c.meetings
                ])
              }
            />
          </div>
        </section>
      </div>

      <section className="card section-gap">
        <div className="card-h">
          <h3>Live agent activity</h3>
          <Badge tone="live">Streaming</Badge>
        </div>

        {[
          "Scored Sarah Chen against ICP v3",
          "Enriched Northwind Labs",
          "Drafted email for Sarah Chen",
          "Classified reply from Arjun Mehta",
          "Queued 11 day-3 follow-ups"
        ].map((x,i) =>
          <div className="feed" key={x}>
            <span className="feed-icon">
              <Icon
                name={[
                  "Bot",
                  "Search",
                  "Mail",
                  "MessageCircle",
                  "Clock3"
                ][i]}
                size={15}
              />
            </span>

            <div>
              <b>{x}</b>

              <small>
                {[
                  "Sarah Chen · US SaaS CTO",
                  "Northwind Labs · US SaaS CTO",
                  "Sarah Chen · US SaaS CTO",
                  "Arjun Mehta · India BFSI CIO",
                  "Voice AI Founders"
                ][i]}
              </small>
            </div>

            <time>
              {[
                "4s",
                "9s",
                "12s",
                "31s",
                "1m"
              ][i]} ago
            </time>
          </div>
        )}
      </section>
    </>
  );
}

function MiniLine() {
  return (
    <div className="line-chart">
      <svg
        viewBox="0 0 600 180"
        preserveAspectRatio="none"
      >
        <path
          d="M0 142 C45 135 52 110 92 118 S145 145 180 106 S230 94 258 116 S300 75 330 88 S380 115 412 65 S465 76 492 50 S550 40 600 20"
          fill="none"
          stroke="var(--blue)"
          strokeWidth="3"
        />

        <path
          d="M0 160 H600"
          stroke="var(--line2)"
        />
      </svg>

      <div className="chart-labels">
        <span>Oct</span>
        <span>Jan</span>
        <span>Apr</span>
        <span>Jul</span>
        <span>Sep</span>
      </div>
    </div>
  );
}

function Bars({items}) {
  const max =
    Math.max(
      1,
      ...items.map(x => x[1])
    );

  return (
    <div className="bars">
      {items.map(([n,v]) =>
        <div className="b" key={n}>
          <i
            style={{
              height:`${30 + v / max * 100}px`
            }}
          >
            <span className="v">{v}</span>
          </i>

          <span className="bar-label">
            {n}
          </span>
        </div>
      )}
    </div>
  );
}

function Campaigns({
  campaigns,
  toggleCampaign,
  setModal,
  setDrawer
}) {
  const [filter,setFilter] =
    useState("all");

  const shown =
    filter === "all"
      ? campaigns
      : campaigns.filter(
          c => c.status === filter
        );

  return (
    <>
      <PageHeader
        title="Campaigns"
        sub="Build, launch and monitor autonomous outbound campaigns."
      >
        <button
          className="btn accent"
          onClick={() =>
            setModal({type:"campaign"})
          }
        >
          <Icon name="Plus" size={14}/>
          New campaign
        </button>
      </PageHeader>

      <div className="filters">
        {[
          "all",
          "live",
          "paused",
          "draft"
        ].map(x =>
          <button
            key={x}
            aria-pressed={filter === x}
            onClick={() => setFilter(x)}
          >
            {x[0].toUpperCase() +
              x.slice(1)}
          </button>
        )}
      </div>

      <div className="grid gauto">
        {shown.map(c =>
          <div
            className="card camp-card"
            key={c.id}
            onClick={() =>
              setDrawer({
                type:"campaign",
                campaign:c
              })
            }
          >
            <div className="camp-top">
              <Badge tone={c.status}>
                {c.status}
              </Badge>

              <button
                className="icon-btn"
                onClick={e => {
                  e.stopPropagation();
                  toggleCampaign(c.id);
                }}
                title="Toggle live/pause"
              >
                <Icon
                  name={
                    c.status === "live"
                      ? "Pause"
                      : "Play"
                  }
                  size={15}
                />
              </button>
            </div>

            <h3>{c.name}</h3>

            <p className="mute">
              {c.geo} · {c.size}
            </p>

            <div className="camp-stats">
              <span>
                <b>{c.prospects}</b> prospects
              </span>

              <span>
                <b>{c.contacted}</b> contacted
              </span>

              <span>
                <b>{c.meetings}</b> meetings
              </span>
            </div>

            <div className="funnel">
              <i
                style={{
                  width:`${Math.min(
                    100,
                    c.prospects / 50 * 100
                  )}%`
                }}
              />

              <i
                style={{
                  width:`${Math.min(
                    100,
                    c.contacted / 50 * 100
                  )}%`
                }}
              />

              <i
                style={{
                  width:`${Math.min(
                    100,
                    c.meetings / 10 * 100
                  )}%`
                }}
              />
            </div>

            <small className="mute">
              {c.rep} · Created {c.created}
            </small>
          </div>
        )}
      </div>
    </>
  );
}

function Prospects({
  prospects,
  search,
  setDrawer
}) {
  const [stage,setStage] =
    useState("all");

  const rows =
    prospects.filter(p =>
      (stage === "all" ||
        p.stage === stage) &&
      `${p.name} ${p.company} ${p.role} ${p.campaign}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <>
      <PageHeader
        title="Prospects"
        sub="Every prospect across your campaigns."
      />

      <div className="filters">
        {[
          "all",
          "discovered",
          "researched",
          "qualified",
          "contacted",
          "engaged",
          "meeting",
          "opportunity"
        ].map(x =>
          <button
            key={x}
            aria-pressed={stage === x}
            onClick={() => setStage(x)}
          >
            {x === "all"
              ? "All"
              : stageLabels[x]}
          </button>
        )}
      </div>

      <section className="card">
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Company</th>
                <th>ICP score</th>
                <th>Stage</th>
                <th>Channel</th>
                <th>AI status</th>
                <th>Last activity</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(p =>
                <tr
                  className="row"
                  key={p.id}
                  onClick={() =>
                    setDrawer({
                      type:"prospect",
                      prospect:p
                    })
                  }
                >
                  <td>
                    <div className="person">
                      <Avatar name={p.name}/>

                      <div>
                        <b>{p.name}</b>
                        <small>{p.role}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {p.company}
                    <small>{p.campaign}</small>
                  </td>

                  <td>
                    <strong>{p.score}</strong>
                  </td>

                  <td>
                    <Badge
                      tone={
                        p.stage === "engaged" ||
                        p.stage === "meeting" ||
                        p.stage === "opportunity"
                          ? "live"
                          : p.stage === "qualified"
                            ? "done"
                            : ""
                      }
                    >
                      {stageLabels[p.stage]}
                    </Badge>
                  </td>

                  <td>
                    {p.channel
                      ? <>
                          <Icon
                            name={
                              p.channel === "linkedin"
                                ? "Linkedin"
                                : p.channel === "voice"
                                  ? "Mic"
                                  : "Mail"
                            }
                            size={14}
                          />
                          {" "}
                          {p.channel}
                        </>
                      : "—"}
                  </td>

                  <td>
                    <Badge
                      tone={
                        p.ai === "needs-human"
                          ? "paused"
                          : p.ai === "handed-off"
                            ? "done"
                            : p.ai === "rejected"
                              ? "danger"
                              : ""
                      }
                    >
                      {p.ai}
                    </Badge>
                  </td>

                  <td>{p.last}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Conversations({
  convos,
  search,
  setDrawer
}) {
  const [tab,setTab] =
    useState("all");

  const rows =
    convos.filter(c =>
      (tab === "all" ||
        c.intent === tab) &&
      `${c.who} ${c.company} ${c.msg}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <>
      <PageHeader
        title="Conversations"
        sub="Replies classified by the conversation agent."
      />

      <div className="tabs">
        {[
          "all",
          "positive",
          "not-now",
          "unsubscribe"
        ].map(x =>
          <button
            key={x}
            aria-selected={tab === x}
            onClick={() => setTab(x)}
          >
            {x === "not-now"
              ? "Not now"
              : x[0].toUpperCase() +
                x.slice(1)}
          </button>
        )}
      </div>

      <section className="card">
        {rows.map(c =>
          <div
            className="conversation"
            key={c.id}
            onClick={() =>
              setDrawer({
                type:"conversation",
                conversation:c
              })
            }
          >
            <div className="person">
              <Avatar name={c.who}/>

              <div>
                <b>{c.who}</b>
                <small>
                  {c.company} · {c.campaign}
                </small>
              </div>
            </div>

            <span className="channel">
              <Icon
                name={
                  c.channel === "linkedin"
                    ? "Linkedin"
                    : c.channel === "voice"
                      ? "Mic"
                      : "Mail"
                }
                size={14}
              />
              {c.channel}
            </span>

            <p>{c.msg}</p>

            <Tag
              tone={
                c.intent === "positive"
                  ? "green"
                  : c.intent === "unsubscribe"
                    ? "red"
                    : c.intent === "not-now"
                      ? "amber"
                      : "purple"
              }
            >
              {c.intent}
            </Tag>

            <time>{c.time}</time>
          </div>
        )}
      </section>
    </>
  );
}

function Agents({
  killed,
  setDrawer
}) {
  return (
    <>
      <PageHeader
        title="Agents"
        sub="Autonomous workers and their current health."
      />

      <div className="grid g3">
        {agents.map(
          (
            [name,task,proc,ok,cost,lat],
            i
          ) =>
            <div
              className="card agent-card"
              key={name}
              onClick={() =>
                setDrawer({
                  type:"agent",
                  agent:{
                    name,
                    task,
                    proc,
                    ok,
                    cost,
                    lat
                  }
                })
              }
            >
              <div className="agent-head">
                <span className="agent-icon">
                  <Icon
                    name={[
                      "ChartSpline",
                      "Search",
                      "Zap",
                      "Mail",
                      "MessageCircle",
                      "Mic",
                      "Clock3"
                    ][i]}
                    size={17}
                  />
                </span>

                <Badge
                  tone={
                    killed
                      ? "paused"
                      : "live"
                  }
                >
                  {killed
                    ? "Paused"
                    : "Running"}
                </Badge>
              </div>

              <h3>{name}</h3>
              <p>{task}</p>

              <div className="agent-metrics">
                <span>
                  <b>{proc}</b> processed
                </span>

                <span>
                  <b>{ok}</b> success
                </span>

                <span>
                  <b>{cost}</b> cost
                </span>

                <span>
                  <b>{lat}</b> latency
                </span>
              </div>
            </div>
        )}
      </div>
    </>
  );
}

function Tasks({
  tasks,
  approveTask,
  rejectTask
}) {
  return (
    <>
      <PageHeader
        title="Tasks & approvals"
        sub="Human-in-the-loop decisions waiting for you."
      />

      <div className="task-list">
        {tasks.length
          ? tasks.map(t =>
              <div
                className="card task-card"
                key={t.id}
              >
                <Tag tone={t.tone}>
                  {t.tag}
                </Tag>

                <h3>{t.who}</h3>

                <p className="mute">
                  {t.sub}
                </p>

                <div className="task-body">
                  {t.body}
                </div>

                <div className="why">
                  <b>Why the agent paused</b>
                  <p>{t.why}</p>
                </div>

                <div className="modal-f">
                  <button
                    className="btn danger"
                    onClick={() =>
                      rejectTask(t.id)
                    }
                  >
                    Reject
                  </button>

                  <button
                    className="btn primary"
                    onClick={() =>
                      approveTask(t.id)
                    }
                  >
                    Approve
                  </button>
                </div>
              </div>
            )
          : <div className="empty">
              No pending approvals.
            </div>
        }
      </div>
    </>
  );
}

function Analytics({
  campaigns,
  prospects
}) {
  const contacted =
    prospects.filter(p =>
      [
        "contacted",
        "engaged",
        "meeting",
        "opportunity"
      ].includes(p.stage)
    ).length;

  return (
    <>
      <PageHeader
        title="Analytics"
        sub="Campaign performance and AI operating costs."
      />

      <div className="grid g4">
        {[
          ["Outbound sent","64"],
          ["Reply rate","21.9%"],
          ["Meetings","12"],
          ["AI spend","$4.18"]
        ].map(x =>
          <div
            className="card kpi"
            key={x[0]}
          >
            <div className="v">
              {x[1]}
            </div>

            <div className="l">
              {x[0]}
            </div>

            <div className="d">
              {x[0] === "Outbound sent"
                ? `${contacted} prospects contacted`
                : "vs previous period"}
            </div>
          </div>
        )}
      </div>

      <div className="grid g2 section-gap">
        <section className="card">
          <div className="card-h">
            <h3>Funnel by campaign</h3>
          </div>

          <div className="card-b">
            {campaigns.map(c =>
              <div
                className="metric-row"
                key={c.id}
              >
                <span>{c.name}</span>

                <div className="metric-track">
                  <i
                    style={{
                      width:`${Math.min(
                        100,
                        c.prospects / 50 * 100
                      )}%`
                    }}
                  />
                </div>

                <b>{c.prospects}</b>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h3>Cost efficiency</h3>
          </div>

          <div className="card-b">
            <div className="kv">
              <span>Cost / prospect</span>
              <b>$0.084</b>

              <span>Cost / qualified</span>
              <b>$0.42</b>

              <span>Cost / conversation</span>
              <b>$0.61</b>

              <span>Estimated today</span>
              <b>$4.18</b>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Integrations({setToast, integrations = {}}) {
  const normalized = Object.entries(integrations).length
    ? Object.entries(integrations).map(([key, value]) => ({
        name: key === "gmail"
          ? "Gmail"
          : key === "groq"
            ? "Groq"
            : key === "tavily"
              ? "Tavily"
              : key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        desc: value?.detail || "Connection status",
        connected: Boolean(value?.connected)
      }))
    : [
        { name: "Gmail", desc: "Send and read email", connected: true },
        { name: "Groq", desc: "Model inference", connected: false },
        { name: "Tavily", desc: "Web research", connected: false }
      ];

  return (
    <>
      <PageHeader
        title="Integrations"
        sub=""
      />

      <div className="integrations-shell">
        <div className="integrations-copy">
          Credentials live here once and are shared by every campaign.
        </div>

        <div className="integration-grid">
          {normalized.map((item) => (
            <div className="integration-card" key={item.name}>
              <div className="integration-header">
                <div className="integration-content">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>

              <div className="integration-footer">
                <span className={`state-pill ${item.connected ? "connected" : "not-connected"}`}>
                  {item.connected ? "Connected" : "Not connected"}
                </span>

                <button className="integration-manage" onClick={() => setToast(`${item.name} connection flow opened`)}>
                  {item.connected ? "Manage" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Knowledge({setToast}) {
  const docs = [
    ["Product overview","Product info","3 campaigns"],
    ["Example emails","Outreach examples","3 campaigns"],
    ["Case study — Northline Data","Case study","1 campaign"],
    ["Case study — Kavach Financial","Case study","1 campaign"],
    ["Case study — Fernway AI","Case study","1 campaign"],
    ["Objection handling","Playbook","3 campaigns"],
    ["Voice call script","Script","1 campaign"]
  ];

  return (
    <>
      <PageHeader
        title="Knowledge"
        sub="Source material agents can use for research and personalization."
      >
        <button
          className="btn accent"
          onClick={() =>
            setToast("Upload flow opened")
          }
        >
          <Icon name="Plus" size={14}/>
          Add document
        </button>
      </PageHeader>

      <section className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Used by</th>
              <th/>
            </tr>
          </thead>

          <tbody>
            {docs.map(d =>
              <tr key={d[0]}>
                <td>
                  <b>{d[0]}</b>
                </td>

                <td>
                  <Tag>{d[1]}</Tag>
                </td>

                <td>{d[2]}</td>

                <td>
                  <button
                    className="btn sm"
                    onClick={() =>
                      setToast(
                        `Opened ${d[0]}`
                      )
                    }
                  >
                    Open
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Settings({
  killed,
  setKilled,
  setToast
}) {
  const [auto,setAuto] =
    useState(false);

  const [guard,setGuard] =
    useState(true);

  const [email,setEmail] =
    useState(true);

  const [linkedin,setLinkedin] =
    useState(true);

  return (
    <>
      <PageHeader
        title="Settings"
        sub="Workspace controls, guardrails and global channel settings."
      />

      <div className="grid g2">
        <section className="card">
          <div className="card-h">
            <h3>Automation</h3>
          </div>

          <div className="card-b">
            <SwitchRow
              label="Autonomous mode"
              sub="Allow agents to execute approved playbooks automatically."
              value={auto}
              setValue={setAuto}
            />

            <SwitchRow
              label="Global guardrails"
              sub="Require human approval for risky or ambiguous actions."
              value={guard}
              setValue={setGuard}
            />

            <SwitchRow
              label="Email"
              sub="Permit agents to dispatch email."
              value={email}
              setValue={setEmail}
            />

            <SwitchRow
              label="LinkedIn"
              sub="Permit agents to use LinkedIn."
              value={linkedin}
              setValue={setLinkedin}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h3>Emergency controls</h3>
          </div>

          <div className="card-b">
            <div className="danger-box">
              <b>Global AI pause</b>

              <p>
                Stops autonomous work across all campaigns.
              </p>

              <button
                className={`btn ${
                  killed
                    ? "primary"
                    : "danger"
                }`}
                onClick={() => {
                  setKilled(x => !x);
                  setToast(
                    killed
                      ? "AI resumed"
                      : "AI paused"
                  );
                }}
              >
                {killed
                  ? "Resume AI"
                  : "Pause all AI"}
              </button>
            </div>

            <div className="field">
              <label>
                Daily AI spend budget
              </label>

              <input defaultValue="50"/>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SwitchRow({
  label,
  sub,
  value,
  setValue
}) {
  return (
    <div className="row-sw">
      <div>
        <b>{label}</b>
        <small>{sub}</small>
      </div>

      <button
        className="sw"
        aria-checked={value}
        onClick={() =>
          setValue(!value)
        }
      >
        <i/>
      </button>
    </div>
  );
}

function Help() {
  return (
    <>
      <PageHeader
        title="Help & support"
        sub="Quick answers for operating SDR OS."
      />

      <div className="grid g2">
        {[
          [
            "How does autonomous mode work?",
            "Agents can research, score, personalize and queue actions while respecting global guardrails."
          ],
          [
            "What does Global pause do?",
            "It stops autonomous dispatch and puts active work into a paused state."
          ],
          [
            "How are approvals handled?",
            "Ambiguous or high-impact actions appear in Tasks & approvals until a human approves or rejects them."
          ],
          [
            "Where does campaign data live?",
            "This React reference build stores demo state in memory and localStorage; connect your API to persist production data."
          ]
        ].map(x =>
          <div
            className="card faq"
            key={x[0]}
          >
            <h3>{x[0]}</h3>
            <p>{x[1]}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Account() {
  return (
    <>
      <PageHeader
        title="Account"
        sub="Workspace identity and preferences."
      />

      <section className="card account-card">
        <Avatar name="Madhav"/>

        <div>
          <h2>Madhav</h2>
          <p className="mute">
            Workspace admin
          </p>
          <p className="mute">
            SDR OS demo workspace
          </p>
        </div>

        <button
          className="btn"
          onClick={() =>
            alert(
              "Profile editor is available in this reference build."
            )
          }
        >
          Edit profile
        </button>
      </section>
    </>
  );
}

function CampaignModal({
  onClose,
  onCreate
}) {
  const [name,setName] =
    useState("");

  const [geo,setGeo] =
    useState("United States");

  const [role,setRole] =
    useState("CTO");

  const [industry,setIndustry] =
    useState("SaaS");

  return (
    <div
      className="overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={e =>
          e.stopPropagation()
        }
      >
        <h2>New campaign</h2>

        <p className="mute">
          Create a campaign from the same visual language as the reference.
        </p>

        <div className="field">
          <label>Campaign name</label>

          <input
            autoFocus
            value={name}
            onChange={e =>
              setName(e.target.value)
            }
            placeholder="e.g. EU SaaS CTO"
          />
        </div>

        <div className="field">
          <label>Geography</label>

          <input
            value={geo}
            onChange={e =>
              setGeo(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Primary role</label>

          <input
            value={role}
            onChange={e =>
              setRole(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Industry</label>

          <input
            value={industry}
            onChange={e =>
              setIndustry(e.target.value)
            }
          />
        </div>

        <div className="modal-f">
          <button
            className="btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn primary"
            disabled={!name.trim()}
            onClick={() =>
              onCreate({
                name:name.trim(),
                geo,
                roles:[role],
                industries:[industry],
                size:"50-500 employees"
              })
            }
          >
            Create campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function Drawer({
  data,
  onClose,
  setToast
}) {
  const title =
    data.type === "campaign"
      ? data.campaign.name
      : data.type === "prospect"
        ? data.prospect.name
        : data.type === "conversation"
          ? data.conversation.who
          : data.type === "agent"
            ? data.agent.name
            : "Details";

  return (
    <>
      <div
        className="overlay drawer-overlay"
        onMouseDown={onClose}
      />

      <aside className="drawer">
        <div className="drawer-h">
          <h2>{title}</h2>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="X"/>
          </button>
        </div>

        <div className="drawer-b">
          {data.type === "campaign" &&
            <>
              <Badge tone={data.campaign.status}>
                {data.campaign.status}
              </Badge>

              <div className="drawer-grid">
                <b>Prospects</b>
                <span>
                  {data.campaign.prospects}
                </span>

                <b>Contacted</b>
                <span>
                  {data.campaign.contacted}
                </span>

                <b>Meetings</b>
                <span>
                  {data.campaign.meetings}
                </span>

                <b>Opportunities</b>
                <span>
                  {data.campaign.opportunities}
                </span>

                <b>Geo</b>
                <span>
                  {data.campaign.geo}
                </span>

                <b>Roles</b>
                <span>
                  {data.campaign.roles.join(", ")}
                </span>
              </div>

              <button
                className="btn primary"
                onClick={() =>
                  setToast("Campaign opened")
                }
              >
                Open campaign
              </button>
            </>
          }

          {data.type === "prospect" &&
            <>
              <Badge tone="live">
                {stageLabels[
                  data.prospect.stage
                ]}
              </Badge>

              <div className="sec">
                <h4>Profile</h4>

                <dl className="kv">
                  <dt>Company</dt>
                  <dd>
                    {data.prospect.company}
                  </dd>

                  <dt>Role</dt>
                  <dd>
                    {data.prospect.role}
                  </dd>

                  <dt>ICP score</dt>
                  <dd>
                    {data.prospect.score}
                  </dd>

                  <dt>Campaign</dt>
                  <dd>
                    {data.prospect.campaign}
                  </dd>

                  <dt>AI status</dt>
                  <dd>
                    {data.prospect.ai}
                  </dd>

                  <dt>Last activity</dt>
                  <dd>
                    {data.prospect.last}
                  </dd>
                </dl>
              </div>

              <button
                className="btn accent"
                onClick={() =>
                  setToast(
                    "Next action queued"
                  )
                }
              >
                Queue next action
              </button>
            </>
          }

          {data.type === "conversation" &&
            <>
              <Tag
                tone={
                  data.conversation.intent ===
                  "positive"
                    ? "green"
                    : "amber"
                }
              >
                {data.conversation.intent}
              </Tag>

              <div className="message-box">
                {data.conversation.msg}
              </div>

              <div className="sec">
                <h4>Suggested next step</h4>

                <p>
                  Review the reply, then approve the next campaign action.
                </p>
              </div>

              <button
                className="btn primary"
                onClick={() =>
                  setToast(
                    "Reply workflow opened"
                  )
                }
              >
                Review reply
              </button>
            </>
          }

          {data.type === "agent" &&
            <>
              <Badge tone="live">
                Running
              </Badge>

              <div className="sec">
                <h4>Current task</h4>
                <p>{data.agent.task}</p>
              </div>

              <div className="drawer-grid">
                <b>Processed</b>
                <span>{data.agent.proc}</span>

                <b>Success</b>
                <span>{data.agent.ok}</span>

                <b>Cost</b>
                <span>{data.agent.cost}</span>

                <b>Latency</b>
                <span>{data.agent.lat}</span>
              </div>
            </>
          }
        </div>
      </aside>
    </>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <BrowserRouter>
    <App/>
  </BrowserRouter>
);