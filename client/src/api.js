// API service - connects to Go backend
// Use relative path for Vercel routing
const BASE_URL = '/api';

const getToken = () => sessionStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': getToken() || '',
});

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login:         (data) => request('POST', '/auth/login', data),
  register:      (data) => request('POST', '/auth/register', data),
  dashboard:     ()     => request('GET',  '/team/dashboard'),
  updateChecklist:(data)=> request('POST', '/team/checklist', data),
  getChat:       (teamId) => request('GET',  `/chat/messages${teamId ? `?team_id=${teamId}` : ''}`),
  sendMessage:   (data)   => request('POST', '/chat/send', data),
  submitGitRepo: (data) => request('POST', '/team/git-repo', data),
  getGitStats:   ()     => request('GET',  '/team/git-stats'),
  refreshGitStats:()    => request('POST', '/team/refresh-git-stats'),

  // Admin
  adminStats:    ()     => request('GET',  '/admin/stats'),
  lockTeam:      (id)   => request('POST', '/admin/team/lock',   { team_id: id }),
  unlockTeam:    (id)   => request('POST', '/admin/team/unlock', { team_id: id }),
  setProgress:   (data) => request('POST', '/admin/team/progress', data),
  updateSettings: (data) => request('POST', '/admin/settings/update', data),
  updateSchedule: (data) => request('POST', '/admin/schedule/update', data),
  listAdmins:     ()     => request('GET',  '/admins'),
  addAdmin:       (data) => request('POST', '/admin/add', data),
  createTeam:     (data) => request('POST', '/admin/team/create', data),
  assignAdmin:    (data) => request('POST', '/admin/team/assign-admin', data),
  selectAdmin:    (data) => request('POST', '/team/select-admin', data),
  listTeams:      ()     => request('GET',  '/admin/teams'),
  updateTeam:     (data) => request('POST', '/admin/team/update', data),
  deleteTeam:     (id)   => request('POST', '/admin/team/delete', { id }),
  updateAdmin:    (data) => request('POST', '/admin/update', data),
  deleteAdmin:    (id)   => request('POST', '/admin/delete', { id }),
  postAnnouncement:(data) => request('POST', '/admin/announcement', data),
  getAnnouncements:()    => request('GET',  '/announcements'),
  getLeaderboard:  ()    => request('GET',  '/leaderboard'),
  getResources:    ()    => request('GET',  '/resources'),
  addResource:     (data) => request('POST', '/admin/resource/add', data),
  deleteResource:  (id)   => request('POST', '/admin/resource/delete', { id }),
  listProblemStatements: () => request('GET', '/problem-statements'),
  
  // Kanban
  getKanban: () => request('GET', '/kanban'),
  updateKanban: (data) => request('POST', '/kanban/update', data),
  deleteKanban: (data) => request('POST', '/kanban/delete', data),
};

export const publicApi = {
  fetchLandingData: () => {
    return fetch('/api/landing').then(r => r.json());
  },
};

// Auth helpers
export const auth = {
  save: (token, user) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
  getUser: () => {
    try { return JSON.parse(sessionStorage.getItem('user')) || null; }
    catch { return null; }
  },
  getRole: () => {
    const user = auth.getUser();
    return user ? user.role : null;
  },
  getToken: () => sessionStorage.getItem('token'),
  isLoggedIn: () => !!sessionStorage.getItem('token'),
};
