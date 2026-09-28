import { FormEvent, useMemo, useState } from "react";

type Role = "user" | "admin";
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  birthDate: string;
  passwordHash: string;
  createdAt: string;
  role: Role;
  active: boolean;
};

const KEY = "hello-world-project.users.v3";
const SESSION_KEY = "hello-world-project.session";

const normalize = (value: string) => value.trim().toLowerCase();

function loadUsers(): User[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(saved)
      ? saved.map((u: Partial<User>) => ({ ...u, role: u.role || "user", active: u.active !== false })) as User[]
      : [];
  } catch {
    return [];
  }
}

async function hash(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function saveUsers(users: User[]) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

export default function App() {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [session, setSession] = useState<string | null>(getSession);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"dashboard" | "users" | "profile">("dashboard");
  const [form, setForm] = useState({
    name: "", username: "", email: "", birthDate: "", password: "", confirm: "", role: "user" as Role,
  });
  const [message, setMessage] = useState("");

  const currentUser = users.find((u) => u.id === session);
  const isAdmin = currentUser?.role === "admin";

  function ensureAdmin() {
    if (users.some((u) => u.role === "admin")) return;
    // Conta administrativa apenas para demonstração local.
    hash("admin123").then((passwordHash) => {
      const admin: User = {
        id: crypto.randomUUID(), name: "Administrador", username: "admin",
        email: "admin@local.test", birthDate: "", passwordHash,
        createdAt: new Date().toISOString(), role: "admin", active: true,
      };
      const next = [...users, admin];
      saveUsers(next);
      setUsers(next);
    });
  }

  if (users.length === 0) ensureAdmin();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginMessage("");
    const passwordHash = await hash(login.password);
    const found = users.find(
      (u) => normalize(u.username) === normalize(login.username) && u.passwordHash === passwordHash
    );
    if (!found) return setLoginMessage("Usuário ou senha incorretos.");
    if (!found.active) return setLoginMessage("Esta conta está bloqueada.");
    localStorage.setItem(SESSION_KEY, found.id);
    setSession(found.id);
    setLogin({ username: "", password: "" });
    setView("dashboard");
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (form.name.trim().length < 2) return setMessage("Informe um nome válido.");
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(form.username)) return setMessage("Nome de usuário inválido.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setMessage("Informe um e-mail válido.");
    if (form.password.length < 6) return setMessage("A senha precisa ter pelo menos 6 caracteres.");
    if (form.password !== form.confirm) return setMessage("As senhas não conferem.");
    if (users.some((u) => normalize(u.username) === normalize(form.username)))
      return setMessage("Nome de usuário já cadastrado.");
    if (users.some((u) => normalize(u.email) === normalize(form.email)))
      return setMessage("E-mail já cadastrado.");

    const newUser: User = {
      id: crypto.randomUUID(), name: form.name.trim(), username: form.username.trim(),
      email: normalize(form.email), birthDate: form.birthDate,
      passwordHash: await hash(form.password), createdAt: new Date().toISOString(),
      role: isAdmin ? form.role : "user", active: true,
    };
    const next = [...users, newUser];
    saveUsers(next);
    setUsers(next);
    setForm({ name: "", username: "", email: "", birthDate: "", password: "", confirm: "", role: "user" });
    setMessage("Usuário cadastrado com sucesso.");
  }

  function toggleUser(id: string) {
    if (!isAdmin || id === currentUser?.id) return;
    const next = users.map((u) => u.id === id ? { ...u, active: !u.active } : u);
    saveUsers(next);
    setUsers(next);
  }

  function changeRole(id: string, role: Role) {
    if (!isAdmin || id === currentUser?.id) return;
    const next = users.map((u) => u.id === id ? { ...u, role } : u);
    saveUsers(next);
    setUsers(next);
  }

  function removeUser(id: string) {
    if (!isAdmin || id === currentUser?.id) return;
    const next = users.filter((u) => u.id !== id);
    saveUsers(next);
    setUsers(next);
  }

  const filtered = useMemo(() => users.filter((u) =>
    [u.name, u.username, u.email, u.role].some((v) => normalize(v).includes(normalize(search)))
  ), [users, search]);

  if (!currentUser) {
    return (
      <main className="authPage">
        <section className="authCard">
          <span className="badge">SISTEMA DE USUÁRIOS</span>
          <h1>Entrar</h1>
          <p className="muted">Acesse seu painel de usuário ou administrador.</p>
          <form onSubmit={handleLogin}>
            <label>Usuário<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} required /></label>
            <label>Senha<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required /></label>
            {loginMessage && <p className="message">{loginMessage}</p>}
            <button type="submit">Entrar</button>
          </form>
          <div className="demoBox">
            <strong>Acesso administrativo de demonstração</strong>
            <span>Usuário: <b>admin</b> · Senha: <b>admin123</b></span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div>
          <span className="badge">GRB SYSTEM</span>
          <h2>Painel</h2>
          <nav>
            <button className={view === "dashboard" ? "navActive" : ""} onClick={() => setView("dashboard")}>📊 Dashboard</button>
            {isAdmin && <button className={view === "users" ? "navActive" : ""} onClick={() => setView("users")}>👥 Usuários</button>}
            <button className={view === "profile" ? "navActive" : ""} onClick={() => setView("profile")}>👤 Meu perfil</button>
          </nav>
        </div>
        <div className="accountBox">
          <strong>{currentUser.name}</strong>
          <span>@{currentUser.username}</span>
          <span className="role">{isAdmin ? "Administrador" : "Usuário"}</span>
          <button className="logout" onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="content">
        {view === "dashboard" && (
          <>
            <div className="pageTitle"><div><span className="badge">{isAdmin ? "PAINEL ADMINISTRATIVO" : "ÁREA DO USUÁRIO"}</span><h1>Olá, {currentUser.name}!</h1><p className="muted">{isAdmin ? "Gerencie as contas e o acesso ao sistema." : "Bem-vindo ao seu painel pessoal."}</p></div></div>
            <div className="stats">
              <div className="statCard"><span>Seu perfil</span><b>{isAdmin ? "Administrador" : "Usuário"}</b></div>
              <div className="statCard"><span>Conta</span><b>{currentUser.active ? "Ativa" : "Bloqueada"}</b></div>
              {isAdmin && <div className="statCard"><span>Total de contas</span><b>{users.length}</b></div>}
            </div>
            {isAdmin ? (
              <section className="card">
                <h2>Resumo administrativo</h2>
                <p className="muted">Você pode cadastrar contas, alterar o nível de acesso, bloquear/desbloquear e excluir usuários.</p>
                <button onClick={() => setView("users")}>Gerenciar usuários</button>
              </section>
            ) : (
              <section className="card">
                <h2>Minha conta</h2>
                <div className="profileGrid"><div><span>Nome</span><strong>{currentUser.name}</strong></div><div><span>Usuário</span><strong>@{currentUser.username}</strong></div><div><span>E-mail</span><strong>{currentUser.email}</strong></div></div>
              </section>
            )}
          </>
        )}

        {view === "profile" && (
          <section className="card">
            <span className="badge">MEU PERFIL</span><h1>Dados da conta</h1>
            <div className="profileGrid"><div><span>Nome completo</span><strong>{currentUser.name}</strong></div><div><span>Nome de usuário</span><strong>@{currentUser.username}</strong></div><div><span>E-mail</span><strong>{currentUser.email}</strong></div><div><span>Tipo de conta</span><strong>{isAdmin ? "Administrador" : "Usuário normal"}</strong></div><div><span>Cadastro</span><strong>{new Date(currentUser.createdAt).toLocaleDateString("pt-BR")}</strong></div></div>
          </section>
        )}

        {view === "users" && isAdmin && (
          <>
            <section className="card">
              <div className="listHead"><div><span className="badge">ADMINISTRAÇÃO</span><h1>Usuários</h1><p className="muted">Crie e gerencie as contas do sistema.</p></div><input className="search" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <h2>Novo usuário</h2>
              <form onSubmit={createUser}>
                <div className="grid">{[["name","Nome completo","text"],["username","Nome de usuário","text"],["email","E-mail","email"],["birthDate","Data de nascimento","date"],["password","Senha","password"],["confirm","Confirmar senha","password"]].map(([key,label,type]) => <label key={key}>{label}<input type={type} value={(form as Record<string,string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key !== "birthDate"} /></label>)}
                  <label>Tipo de conta<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}><option value="user">Usuário normal</option><option value="admin">Administrador</option></select></label>
                </div>
                {message && <p className={message.includes("sucesso") ? "success" : "message"}>{message}</p>}
                <button type="submit">Cadastrar conta</button>
              </form>
            </section>
            <section className="card">
              <h2>Contas cadastradas ({filtered.length})</h2>
              <div className="users">{filtered.map((u) => <div className="user" key={u.id}><div><strong>{u.name}</strong><span>@{u.username} · {u.email}</span><small className={u.active ? "active" : "blocked"}>{u.active ? "● Ativa" : "● Bloqueada"} · {u.role === "admin" ? "Administrador" : "Usuário"}</small></div><div className="actions">{u.id !== currentUser.id && <><select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as Role)}><option value="user">Usuário</option><option value="admin">Admin</option></select><button className="secondary" onClick={() => toggleUser(u.id)}>{u.active ? "Bloquear" : "Desbloquear"}</button><button className="remove" onClick={() => removeUser(u.id)}>Excluir</button></>}</div></div>)}</div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}