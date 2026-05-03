import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Shield, Settings,
  LogOut, Lock, Unlock, Trash2, Edit3, Edit2, CheckCircle,
  TrendingUp, GitBranch, Clock, AlertTriangle, UserPlus, MessageSquare, Send, X, FileText, Menu
} from 'lucide-react';
import { auth, api, publicApi } from '../api.js';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const INIT_TEAMS = [
  { id: '1', name: 'Team Alpha',   progress: 62, locked: true,  members: 3, gitRepo: 'github.com/alpha/project',  status: 'active' },
  { id: '2', name: 'Team Nexus',   progress: 45, locked: true,  members: 4, gitRepo: '',                          status: 'active' },
  { id: '3', name: 'Team Cipher',  progress: 78, locked: true,  members: 3, gitRepo: 'github.com/cipher/hack',   status: 'active' },
  { id: '4', name: 'Team Orbit',   progress: 30, locked: false, members: 2, gitRepo: '',                          status: 'at-risk' },
  { id: '5', name: 'Team Spark',   progress: 55, locked: true,  members: 4, gitRepo: 'github.com/spark/build',   status: 'active' },
  { id: '6', name: 'Team Vertex',  progress: 10, locked: false, members: 1, gitRepo: '',                          status: 'inactive' },
];


// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [teams, setTeams] = useState([]);
  const [editingProgress, setEditingProgress] = useState(null);
  const [progressVal, setProgressVal] = useState('');
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', email: '', mobile: '', is_mentor: true });
  const [newTeam, setNewTeam] = useState({ 
    name: '', 
    password: '', 
    admin_id: '', 
    problem_id: '',
    innovation_name: '',
    members: [{ name: '', email: '' }] 
  });
  const [toast, setToast] = useState(null);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [problemStatements, setProblemStatements] = useState([]);
  const [announcement, setAnnouncement] = useState({ content: '', type: 'info' });
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '' });
  const [prizePoolVal, setPrizePoolVal] = useState('');
  const [scheduleItems, setScheduleItems] = useState([{ time: '', label: '' }]);

  const logout = () => { auth.clear(); navigate('/admin/login'); };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleLock = (id) => {
    const team = teams.find(t => t.id === id);
    const action = team.locked ? api.unlockTeam(id) : api.lockTeam(id);
    
    action
      .then(() => {
        showToast(`${team.name} ${team.locked ? 'unlocked' : 'locked'} successfully`);
        loadTeams();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const saveProgress = (id) => {
    const val = Math.max(0, Math.min(100, Number(progressVal)));
    api.setProgress({ team_id: id, progress: val })
      .then(() => {
        showToast('Progress updated');
        setEditingProgress(null);
        loadTeams(); // Instant refresh
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!announcement.content.trim()) return;
    api.postAnnouncement(announcement)
      .then(() => {
        showToast('Announcement broadcasted!');
        setAnnouncement({ content: '', type: 'info' });
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const loadAdmins = () => {
    api.listAdmins().then(data => setAdmins(Array.isArray(data) ? data : [])).catch(e => showToast(e.message, 'error'));
  };

  const loadTeams = () => {
    api.listTeams().then(data => setTeams(Array.isArray(data) ? data : [])).catch(e => showToast(e.message, 'error'));
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    api.addAdmin(newAdmin)
      .then(() => {
        showToast('Admin added successfully');
        setNewAdmin({ username: '', password: '', email: '', mobile: '', is_mentor: true });
        loadAdmins();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleAddTeam = (e) => {
    e.preventDefault();
    api.createTeam(newTeam)
      .then(() => {
        showToast('Team and participant accounts created');
        setNewTeam({ 
          name: '', 
          password: '', 
          admin_id: '', 
          problem_id: '',
          innovation_name: '',
          members: [{ name: '', email: '' }] 
        });
        loadTeams();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleTeamDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this team? All members and data will be lost.')) return;
    api.deleteTeam(id)
      .then(() => {
        showToast('Team deleted');
        loadTeams();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleAdminDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    api.deleteAdmin(id)
      .then(() => {
        showToast('Admin deleted');
        loadAdmins();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleAdminUpdate = (e) => {
    e.preventDefault();
    api.updateAdmin(editingAdmin)
      .then(() => {
        showToast('Admin profile updated');
        setShowEditAdminModal(false);
        loadAdmins();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleAssignAdmin = (teamId, adminId) => {
    api.assignAdmin({ team_id: teamId, admin_id: adminId })
      .then(() => {
        showToast('Mentor assigned');
        loadTeams();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleTeamUpdate = (e) => {
    if (e) e.preventDefault();
    api.updateTeam(editingTeam)
      .then(() => {
        showToast('Team Updated Successfully');
        setShowEditTeamModal(false);
        loadTeams();
      })
      .catch(e => showToast(e.message, 'error'));
  };



  const avgProgress = Math.round((teams || []).reduce((a, t) => a + (t.progress || 0), 0) / (teams || []).length || 0);
  const submittedCount = (teams || []).filter(t => t.git_repo).length;

  const NAV = [
    { id: 'overview',  label: 'Overview',     icon: <LayoutDashboard size={16} /> },
    { id: 'teams',     label: 'Teams',        icon: <Users size={16} /> },
    { id: 'progress',  label: 'Progress',     icon: <BarChart3 size={16} /> },
    { id: 'submissions', label: 'Submissions', icon: <GitBranch size={16} /> },
    { id: 'admins',      label: 'Admins',      icon: <UserPlus size={16} /> },
    { id: 'resources',   label: 'Resources',   icon: <FileText size={16} /> },
    { id: 'settings',    label: 'Settings',    icon: <Settings size={16} /> },
  ];

  useEffect(() => {
    // Initial check
    if (auth.getRole() !== 'admin') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    loadTeams();
    loadAdmins();
    api.listProblemStatements().then(data => setProblemStatements(Array.isArray(data) ? data : [])).catch(e => console.error(e));
    loadResources();
    loadSettings();
  }, []);

  const loadSettings = () => {
    // We get these from the public landing data endpoint for simplicity
    publicApi.fetchLandingData().then(data => {
      if (data.prize_pool) setPrizePoolVal(data.prize_pool);
      if (data.schedule && data.schedule.length > 0) setScheduleItems(data.schedule);
    }).catch(e => console.error(e));
  };

  const loadResources = () => {
    api.getResources().then(setResources).catch(e => showToast(e.message, 'error'));
  };

  const handleAddResource = (e) => {
    e.preventDefault();
    api.addResource(newResource)
      .then(() => {
        showToast('Resource added');
        setNewResource({ title: '', url: '', description: '' });
        loadResources();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  const handleUpdateSchedule = () => {
    api.updateSchedule(scheduleItems.filter(s => s.time && s.label))
      .then(() => showToast('Schedule updated'))
      .catch(e => showToast(e.message, 'error'));
  };

  const handleDeleteResource = (id) => {
    if (!window.confirm('Delete this resource?')) return;
    api.deleteResource(id)
      .then(() => {
        showToast('Resource deleted');
        loadResources();
      })
      .catch(e => showToast(e.message, 'error'));
  };

  useEffect(() => {
    if (tab === 'admins') loadAdmins();
    if (tab === 'teams' || tab === 'overview') {
      loadTeams();
      loadAdmins(); // Always load admins for team assignment dropdown
    }
  }, [tab]);



  return (
    <div className="app-layout">
      <div className="grid-bg" />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '10px 18px', borderRadius: 10,
          background: toast.type === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(255,0,85,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(0,255,136,0.35)' : 'rgba(255,0,85,0.35)'}`,
          color: toast.type === 'success' ? 'var(--success)' : 'var(--accent)',
          fontWeight: 600, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)'
        }}>
          <CheckCircle size={15} /> {toast.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #660020, var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Admin Panel</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Full Control</div>
          </div>
          <button className="mobile-only" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>System Live</div>
          </div>
        </div>

        <div className="sidebar-section-label">Control Panel</div>
        {NAV.map(n => (
          <button key={n.id} className={`sidebar-nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => { setTab(n.id); setIsSidebarOpen(false); }}>
            {n.icon} {n.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <button className="sidebar-nav-item" onClick={logout} style={{ color: 'var(--accent)' }}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-only btn btn-sm" onClick={() => setIsSidebarOpen(true)} style={{ padding: 8, background: 'rgba(255,255,255,0.05)' }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 800 }}>{NAV.find(n => n.id === tab)?.label || 'Dashboard'}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>SYCET IGNITE · Admin</p>
            </div>
          </div>
          <div className="badge badge-danger desktop-only" style={{ padding: '6px 14px' }}>
            <Shield size={12} /> Admin Mode
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-responsive grid-4">
              {[
                { label: 'Total Teams',    value: (teams || []).length,     color: 'var(--primary)'   },
                { label: 'Avg Progress',   value: `${avgProgress}%`, color: 'var(--secondary)' },
                { label: 'Submitted',      value: `${submittedCount}/${(teams || []).length}`, color: 'var(--success)' },
                { label: 'At Risk',        value: (teams || []).filter(t => t.status === 'at-risk' || t.status === 'inactive').length, color: 'var(--accent)' },
              ].map((s, i) => (
                <div key={i} className="glass-card stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Announcement Section */}
            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--primary)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={18} color="var(--primary)" /> Broadcast Announcement
              </h3>
              <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  className="form-input" 
                  placeholder="Type event announcement here... (e.g. Lunch is ready!)" 
                  style={{ flex: 1 }}
                  value={announcement.content}
                  onChange={e => setAnnouncement({...announcement, content: e.target.value})}
                />
                <select 
                  className="form-input" 
                  style={{ width: 120 }}
                  value={announcement.type}
                  onChange={e => setAnnouncement({...announcement, type: e.target.value})}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
                <button className="btn btn-primary" type="submit">Broadcast</button>
              </form>
            </div>

            {/* All teams quick view */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>All Teams — Quick Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(teams || []).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 120, fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>{t.name}</div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-track" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${t.progress}%` }} />
                      </div>
                    </div>
                    <div style={{ width: 40, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', textAlign: 'right', color: 'var(--primary)' }}>{t.progress}%</div>
                    <div style={{ flexShrink: 0 }}>
                      {t.locked
                        ? <span className="badge badge-warning"><Lock size={10} /> Locked</span>
                        : <span className="badge badge-success"><Unlock size={10} /> Open</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TEAMS ── */}
        {tab === 'teams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Team Management</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th><th>Members</th><th>Problem Statement</th><th>Assigned Mentor</th><th>Status</th><th>Lock Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(teams || []).map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 300 }}>
                          {(t.members || []).map(m => (
                            <span key={m.id} className="badge" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>
                              {m.username}
                            </span>
                          ))}
                          {(t.members || []).length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No members</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {t.problem_id || 'Not Assigned'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {Array.isArray(problemStatements) && problemStatements.find(ps => ps.id === t.problem_id)?.title || ''}
                        </div>
                        {t.innovation_name && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>
                            Project: {t.innovation_name}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                          value={t.admin_id || ''}
                          onChange={(e) => handleAssignAdmin(t.id, e.target.value)}
                        >
                          <option value="">Select Mentor</option>
                          {(admins || []).filter(a => a.is_mentor).map(a => (
                            <option key={a.id} value={a.id}>{a.username}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'active' ? 'badge-success' : t.status === 'at-risk' ? 'badge-warning' : 'badge-danger'}`}>
                          {t.status || 'active'}
                        </span>
                      </td>
                      <td>
                        {t.locked
                          ? <span className="badge badge-warning"><Lock size={10} /> Locked</span>
                          : <span className="badge badge-success"><Unlock size={10} /> Open</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className={`btn btn-sm ${t.locked ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleLock(t.id)}>
                            {t.locked ? <><Unlock size={12} /> Unlock</> : <><Lock size={12} /> Lock</>}
                          </button>
                          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => { setEditingTeam(t); setShowEditTeamModal(true); }}>
                            <Edit2 size={12} />
                          </button>
                          <button className="btn btn-sm" style={{ background: 'rgba(255,0,85,0.1)', color: 'var(--accent)' }} onClick={() => handleTeamDelete(t.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} color="var(--primary)" /> Add New Team & Participants
              </h3>
              
              <form onSubmit={handleAddTeam} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Team Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input className="form-input" placeholder="Team Alpha" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Common Password</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={newTeam.password} onChange={e => setNewTeam({ ...newTeam, password: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Mentor</label>
                    <select className="form-input" value={newTeam.admin_id} onChange={e => setNewTeam({ ...newTeam, admin_id: e.target.value })} required>
                      <option value="">Select Mentor</option>
                      {(admins || []).filter(a => a.is_mentor).map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Problem Statement</label>
                  <select className="form-input" value={newTeam.problem_id} onChange={e => setNewTeam({ ...newTeam, problem_id: e.target.value })} required>
                    <option value="">Select Problem Statement...</option>
                    {(problemStatements || []).map(ps => (
                      <option key={ps.id} value={ps.id}>[{ps.id}] {ps.title}</option>
                    ))}
                  </select>
                </div>

                {Array.isArray(problemStatements) && problemStatements.find(ps => ps.id === newTeam.problem_id)?.bucket === 'Open Innovation' && (
                  <div className="form-group animate-fade-in" style={{ marginTop: '-1rem' }}>
                    <label className="form-label" style={{ color: 'var(--success)' }}>Innovation Name (Required for Open Innovation)</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Smart Traffic Management System" 
                      value={newTeam.innovation_name} 
                      onChange={e => setNewTeam({ ...newTeam, innovation_name: e.target.value })} 
                      required 
                    />
                  </div>
                )}

                {/* Participants */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Team Participants</h4>
                    <button type="button" className="btn btn-sm" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--success)', border: '1px solid rgba(0,255,136,0.2)' }} 
                      onClick={() => setNewTeam({ ...newTeam, members: [...newTeam.members, { name: '', email: '' }] })}>
                      <UserPlus size={14} /> Add Member
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {newTeam.members.map((m, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                        <input className="form-input" placeholder="Member Name" value={m.name} 
                          onChange={e => {
                            const updated = [...newTeam.members];
                            updated[i] = { ...updated[i], name: e.target.value };
                            setNewTeam({ ...newTeam, members: updated });
                          }} required />
                        <input className="form-input" type="email" placeholder="Email Address" value={m.email} 
                          onChange={e => {
                            const updated = [...newTeam.members];
                            updated[i] = { ...updated[i], email: e.target.value };
                            setNewTeam({ ...newTeam, members: updated });
                          }} required />
                        {newTeam.members.length > 1 && (
                          <button type="button" onClick={() => setNewTeam({ ...newTeam, members: newTeam.members.filter((_, idx) => idx !== i) })}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.5rem' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '0.75rem 2rem' }}>
                  <CheckCircle size={18} /> Finalize Team & Create Accounts
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── PROGRESS ── */}
        {tab === 'progress' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Progress Override — All Teams</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {teams.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(t.members || []).length} members</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-track" style={{ height: 10 }}>
                      <div className="progress-fill" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                  <div style={{ width: 48, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', textAlign: 'right' }}>{t.progress}%</div>
                  {editingProgress === t.id ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <input className="form-input" style={{ width: 70, padding: '6px 10px', textAlign: 'center' }} type="number" min="0" max="100" value={progressVal} onChange={e => setProgressVal(e.target.value)} autoFocus />
                      <button className="btn btn-primary btn-sm" onClick={() => saveProgress(t.id)}>Save</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }} onClick={() => setEditingProgress(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-sm" style={{ flexShrink: 0 }} onClick={() => { setEditingProgress(t.id); setProgressVal(String(t.progress)); }}>
                      <Edit3 size={12} /> Set
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS ── */}
        {tab === 'submissions' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Final Git Submissions</h3>
            <table className="data-table">
              <thead><tr><th>Team</th><th>Repository</th><th>Status</th></tr></thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>
                      {t.git_repo
                        ? <a href={t.git_repo.startsWith('http') ? t.git_repo : `https://${t.git_repo}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{t.git_repo}</a>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not submitted</span>
                      }
                    </td>
                    <td>
                      {t.git_repo
                        ? <span className="badge badge-success"><CheckCircle size={10} /> Submitted</span>
                        : <span className="badge badge-warning"><AlertTriangle size={10} /> Pending</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Prize Pool */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>General Settings</h3>
              <div className="form-group">
                <label className="form-label">Prize Pool Amount</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={prizePoolVal} onChange={e => setPrizePoolVal(e.target.value)} placeholder="e.g. ₹5L" />
                  <button className="btn btn-primary" onClick={() => {
                    api.updateSettings({ prize_pool: prizePoolVal })
                      .then(() => showToast('Prize pool updated'))
                      .catch(e => showToast(e.message, 'error'));
                  }}>Update</button>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Hackathon Schedule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {scheduleItems.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                    <input className="form-input" style={{ width: 150 }} placeholder="Time (e.g. 10:00 AM)" value={s.time} onChange={e => {
                      const newItems = [...scheduleItems];
                      newItems[i].time = e.target.value;
                      setScheduleItems(newItems);
                    }} />
                    <input className="form-input" style={{ flex: 1 }} placeholder="Event Label" value={s.label} onChange={e => {
                      const newItems = [...scheduleItems];
                      newItems[i].label = e.target.value;
                      setScheduleItems(newItems);
                    }} />
                    <button className="btn btn-outline btn-sm" onClick={() => setScheduleItems(scheduleItems.filter((_, idx) => idx !== i))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button className="btn btn-sm" style={{ width: 'fit-content', background: 'rgba(255,255,255,0.05)' }} onClick={() => setScheduleItems([...scheduleItems, { time: '', label: '' }])}>
                  + Add Item
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleUpdateSchedule}>Save Full Schedule</button>
            </div>
          </div>
        )}

        {/* ── ADMINS ── */}
        {tab === 'admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>System Administrators</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th><th>Created At</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(admins || []).map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.username}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(a.created_at).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className="badge badge-success">Active</span>
                          {a.is_mentor && <span className="badge badge-primary">Mentor</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditingAdmin(a); setShowEditAdminModal(true); }}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-sm btn-outline" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => handleAdminDelete(a.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Add New Administrator</h3>
              <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 400 }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    className="form-input"
                    placeholder="e.g. admin_jane"
                    value={newAdmin.username}
                    onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Secure password"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="mentor@example.com"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    className="form-input"
                    placeholder="+91 XXXXX XXXXX"
                    value={newAdmin.mobile}
                    onChange={e => setNewAdmin({ ...newAdmin, mobile: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={newAdmin.is_mentor} 
                      onChange={e => setNewAdmin({...newAdmin, is_mentor: e.target.checked})} 
                      style={{ width: 16, height: 16 }}
                    />
                    Appears as Mentor for teams
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                  <UserPlus size={16} /> Create Admin Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── RESOURCES ── */}
        {tab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Manage Documentation Resources</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th><th>URL</th><th>Description</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(resources || []).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.title}</td>
                      <td><a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{r.url}</a></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.description}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => handleDeleteResource(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Add New Resource</h3>
              <form onSubmit={handleAddResource} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 400 }}>
                <div className="form-group">
                  <label className="form-label">Resource Title</label>
                  <input className="form-input" placeholder="e.g. React Docs" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">URL</label>
                  <input className="form-input" placeholder="https://..." value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input className="form-input" placeholder="Quick description" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                  Add Resource Link
                </button>
              </form>
            </div>
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
      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="modal-overlay" onClick={() => setShowEditTeamModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="gradient-text">Edit Team</h2>
              <button className="close-btn" onClick={() => setShowEditTeamModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleTeamUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input 
                  className="form-input" 
                  value={editingTeam?.name || ''} 
                  onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Update Team Password (Optional)</label>
                <input 
                  className="form-input" 
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editingTeam?.password || ''} 
                  onChange={e => setEditingTeam({ ...editingTeam, password: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Git Repository URL</label>
                <input 
                  className="form-input" 
                  value={editingTeam?.git_repo || ''} 
                  onChange={e => setEditingTeam({ ...editingTeam, git_repo: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Problem Statement</label>
                <select 
                  className="form-input" 
                  value={editingTeam?.problem_id || ''} 
                  onChange={e => setEditingTeam({ ...editingTeam, problem_id: e.target.value })} 
                >
                  <option value="">Select Problem Statement...</option>
                  {(problemStatements || []).map(ps => (
                    <option key={ps.id} value={ps.id}>[{ps.id}] {ps.title}</option>
                  ))}
                </select>
              </div>

              {problemStatements.find(ps => ps.id === editingTeam?.problem_id)?.bucket === 'Open Innovation' && (
                <div className="form-group animate-fade-in">
                  <label className="form-label" style={{ color: 'var(--success)' }}>Innovation Name</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. Smart Traffic Management System" 
                    value={editingTeam?.innovation_name || ''} 
                    onChange={e => setEditingTeam({ ...editingTeam, innovation_name: e.target.value })} 
                    required 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Team Members (Email/Username)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(editingTeam?.members || []).map((m, idx) => (
                    <div key={m.id} style={{ display: 'flex', gap: 8 }}>
                      <input 
                        className="form-input" 
                        value={m.username} 
                        onChange={e => {
                          const newMembers = [...editingTeam.members];
                          newMembers[idx] = { ...newMembers[idx], username: e.target.value };
                          setEditingTeam({ ...editingTeam, members: newMembers });
                        }} 
                        placeholder="Member Email"
                      />
                      <button type="button" className="close-btn" onClick={() => {
                        const newMembers = editingTeam.members.filter((_, i) => i !== idx);
                        setEditingTeam({ ...editingTeam, members: newMembers });
                      }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4, background: 'rgba(255,255,255,0.05)' }} onClick={() => {
                    const newMembers = [...(editingTeam.members || []), { id: '', username: '' }];
                    setEditingTeam({ ...editingTeam, members: newMembers });
                  }}>
                    <UserPlus size={14} /> Add Member
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowEditTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Admin Modal */}
      {showEditAdminModal && (
        <div className="modal-overlay" onClick={() => setShowEditAdminModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="gradient-text">Edit Admin Profile</h2>
              <button className="close-btn" onClick={() => setShowEditAdminModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdminUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  className="form-input" 
                  value={editingAdmin?.username || ''} 
                  onChange={e => setEditingAdmin({ ...editingAdmin, username: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className="form-input" 
                  type="email"
                  value={editingAdmin?.email || ''} 
                  onChange={e => setEditingAdmin({ ...editingAdmin, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input 
                  className="form-input" 
                  value={editingAdmin?.mobile || ''} 
                  onChange={e => setEditingAdmin({ ...editingAdmin, mobile: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password (Optional)</label>
                <input 
                  className="form-input" 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editingAdmin?.password || ''} 
                  onChange={e => setEditingAdmin({ ...editingAdmin, password: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={editingAdmin?.is_mentor} 
                    onChange={e => setEditingAdmin({ ...editingAdmin, is_mentor: e.target.checked })} 
                    style={{ width: 16, height: 16 }}
                  />
                  Appears as Mentor for teams
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
