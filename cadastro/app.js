const STORAGE_KEY="hello-world-project.users.v1";
const form=document.getElementById("userForm");
const list=document.getElementById("userList");
const empty=document.getElementById("empty");
const count=document.getElementById("userCount");
const search=document.getElementById("search");
const message=document.getElementById("formMessage");

function loadUsers(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return[]}}
function saveUsers(users){localStorage.setItem(STORAGE_KEY,JSON.stringify(users))}
function normalize(value){return value.trim().toLowerCase()}
async function hashPassword(password){
 const data=new TextEncoder().encode(password);
 const hash=await crypto.subtle.digest("SHA-256",data);
 return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function setMessage(text=""){message.textContent=text}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function render(){
 const users=loadUsers(),term=normalize(search.value);
 const filtered=users.filter(u=>[u.name,u.username,u.email].some(v=>normalize(v).includes(term)));
 count.textContent=users.length;
 empty.classList.toggle("hidden",filtered.length!==0);
 list.innerHTML=filtered.map(u=>'<article class="user"><div class="userInfo"><strong>'+escapeHtml(u.name)+'</strong><span>@'+escapeHtml(u.username)+' · '+escapeHtml(u.email)+'</span></div><button class="danger" data-id="'+escapeHtml(u.id)+'">Excluir</button></article>').join("");
}
form.addEventListener("submit",async event=>{
 event.preventDefault();setMessage("");
 const data=new FormData(form);
 const name=String(data.get("name")||"").trim();
 const username=String(data.get("username")||"").trim();
 const email=normalize(String(data.get("email")||""));
 const birthDate=String(data.get("birthDate")||"");
 const password=String(data.get("password")||"");
 const passwordConfirm=String(data.get("passwordConfirm")||"");
 if(name.length<2)return setMessage("Informe um nome válido.");
 if(!/^[A-Za-z0-9_.-]{3,30}$/.test(username))return setMessage("O usuário deve ter 3–30 caracteres.");
 if(!/^\S+@\S+\.\S+$/.test(email))return setMessage("Informe um e-mail válido.");
 if(password.length<6)return setMessage("A senha precisa ter pelo menos 6 caracteres.");
 if(password!==passwordConfirm)return setMessage("As senhas não conferem.");
 const users=loadUsers();
 if(users.some(u=>normalize(u.username)===normalize(username)))return setMessage("Esse usuário já está cadastrado.");
 if(users.some(u=>u.email===email))return setMessage("Esse e-mail já está cadastrado.");
 const passwordHash=await hashPassword(password);
 users.push({id:crypto.randomUUID(),name,username,email,birthDate,passwordHash,createdAt:new Date().toISOString()});
 saveUsers(users);form.reset();message.style.color="#087443";setMessage("Usuário cadastrado com sucesso.");render();
 setTimeout(()=>{message.style.color="";setMessage("")},2500);
});
list.addEventListener("click",event=>{
 const button=event.target.closest("button[data-id]");if(!button)return;
 saveUsers(loadUsers().filter(u=>u.id!==button.dataset.id));render();
});
search.addEventListener("input",render);render();