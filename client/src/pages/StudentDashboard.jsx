import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GitBranch,
  ClipboardList, LogOut, TrendingUp, TrendingDown,
  Clock, Send, Lock, Unlock, ChevronDown, AlertCircle, CheckCircle, Shield, Zap, X,
  Mail, Phone, HelpCircle, Menu
} from 'lucide-react';
import { auth, api } from '../api.js';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_TEAM = {
  name: 'Team Alpha', progress: 62, locked: true,
  members: [
    { id: '1', name: 'Arjun Sharma', role: 'Team Lead' },
    { id: '2', name: 'Priya Patel',  role: 'Developer'  },
    { id: '3', name: 'Ravi Kumar',   role: 'Designer'   },
  ],
  gitRepo: '',
};
const MOCK_MSGS = [
  { id: 1, username: 'Priya Patel',  content: 'Auth API is done 🎉', mine: false, time: '09:15' },
  { id: 2, username: 'You',          content: 'Nice! Starting on the dashboard UI now', mine: true, time: '09:18' },
  { id: 3, username: 'Priya Patel',  content: 'Designs are in Figma, check #design', mine: false, time: '09:22' },
];
// ─── Kanban ───────────────────────────────────────────────────────────────────
const COLS = ['TODO', 'IN PROGRESS', 'DONE'];
const COL_COLORS = ['#7000ff', '#ffbb00', '#00ff88'];
const INIT_TASKS = {
  'TODO': ['Design database schema', 'Set up CI/CD pipeline'],
  'IN PROGRESS': ['Build REST API endpoints', 'Create dashboard UI'],
  'DONE': ['Initialise Go project', 'Scaffold Vite frontend'],
};

function KanbanBoard() {
  const [tasks, setTasks] = useState({ 'TODO': [], 'IN PROGRESS': [], 'DONE': [] });
  const [newTask, setNewTask] = useState('');
  const [addingTo, setAddingTo] = useState(null);

  const fetchTasks = () => {
    api.getKanban().then(data => {
      const grouped = { 'TODO': [], 'IN PROGRESS': [], 'DONE': [] };
      (data || []).forEach(t => {
        if (grouped[t.col]) grouped[t.col].push(t);
      });
      setTasks(grouped);
    }).catch(e => console.error(e));
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTasks();
      }
    }, 20000); // 20 seconds is enough for Kanban sync
    return () => clearInterval(interval);
  }, []);

  const moveTask = (task, from, to) => {
    const updatedTask = { ...task, col: to };
    api.updateKanban(updatedTask)
      .then(() => fetchTasks())
      .catch(e => console.error(e));
  };

  const addTask = (col) => {
    if (!newTask.trim()) return;
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const task = { id, content: newTask.trim(), col };
    api.updateKanban(task)
      .then(() => {
        setNewTask(''); setAddingTo(null);
        fetchTasks();
      })
      .catch(e => console.error(e));
  };

  const deleteTask = (id) => {
    api.deleteKanban({ id })
      .then(() => fetchTasks())
      .catch(e => console.error(e));
  };

  return (
    <div className="kanban-board">
      {COLS.map((col, ci) => (
        <div key={col} className="kanban-col">
          <div className="kanban-col-header" style={{ background: `${COL_COLORS[ci]}15`, color: COL_COLORS[ci], border: `1px solid ${COL_COLORS[ci]}30` }}>
            {col} <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>({tasks[col].length})</span>
          </div>
          {tasks[col].map((task) => (
            <div key={task.id} className="kanban-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: '0.85rem' }}>{task.content}</div>
                <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }} title="Delete">
                  <X size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {ci > 0 && (
                  <button onClick={() => moveTask(task, col, COLS[ci - 1])} className="btn btn-sm" style={{ fontSize: '0.65rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>← Back</button>
                )}
                {ci < 2 && (
                  <button onClick={() => moveTask(task, col, COLS[ci + 1])} className="btn btn-sm btn-primary" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>→ Next</button>
                )}
              </div>
            </div>
          ))}
          {addingTo === col ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea className="form-input" style={{ padding: '8px 10px', fontSize: '0.8rem', minHeight: 60 }} placeholder="Task description…" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addTask(col)} autoFocus />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => addTask(col)} className="btn btn-primary btn-sm">Add</button>
                <button onClick={() => setAddingTo(null)} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingTo(col)} className="btn btn-sm" style={{ background: 'none', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)', width: '100%', justifyContent: 'center' }}>+ Add task</button>
          )}
        </div>
      ))}
    </div>
  );
}


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = auth.getUser() || { username: 'student', team_name: 'Team Alpha' };

  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState({ name: 'Loading...', progress: 0, locked: false, members: [], problem_id: '', innovation_name: '' });
  const [problemStatements, setProblemStatements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gitActivity, setGitActivity] = useState([]);
  const [resources, setResources] = useState([]);
  const [loadingGit, setLoadingGit] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [gitRepo, setGitRepo] = useState('');
  const [gitSubmitted, setGitSubmitted] = useState(false);

  useEffect(() => {
    // Initial check
    if (auth.getRole() !== 'student') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    api.dashboard().then(data => data && setTeam(data)).catch(e => console.error(e));
    api.listAdmins().then(data => setAdmins(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    api.listProblemStatements().then(data => setProblemStatements(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    
    // Poll for live updates
    const poll = setInterval(() => {
      api.getAnnouncements().then(setAnnouncements);
      api.getLeaderboard().then(setLeaderboard);
    }, 10000);
    
    api.getAnnouncements().then(data => setAnnouncements(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    api.getLeaderboard().then(data => setLeaderboard(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    api.getResources().then(data => setResources(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    
    return () => clearInterval(poll);
  }, []);

  // Git Activity Polling (Client-side to avoid server limits)
  useEffect(() => {
    if (team.git_repo && team.git_repo.includes('github.com')) {
      const parts = team.git_repo.replace('https://github.com/', '').split('/');
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace('.git', '');
        setLoadingGit(true);
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setGitActivity(data);
            setLoadingGit(false);
          })
          .catch(() => setLoadingGit(false));
      }
    }
  }, [team.git_repo]);

  useEffect(() => {
    if (team.problem_id && problemStatements.length > 0) {
      setCurrentProblem(problemStatements.find(ps => ps.id === team.problem_id));
    }
  }, [team.problem_id, problemStatements]);








  const logout = () => { auth.clear(); navigate('/login'); };

  const CHECKLISTS = {
    Elite: [
      "Design system architecture and database schema",
      "Set up development environment and version control",
      "Implement core backend logic with scalability focus",
      "Develop high-performance REST/GraphQL API",
      "Configure secure authentication and authorization",
      "Build responsive frontend dashboard interface",
      "Integrate frontend with backend APIs",
      "Implement performance benchmarking and optimization",
      "Containerize application (Docker/CI-CD setup)",
      "Final end-to-end testing and deployment"
    ],
    Standard: [
      "Define project scope and database models",
      "Initialize backend and frontend project structure",
      "Implement core CRUD operations",
      "Build basic user authentication flow",
      "Develop main user interface components",
      "Connect UI to backend data endpoints",
      "Implement secondary features (notifications, etc.)",
      "Ensure responsive design across devices",
      "Conduct bug fixing and usability testing",
      "Prepare final project demonstration"
    ],
    Open: [
      "Validate problem statement and real-world impact",
      "Research existing solutions and define USP",
      "Design wireframes and user journey maps",
      "Build functional Minimum Viable Product (MVP)",
      "Develop core 'wow' feature of the application",
      "Create intuitive and clean user interface",
      "Test prototype against realistic user scenarios",
      "Iterate and refine based on initial feedback",
      "Prepare comprehensive impact documentation",
      "Record final pitch and demonstration video"
    ]
  };

  const toggleChecklistItem = (index) => {
    setTeam(prev => {
      let currentSteps = [];
      try {
        if (prev.completed_steps) currentSteps = JSON.parse(prev.completed_steps);
      } catch(e) {
        console.error("Parse error:", e);
      }
      
      if (!Array.isArray(currentSteps)) currentSteps = [];
      
      let newSteps;
      if (currentSteps.includes(index)) {
        newSteps = currentSteps.filter(i => i !== index);
      } else {
        newSteps = [...currentSteps, index];
      }
      
      const newProgress = Math.min(100, newSteps.length * 10);
      const updatedStepsStr = JSON.stringify(newSteps);
      
      // Fire API call in background
      api.updateChecklist({ completed_steps: updatedStepsStr, progress: newProgress })
        .catch(err => {
          console.error("Checklist update failed:", err);
          // Optional: notify user but don't immediately revert to avoid flicker
          // api.dashboard().then(setTeam); 
        });
        
      return { ...prev, completed_steps: updatedStepsStr, progress: newProgress };
    });
  };

  const submitGit = () => {
    if (!gitRepo.trim()) return;
    api.submitGitRepo({ repo_url: gitRepo.trim() })
      .then(() => {
        setGitSubmitted(true);
        api.dashboard().then(setTeam);
      })
      .catch(e => console.error("Git submit error:", e));
  };


  const handleSelectMentor = (adminId) => {
    api.selectAdmin({ admin_id: adminId })
      .then(() => {
        api.dashboard().then(setTeam);
      })
      .catch(e => console.error(e));
  };



  const NAV = [
    { id: 'overview',  label: 'Overview',     icon: <LayoutDashboard size={16} /> },
    { id: 'team',      label: 'Team',          icon: <Users size={16} /> },
    { id: 'progress',  label: 'Progress',      icon: <TrendingUp size={16} /> },
    { id: 'plan',      label: 'Project Plan',  icon: <ClipboardList size={16} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Zap size={16} /> },
    { id: 'resources',   label: 'Resources',   icon: <HelpCircle size={16} /> },
    { id: 'mentor',    label: 'Mentor',        icon: <Shield size={16} /> },
    { id: 'submit',    label: 'Git Submission (Plus)', icon: <GitBranch size={16} /> },
  ];

  return (
    <div className="app-layout">
      <div className="grid-bg" />

      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutDashboard size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>SYCET IGNITE</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Student Dashboard</div>
          </div>
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'var(--secondary-dim)', border: '1px solid rgba(112,0,255,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Logged in as</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.username}</div>
            <div style={{ fontSize: '0.7rem', color: '#b060ff' }}>{team.name}</div>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(n => (
          <button key={n.id} className={`sidebar-nav-item ${activeTab === n.id ? 'active' : ''}`} onClick={() => { setActiveTab(n.id); setIsSidebarOpen(false); }}>
            {n.icon} {n.label}
          </button>
        ))}
        <a href="/rules.pdf" target="_blank" rel="noreferrer" className="sidebar-nav-item" style={{ textDecoration: 'none' }}>
          <ClipboardList size={16} /> Rules & Regulations
        </a>

        <div style={{ flex: 1 }} />
        <button className="sidebar-nav-item" onClick={logout} style={{ color: 'var(--accent)' }}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-only btn btn-sm" onClick={() => setIsSidebarOpen(true)} style={{ padding: 10, background: 'var(--primary-dim)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '10px' }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 800 }}>{NAV.find(n => n.id === activeTab)?.label}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>SYCET IGNITE · {team.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Clock size={14} /> SYCET IGNITE Hackathon 2026 Live
            </div>
          </div>
        </div>

        {/* Global Announcement Bar */}
        {announcements.length > 0 && (
          <div className="glass-card animate-fade-in" style={{ 
            marginBottom: '1.5rem', 
            padding: '0.75rem 1.25rem', 
            border: announcements[0].type === 'warning' ? '1px solid var(--accent)' : '1px solid var(--primary)',
            background: announcements[0].type === 'warning' ? 'rgba(255,0,85,0.05)' : 'rgba(0,123,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div className="badge badge-primary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>LATEST</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1 }}>{announcements[0]?.content}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{announcements[0]?.created_at ? new Date(announcements[0].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Problem Statement Card */}
            {currentProblem && (
              <div className="glass-card animate-fade-up" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Assigned Problem Statement</div>
                  <div className="badge badge-primary">{currentProblem.id}</div>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{currentProblem.title}</h2>
                {team.innovation_name && (
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>
                    Project: {team.innovation_name}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginBottom: '1rem' }}>
                  <div className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{currentProblem.technology}</div>
                  <div className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{currentProblem.bucket} Bucket</div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{currentProblem.description}</p>
                <button className="btn btn-sm" style={{ marginTop: '1rem', background: 'rgba(112,0,255,0.1)', color: 'var(--primary)' }} onClick={() => setActiveTab('guide')}>
                   View Implementation Guide →
                </button>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Stats row */}
            <div className="grid-responsive grid-3">
              {[
                { label: 'Team Progress', value: `${team.progress || 0}%`, color: 'var(--primary)' },
                { label: 'Members', value: (team.members || []).length, color: 'var(--success)' },
                { label: 'Team Status', value: team.locked ? 'Locked' : 'Open', color: team.locked ? 'var(--warning)' : 'var(--success)' },
              ].map((s, i) => (
                <div key={i} className="glass-card stat-card">
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>{s.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700 }}>Overall Progress</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{team.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${team.progress || 0}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Started</span>
                <span>Submission</span>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ── TEAM TAB ── */}
        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{team.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(team.members || []).length} members</p>
                </div>
                <div className={`badge ${team.locked ? 'badge-warning' : 'badge-success'}`}>
                  {team.locked ? <Lock size={10} /> : <Unlock size={10} />}
                  {team.locked ? 'Team Locked' : 'Team Open'}
                </div>
              </div>

              {team.locked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,187,0,0.06)', border: '1px solid rgba(255,187,0,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--warning)' }}>
                  <AlertCircle size={14} />
                  Team composition is locked. Contact your admin to make changes.
                </div>
              )}

              <table className="data-table">
                <thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {(team.members || []).map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td><span className="badge badge-secondary">{m.role}</span></td>
                      <td><span className="badge badge-success">Online</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700 }}>Team Progress</h3>
                <span className="gradient-text" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.3rem' }}>{team.progress}%</span>
              </div>
              <div className="progress-track" style={{ height: 16 }}>
                <div className="progress-fill" style={{ width: `${team.progress || 0}%` }} />
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Project Checklist</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Complete these 10 core milestones to finish your project. Each item adds 10% to your overall progress.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(() => {
                  if (!currentProblem) {
                    return <div style={{ color: 'var(--text-muted)' }}>No problem statement assigned.</div>;
                  }
                  
                  const bucket = currentProblem.bucket || 'Standard';
                  const list = CHECKLISTS[bucket] || CHECKLISTS.Standard;
                  
                  let completedSteps = [];
                  try {
                    if (team.completed_steps) completedSteps = JSON.parse(team.completed_steps);
                  } catch(e) {}

                  return list.map((item, i) => {
                    const isChecked = completedSteps.includes(i);
                    return (
                      <label key={i} style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '1rem', 
                        padding: '1rem', background: isChecked ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255,255,255,0.02)', 
                        border: `1px solid ${isChecked ? 'rgba(0, 255, 136, 0.2)' : 'var(--glass-border)'}`, 
                        borderRadius: 8, cursor: 'pointer', transition: 'var(--transition)'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => toggleChecklistItem(i)} 
                          style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: 'var(--success)' }}
                        />
                        <div>
                          <div style={{ 
                            fontWeight: 600, fontSize: '0.9rem', 
                            color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.7 : 1
                          }}>
                            {item}
                          </div>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {activeTab === 'plan' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Project Plan Board</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Drag tasks between columns to track your progress.</p>
            <KanbanBoard />
          </div>
        )}

        {/* ── GUIDE TAB ── */}
        {activeTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!currentProblem ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><ClipboardList size={48} opacity={0.3} /></div>
                <h3>No Problem Statement Assigned</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Your team has not been assigned a problem statement yet. Please contact an admin.</p>
              </div>
            ) : (
              <>
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Project Guide: {currentProblem.id}</div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{currentProblem.title}</h2>
                  <div className="badge badge-secondary" style={{ marginBottom: '1.5rem' }}>{currentProblem.technology}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Objective</h4>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{currentProblem.description}</p>
                    </section>

                    <section>
                      <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Step-Wise Implementation Strategy</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                          const tech = (currentProblem.technology || '').split(',')[0] || 'your tech stack';
                          const bucket = currentProblem.bucket || 'Standard';
                          
                          let steps = [];
                          if (bucket === 'Elite') {
                            steps = [
                              { title: "System Architecture Design", desc: `Design a high-performance architecture for ${currentProblem.title}. Focus on concurrency, throughput, and low-latency data handling using ${tech}.` },
                              { title: "Backend Scalability Logic", desc: `Implement core logic with a focus on scalability. Use efficient algorithms and data structures to handle large-scale indexing or processing as required.` },
                              { title: "Network & Security Layer", desc: `Configure robust networking and security protocols. Implement rate-limiting, checksums, or encryption to ensure data integrity across the system.` },
                              { title: "Infrastructure & Dockerization", desc: "Containerize your solution for consistent deployment. Ensure resource isolation and environment parity using Docker or similar tools." },
                              { title: "Performance Benchmarking", desc: "Run stress tests to verify execution time and memory usage. Optimize bottlenecks in the core processing loop." }
                            ];
                          } else if (bucket === 'Open') {
                            steps = [
                              { title: "Problem Validation & Research", desc: `Validate the real-world impact of ${currentProblem.title}. Research existing solutions and identify the unique value proposition of your innovation.` },
                              { title: "MVP Prototyping", desc: `Build a functional Minimum Viable Product. Focus on the 'wow' factor and the core problem-solving feature using ${tech}.` },
                              { title: "User Journey & Experience", desc: "Design a clean, intuitive interface. Focus on how a real-world user would interact with your innovation to solve their pain points." },
                              { title: "Iterative Refinement", desc: "Test your prototype against realistic scenarios. Refine the logic based on the specific 'real world' application you have targeted." },
                              { title: "Pitch & Impact Documentation", desc: "Prepare a clear explanation of how your project scales and its potential socio-economic or technical impact." }
                            ];
                          } else {
                            // Standard Bucket
                            steps = [
                              { title: "Database & Schema Modeling", desc: `Model the database for ${currentProblem.title}. Define entities for users, items, and transactions relevant to the project flow.` },
                              { title: "Core CRUD & API Development", desc: `Develop the RESTful API or Backend logic using ${tech}. Ensure secure authentication and proper error handling for all endpoints.` },
                              { title: "Frontend Dashboard Integration", desc: "Build a responsive web/mobile interface. Connect the UI components to your backend APIs for real-time data display." },
                              { title: "Feature Polish & Usability", desc: "Implement secondary features like QR scanning, notifications, or sentiment analysis to enhance the user experience." },
                              { title: "Final Validation & Testing", desc: "Conduct end-to-end testing of the user flow. Ensure all 'standard' use cases are handled without crashes or logic errors." }
                            ];
                          }
                          
                          return steps.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1.25rem' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.85rem' }}>
                                {i + 1}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </section>

                    <section className="glass-card" style={{ padding: '1.25rem', background: 'rgba(0,242,255,0.03)', border: '1px solid rgba(0,242,255,0.2)' }}>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color="var(--secondary)" /> Expert Tip for {currentProblem.bucket} Projects
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {currentProblem.bucket === 'Elite' ? (
                          `For this Elite project, the judges will look for technical depth. Ensure you use ${currentProblem.technology} to its full potential, focusing on concurrent execution and memory efficiency. A clean, well-documented API will set you apart.`
                        ) : currentProblem.bucket === 'Open' ? (
                          `In Open Innovation, the 'Why' is as important as the 'How'. Make sure your ${currentProblem.technology} implementation directly addresses a painful real-world problem. Focus on a working demo that tells a story.`
                        ) : (
                          `For this Standard project, consistency is key. Ensure your database relationships are solid and your UI is intuitive. Using ${currentProblem.technology} for a smooth, bug-free experience is your top priority.`
                        )}
                      </p>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        )}


        {/* ── SUBMIT TAB ── */}
        {activeTab === 'submit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch size={18} color="var(--primary)" /> Final Project Submission
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Submit your Git repository link before time runs out. Only one submission allowed.
              </p>
              {gitSubmitted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <CheckCircle size={20} color="var(--success)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>Submitted Successfully!</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{gitRepo}</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">GitHub / GitLab Repository URL</label>
                    <input className="form-input mono" placeholder="https://github.com/your-org/your-repo" value={gitRepo} onChange={e => setGitRepo(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={submitGit} disabled={!gitRepo.trim()}>
                    <GitBranch size={14} /> Submit Repository
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Need Help?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                {[
                  { q: 'Git not working?', a: 'Check your remote URL and ensure the repo is public.' },
                  { q: 'Team locked unfairly?', a: 'Contact the admin via the event helpdesk.' },
                  { q: 'Progress bar dropped?', a: 'Submit a more detailed positive update — the AI rewards specifics.' },
                ].map((f, i) => (
                  <details key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{f.q}</summary>
                    <p style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MENTOR TAB ── */}
        {activeTab === 'mentor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700 }}>Assigned Mentor</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Guidance and project review</p>
                </div>
              </div>

              {team.admin_id ? (
                <div style={{ background: 'rgba(112,0,255,0.06)', border: '1px solid rgba(112,0,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Mentor</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {(admins || []).find(a => a.id === team.admin_id)?.username || 'Mentor ID: ' + team.admin_id}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                      <Mail size={14} color="var(--primary)" /> {(admins || []).find(a => a.id === team.admin_id)?.email || 'No email provided'}
                    </div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                      <Phone size={14} color="var(--primary)" /> {(admins || []).find(a => a.id === team.admin_id)?.mobile || 'No mobile provided'}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    Your mentor will review your progress updates and provide feedback during the hackathon.
                  </p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('overview')}>
                    <LayoutDashboard size={16} /> View Overview
                  </button>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: 'rgba(255,187,0,0.05)', border: '1px dashed rgba(255,187,0,0.3)', borderRadius: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--warning)', marginBottom: '1rem' }}>No mentor assigned yet.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select a mentor below to start receiving guidance.</p>
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Choose or Change Mentor</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    className="form-input"
                    style={{ flex: 1 }}
                    value={team.admin_id || ''}
                    onChange={(e) => handleSelectMentor(e.target.value)}
                  >
                    <option value="">Select an available admin…</option>
                    {(admins || []).filter(a => a.is_mentor).map(a => (
                      <option key={a.id} value={a.id}>{a.username}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  * Administrators can override this selection if necessary.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* ── LEADERBOARD TAB ── */}
        {activeTab === 'leaderboard' && (
          <div className="glass-card animate-fade-up" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={20} color="var(--primary)" /> Live Event Leaderboard
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leaderboard.map((t, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  padding: '1rem', 
                  background: t.name === team.name ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.02)',
                  border: t.name === team.name ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  borderRadius: 12
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.name} {t.name === team.name && <span className="badge badge-primary">YOU</span>}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.innovation_name || t.problem_id}</div>
                  </div>
                  <div style={{ width: 150 }}>
                    <div className="progress-track" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', width: 40, textAlign: 'right' }}>{t.progress}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESOURCES TAB ── */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={20} color="var(--primary)" /> Technology Resource Hub
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Quick access to documentation and tools provided by hackathon organizers.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {(resources || []).map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="glass-card resource-card" style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 15, 
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ width: 45, height: 45, borderRadius: 10, background: 'rgba(0,123,255,0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>
                      {r.title[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.description || 'View official documentation'}</div>
                    </div>
                  </a>
                ))}
                {(resources || []).length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No resources added yet. Check back soon!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'submit' && (
          <div className="glass-card animate-fade-up" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,123,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                <GitBranch size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Final Project Submission</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Enter your team's Git repository URL (GitHub/GitLab/Bitbucket). 
                Once submitted, organizers will use this link for final evaluations.
              </p>
              
              {team.git_repo ? (
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid var(--success)', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Submitted Repository</div>
                  <a href={team.git_repo.startsWith('http') ? team.git_repo : `https://${team.git_repo}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none', wordBreak: 'break-all' }}>
                    {team.git_repo}
                  </a>
                  <button className="btn btn-sm btn-outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setGitRepo(team.git_repo)}>
                    Change Submission
                  </button>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input 
                  className="form-input" 
                  placeholder="https://github.com/username/repo" 
                  value={gitRepo}
                  onChange={e => setGitRepo(e.target.value)}
                />
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submitGit}>
                  {team.git_repo ? 'Update Submission' : 'Submit Repository'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Git Pulse Sidebar Item (Inject into Overview) */}
        {activeTab === 'overview' && team.git_repo && (
          <div className="glass-card animate-fade-up" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <GitBranch size={20} color="var(--primary)" /> Live Git Activity (Client Pulse)
            </h3>
            {loadingGit ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Syncing with GitHub...</div>
            ) : gitActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gitActivity.map((commit, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, fontSize: '0.82rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{commit.commit.message}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {commit.commit.author.name} · {new Date(commit.commit.author.date).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', opacity: 0.6 }}>{commit.sha.substring(0, 7)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity found or repo is private.</div>
            )}
          </div>
        )}
        {/* ── FOOTER ── */}
        <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} /> SYCET IGNITE Platform. Secured with AES-256 & JWT.
            </div>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Developed by Aditya Nikam (Class FE-3 CSE)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="mailto:nikamaditya668@gmail.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact Support</a>
          </div>
        </footer>

      </main>
    </div>
  );
}
