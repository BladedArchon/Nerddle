import React, { useState, useEffect } from 'react';

/* ---------------------------
   LocalStorage keys & utils
   --------------------------- */
const LS_USERS = 'users';
const LS_CURRENT = 'currentUser';
const LS_BLOGS = 'blogs';

const placeholderPfp = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
     <rect width='100%' height='100%' fill='#d1d5db'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-size='36' font-family='Arial'>N</text>
   </svg>`
);

const getUsers = () => {
  const raw = window.localStorage.getItem(LS_USERS);
  if (!raw) {
    // seed with admin user
    const purplePfp = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='#7c3aed'/></svg>`
    );
    const seed = [{
      username: 'gyatt123',
      password: 'gyatt123',
      email: 'admin@nerddle.local',
      fullname: 'Gyatt Admin',
      classLevel: 12,
      bio: 'Founder & Admin',
      pfp: purplePfp,
      joinedAt: new Date().toISOString(),
      role: 'admin'
    }];
    window.localStorage.setItem(LS_USERS, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const saveUsers = (users) => {
  window.localStorage.setItem(LS_USERS, JSON.stringify(users));
};

const getCurrentUser = () => {
  const raw = window.localStorage.getItem(LS_CURRENT);
  return raw ? JSON.parse(raw) : null;
};

const setCurrentUser = (u) => {
  if (u) window.localStorage.setItem(LS_CURRENT, JSON.stringify(u));
  else window.localStorage.removeItem(LS_CURRENT);
};

const getBlogs = () => {
  const raw = window.localStorage.getItem(LS_BLOGS);
  return raw ? JSON.parse(raw) : [];
};

const saveBlogs = (blogs) => {
  window.localStorage.setItem(LS_BLOGS, JSON.stringify(blogs));
};

/* ---------------------------
   Simple Hash Router
   --------------------------- */
const RouterContext = React.createContext();

const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handler = () => setCurrentPath(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

const useRouter = () => {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be inside Router');
  return ctx;
};

const Link = ({ to, children, className = '', onClick }) => {
  const { navigate } = useRouter();
  const handle = (e) => {
    e.preventDefault();
    navigate(to);
    if (onClick) onClick(e);
  };
  return (
    <a href={`#${to}`} onClick={handle} className={className}>
      {children}
    </a>
  );
};

/* ---------------------------
   Aura helpers
   --------------------------- */
const computeAuraForUser = (username) => {
  const blogs = getBlogs().filter(b => b.author === username);
  let up = 0, down = 0;
  blogs.forEach(b => {
    const votes = b.votes || {};
    Object.values(votes).forEach(v => {
      if (v === 1) up++;
      else if (v === -1) down++;
    });
  });
  const delta = up - down;
  if (delta === 0) return 0;
  const aura = Math.sign(delta) * Math.ceil(Math.sqrt(Math.abs(delta) / 100));
  return aura;
};

const auraColorClass = (aura) => {
  if (aura <= 0) return 'text-black';
  if (aura <= 50) return 'text-green-600';
  if (aura <= 500) return 'text-red-600';
  return 'text-purple-600';
};

/* ---------------------------
   Navbar
   --------------------------- */
const Navbar = ({ currentUser, onLogout }) => (
  <nav className="bg-blue-600 text-white p-4 shadow">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-xl font-bold">Nerddle</Link>
        <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">Home</Link>
        <Link to="/blogs" className="hover:bg-blue-700 px-3 py-2 rounded">Blogs</Link>
        <Link to="/users" className="hover:bg-blue-700 px-3 py-2 rounded">Users</Link>
      </div>

      <div className="space-x-3">
        {currentUser ? (
          <>
            <Link to={`/profile/${currentUser.username}`} className="hover:bg-blue-700 px-3 py-2 rounded">Profile</Link>
            {currentUser.role === 'admin' && <Link to="/admin" className="hover:bg-blue-700 px-3 py-2 rounded">Admin</Link>}
            <button onClick={onLogout} className="bg-blue-800 px-3 py-2 rounded hover:bg-blue-900">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded">Login</Link>
            <a href="https://forms.google.com" target="_blank" rel="noreferrer" className="bg-green-500 px-3 py-2 rounded hover:bg-green-600">Sign Up</a>
          </>
        )}
      </div>
    </div>
  </nav>
);

/* ---------------------------
   Pages
   --------------------------- */

const HomePage = () => (
  <div className="container mx-auto p-8 text-center">
    <h1 className="text-4xl font-bold mb-2">Welcome to Nerddle</h1>
    <p className="text-gray-700">Text blogs only. No file uploads, no LaTeX. Simple, fast.</p>
  </div>
);

// Login
const LoginPage = ({ onLogin }) => {
  const { navigate } = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => setErr(''), [username, password]);

  const submit = (e) => {
    e.preventDefault();
    const users = getUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      onLogin(found);
      setCurrentUser(found);
      navigate('/');
      return;
    }
    setErr('Invalid username or password');
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {err && <div className="text-red-600 mb-3">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full border px-3 py-2 rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        </form>
      </div>
    </div>
  );
};

// Users
const UsersPage = () => {
  const [users, setUsersState] = useState([]);

  useEffect(() => {
    setUsersState(getUsers().slice().sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)));
  }, []);

  const imgOnError = (e) => {
    e.target.src = placeholderPfp;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Users</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(u => {
          const aura = computeAuraForUser(u.username);
          return (
            <div key={u.username} className="bg-white p-4 rounded shadow">
              <div className="flex items-center space-x-4">
                <img src={u.pfp || placeholderPfp} alt={`${u.username} pfp`} onError={imgOnError} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <a href={`#/profile/${u.username}`} className={`font-semibold ${auraColorClass(aura)} text-lg`}>{u.fullname}</a>
                  <div className="text-gray-600">@{u.username}</div>
                  <div className="text-sm text-gray-500">Class {u.classLevel}</div>
                </div>
              </div>
              <p className="mt-3 text-gray-700">{u.bio}</p>
              <div className="mt-3 text-sm">
                Aura: <span className={`${auraColorClass(aura)} font-semibold`}>{aura}</span>
                {aura > 500 && <span className="ml-2 inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Invited Admin</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Profile
const ProfilePage = ({ currentUser, username }) => {
  const { navigate } = useRouter();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullname: '', bio: '', classLevel: 9, pfp: '' });

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const u = getUsers().find(x => x.username === username);
    if (!u) { setUser(null); return; }
    setUser(u);
    setForm({ fullname: u.fullname, bio: u.bio, classLevel: u.classLevel, pfp: u.pfp || '' });
  }, [username, currentUser, navigate]);

  if (!user) return <div className="container mx-auto p-8">User not found</div>;

  const canEdit = currentUser.username === username || currentUser.role === 'admin';
  const canEditClass = currentUser.role === 'admin';

  const save = () => {
    const users = getUsers().map(u => {
      if (u.username !== username) return u;
      // allow pfp change now (URL)
      return {
        ...u,
        fullname: form.fullname,
        bio: form.bio,
        classLevel: canEditClass ? form.classLevel : u.classLevel,
        pfp: form.pfp || u.pfp || ''
      };
    });
    saveUsers(users);
    const updated = users.find(u => u.username === username);
    setUser(updated);
    if (currentUser.username === username) {
      setCurrentUser(updated);
    }
    setEditing(false);
  };

  const imgOnError = (e) =>{ e.target.src = placeholderPfp; };

  const aura = computeAuraForUser(username);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center space-x-6">
          <img src={user.pfp || placeholderPfp} alt="pfp" onError={imgOnError} className="w-28 h-28 rounded-full object-cover" />
          <div>
            <h2 className={`text-2xl font-bold ${auraColorClass(aura)}`}>{user.fullname}</h2>
            <div className="text-gray-600">@{user.username} {user.role === 'admin' && <span className="ml-2 bg-purple-600 text-white px-2 py-0.5 rounded text-xs">Admin</span>}</div>
            <div className="text-gray-500 mt-1">Class {user.classLevel}</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">Bio</h3>
          {!editing ? <p className="text-gray-700 mt-2">{user.bio}</p> : (
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full border rounded p-2" />
          )}
        </div>

        {canEdit && (
          <div className="mt-4">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Edit Profile</button>
            ) : (
              <div className="space-y-3">
                <input value={form.fullname} onChange={e => setForm({ ...form, fullname: e.target.value })} className="border px-2 py-1 rounded w-full" />
                <input value={form.pfp} onChange={e => setForm({ ...form, pfp: e.target.value })} placeholder="Profile picture URL (leave blank to keep)" className="border px-2 py-1 rounded w-full" />
                {canEditClass && (
                  <select value={form.classLevel} onChange={e => setForm({ ...form, classLevel: parseInt(e.target.value) })} className="border px-2 py-1 rounded">
                    {[8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                )}
                <div className="flex space-x-2">
                  <button onClick={save} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
                  <button onClick={() => { setEditing(false); setForm({ fullname: user.fullname, bio: user.bio, classLevel: user.classLevel, pfp: user.pfp || '' }); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-sm">
          Aura: <span className={`${auraColorClass(aura)} font-semibold`}>{aura}</span>
        </div>
      </div>
    </div>
  );
};

// Blogs (text only)
const BlogsPage = ({ currentUser }) => {
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { navigate } = useRouter();

  useEffect(() => {
    setBlogs(getBlogs().slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  const canCreate = () => {
    if (!currentUser) return false;
    const all = getBlogs().filter(b => b.author === currentUser.username);
    if (all.length === 0) return true;
    const last = all.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return (Date.now() - new Date(last.createdAt).getTime()) >= 1000 * 60 * 60; // 1 hour
  };

  const handleCreate = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (!title.trim() || !body.trim()) { alert('Title and body required'); return; }
    if (!canCreate()) { alert('You may only post one blog per hour'); return; }

    const blogsArr = getBlogs();
    const newBlog = {
      id: 'b_' + Math.random().toString(36).slice(2,9),
      title: title.trim(),
      body: body.trim(),
      author: currentUser.username,
      createdAt: new Date().toISOString(),
      votes: {}
    };
    const updated = [newBlog, ...blogsArr];
    saveBlogs(updated);
    setBlogs(updated);
    setTitle(''); setBody('');
  };

  const handleVote = (id, who, v) => {
    if (!who) { alert('Please login to vote'); return; }
    const all = getBlogs();
    const updated = all.map(b => {
      if (b.id !== id) return b;
      const votes = { ...(b.votes || {}) };
      if (votes[who] === v) delete votes[who];
      else votes[who] = v;
      return { ...b, votes };
    });
    saveBlogs(updated);
    setBlogs(updated.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const countVotes = (votes) => {
    let up = 0, down = 0;
    if (!votes) return { up, down };
    Object.values(votes).forEach(val => { if (val === 1) up++; else if (val === -1) down++; });
    return { up, down };
  };

  return (
    <div className="container mx-auto p-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">Blogs</h1>
          {blogs.map(b => {
            const { up, down } = countVotes(b.votes);
            const delta = up - down;
            return (
              <div key={b.id} className="bg-white p-4 rounded shadow mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <a href={`#/profile/${b.author}`} className="font-semibold">{b.author}</a>
                    <div className="text-gray-500 text-sm">{new Date(b.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-600">Δ {delta}</div>
                </div>
                <h2 className="text-xl font-bold mt-3">{b.title}</h2>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{b.body}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <button onClick={() => handleVote(b.id, currentUser && currentUser.username, 1)} className="px-3 py-1 bg-green-100 rounded">Upvote</button>
                  <button onClick={() => handleVote(b.id, currentUser && currentUser.username, -1)} className="px-3 py-1 bg-red-100 rounded">Downvote</button>
                  <div className="text-sm text-gray-600">{up} ↑ / {down} ↓</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Create Blog</h3>
            {!currentUser ? (
              <div>Please <Link to="/login" className="text-blue-600">login</Link> to create blogs.</div>
            ) : (
              <>
                <div className="text-sm mb-2">You may post at most <b>1 blog per hour</b>.</div>
                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full border px-2 py-1 rounded mb-2" />
                <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} rows={8} className="w-full border px-2 py-1 rounded mb-2" />
                <button onClick={handleCreate} disabled={!canCreate()} className={`w-full py-2 rounded ${canCreate() ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>Post Blog</button>
                {!canCreate() && <div className="text-sm text-red-500 mt-2">You must wait 1 hour between blog posts.</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   Admin dashboard
   --------------------------- */
const AdminDashboard = ({ currentUser }) => {
  const { navigate } = useRouter();
  const [users, setUsersState] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', pfp: '', username: '', fullname: '', classLevel: 9, bio: '', password: '' });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') { navigate('/login'); return; }
    setUsersState(getUsers());
  }, [currentUser, navigate]);

  const reload = () => setUsersState(getUsers());

  const handleDelete = (username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    const updated = getUsers().filter(u => u.username !== username);
    saveUsers(updated);
    reload();
  };

  const saveEdit = () => {
    const updated = getUsers().map(u => u.username === editing.username ? editing : u);
    saveUsers(updated);
    setEditing(null);
    reload();
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullname || !newUser.email) {
      alert('Fill required fields'); return;
    }
    const arr = getUsers();
    if (arr.some(u => u.username === newUser.username)) { alert('Username exists'); return; }
    const u = { ...newUser, joinedAt: new Date().toISOString(), role: 'user' };
    saveUsers([...arr, u]);
    setNewUser({ email: '', pfp: '', username: '', fullname: '', classLevel: 9, bio: '', password: '' });
    reload();
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Add User</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input placeholder="Email *" className="border px-2 py-1" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          <input placeholder="Profile pic URL" className="border px-2 py-1" value={newUser.pfp} onChange={e => setNewUser({ ...newUser, pfp: e.target.value })} />
          <input placeholder="Username *" className="border px-2 py-1" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
          <input placeholder="Fullname *" className="border px-2 py-1" value={newUser.fullname} onChange={e => setNewUser({ ...newUser, fullname: e.target.value })} />
          <select value={newUser.classLevel} onChange={e => setNewUser({ ...newUser, classLevel: parseInt(e.target.value) })} className="border px-2 py-1">
            {[8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input placeholder="Password *" type="password" className="border px-2 py-1" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          <textarea placeholder="Bio" className="border px-2 py-1 md:col-span-2" rows={3} value={newUser.bio} onChange={e => setNewUser({ ...newUser, bio: e.target.value })} />
          <button onClick={addUser} className="bg-green-500 text-white px-4 py-2 rounded md:col-span-2">Add User</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">User Management</h2>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead><tr className="bg-gray-100">
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Fullname</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Class</th>
              <th className="p-2 text-left">Joined</th>
              <th className="p-2 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {getUsers().slice().sort((a,b)=> new Date(b.joinedAt) - new Date(a.joinedAt)).map(u => (
                <tr key={u.username} className="border-b">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.fullname}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.classLevel}</td>
                  <td className="p-2">{new Date(u.joinedAt).toLocaleString()}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => setEditing({ ...u })} className="bg-blue-500 text-white px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(u.username)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-full max-w-xl">
            <h3 className="font-semibold mb-2">Edit {editing.username}</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="border px-2 py-1" value={editing.fullname} onChange={e => setEditing({ ...editing, fullname: e.target.value })} />
              <input className="border px-2 py-1" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} />
              <input className="border px-2 py-1" value={editing.pfp} onChange={e => setEditing({ ...editing, pfp: e.target.value })} />
              <select value={editing.classLevel} onChange={e => setEditing({ ...editing, classLevel: parseInt(e.target.value) })} className="border px-2 py-1">
                {[8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input type="password" placeholder="Password" className="border px-2 py-1" value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} />
              <select value={editing.role || 'user'} onChange={e => setEditing({ ...editing, role: e.target.value })} className="border px-2 py-1">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <textarea className="border px-2 py-1 md:col-span-2" value={editing.bio} onChange={e => setEditing({ ...editing, bio: e.target.value })} />
            </div>
            <div className="mt-3 flex justify-end space-x-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Routing helpers
   --------------------------- */
const Route = ({ path, component: Component, exact = false, ...props }) => {
  const { currentPath } = React.useContext(RouterContext);
  const clean = currentPath.replace('#', '') || '/';
  if (path.includes(':')) {
    const pSeg = path.split('/');
    const cSeg = clean.split('/');
    if (pSeg.length !== cSeg.length) return null;
    const params = {};
    let match = true;
    for (let i = 0; i < pSeg.length; i++) {
      if (pSeg[i].startsWith(':')) params[pSeg[i].slice(1)] = cSeg[i];
      else if (pSeg[i] !== cSeg[i]) { match = false; break; }
    }
    if (!match) return null;
    return <Component {...props} {...params} />;
  }
  if (exact) return clean === path ? <Component {...props} /> : null;
  return clean.startsWith(path) ? <Component {...props} /> : null;
};

const ProtectedRoute = ({ children, currentUser, requiredRole }) => {
  const { navigate } = useRouter();
  useEffect(() => {
    if (!currentUser) navigate('/login');
    else if (requiredRole && currentUser.role !== requiredRole) navigate('/');
  }, [currentUser, requiredRole, navigate]);
  if (!currentUser) return null;
  if (requiredRole && currentUser.role !== requiredRole) return null;
  return children;
};

/* ---------------------------
   Main App
   --------------------------- */
const App = () => {
  const [currentUser, setCurrentUserState] = useState(null);

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUserState(u);
  }, []);

  const handleLogin = (u) => {
    setCurrentUserState(u);
    setCurrentUser(u);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
    window.location.hash = '/';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar currentUser={currentUser} onLogout={handleLogout} />

        <div>
          <Route path="/" exact={true} component={() => <HomePage />} />
          <Route path="/login" component={() => <LoginPage onLogin={handleLogin} />} />
          <Route path="/users" component={() => <UsersPage />} />
          <Route path="/blogs" component={() => <BlogsPage currentUser={currentUser} />} />
          <Route path="/profile/:username" component={({ username }) => (
            <ProtectedRoute currentUser={currentUser}>
              <ProfilePage currentUser={currentUser} username={username} />
            </ProtectedRoute>
          )} />
          <Route path="/admin" component={() => (
            <ProtectedRoute currentUser={currentUser} requiredRole="admin">
              <AdminDashboard currentUser={currentUser} />
            </ProtectedRoute>
          )} />
        </div>
      </div>
    </Router>
  );
};

export default App;
