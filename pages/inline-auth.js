!function(){"use strict";

/* ── CSS ── */
var e=document.createElement("style");
e.textContent=[
".s2i-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998;opacity:0;transition:opacity .25s;pointer-events:none;}",
".s2i-overlay.active{opacity:1;pointer-events:all;}",
'.s2i-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.95);z-index:9999;background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:2.5rem 2rem 2rem;width:380px;max-width:92vw;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;font-family:"Poppins",sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.12);}',
".s2i-modal.active{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:all;}",
".s2i-modal-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#999;font-size:1.4rem;cursor:pointer;line-height:1;padding:4px;}",
".s2i-modal-close:hover{color:#333;}",
".s2i-modal h3{margin:0 0 .25rem;color:#1A1A1A;font-size:1.25rem;font-weight:600;text-align:center;}",
'.s2i-modal p.subtitle{margin:0 0 1.5rem;color:#999;font-size:.82rem;text-align:center;font-family:"Poppins",sans-serif;}',
'.s2i-modal label{display:block;margin-bottom:.35rem;color:#555;font-size:.78rem;font-family:"Poppins",sans-serif;letter-spacing:.3px;font-weight:500;}',
'.s2i-modal input{width:100%;padding:.6rem .75rem;background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;color:#1A1A1A;font-size:.88rem;font-family:"Poppins",sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box;}',
".s2i-modal input:focus{border-color:#C9A961;background:#fff;}",
".s2i-modal .field{margin-bottom:1rem;}",
'.s2i-modal .s2i-btn{display:block;width:100%;padding:.7rem;background:#C9A961;color:#fff;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .2s;font-family:"Poppins",sans-serif;}',
".s2i-modal .s2i-btn:hover{background:#A88B4E;}",
".s2i-modal .s2i-btn:disabled{opacity:.5;cursor:not-allowed;}",
'.s2i-modal .toggle-link{display:block;margin-top:1rem;text-align:center;color:#C9A961;font-size:.82rem;cursor:pointer;font-family:"Poppins",sans-serif;text-decoration:none;}',
".s2i-modal .toggle-link:hover{text-decoration:underline;}",
'.s2i-modal .error-msg{color:#ef4444;font-size:.8rem;margin-top:.5rem;text-align:center;font-family:"Poppins",sans-serif;min-height:1.2em;}',
'.s2i-modal .success-msg{color:#22c55e;font-size:.8rem;margin-top:.5rem;text-align:center;font-family:"Poppins",sans-serif;}',
'.s2i-modal .forgot-link{display:inline-block;margin-top:.25rem;color:#999;font-size:.75rem;cursor:pointer;font-family:"Poppins",sans-serif;}',
".s2i-modal .forgot-link:hover{color:#C9A961;}",
".s2i-modal .name-row{display:flex;gap:.75rem;}",
".s2i-modal .name-row .field{flex:1;}",
/* Google button styles */
'.s2i-google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:.65rem;background:#fff;color:#333;border:1px solid #e0e0e0;border-radius:6px;font-size:.88rem;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s,box-shadow .2s;font-family:"Poppins",sans-serif;}',
".s2i-google-btn:hover{background:#fafafa;border-color:#ccc;box-shadow:0 1px 3px rgba(0,0,0,.08);}",
".s2i-google-btn:disabled{opacity:.5;cursor:not-allowed;}",
".s2i-google-btn svg{width:18px;height:18px;flex-shrink:0;}",
'.s2i-divider{display:flex;align-items:center;gap:12px;margin:1rem 0;color:#bbb;font-size:.78rem;font-family:"Poppins",sans-serif;}',
".s2i-divider::before,.s2i-divider::after{content:'';flex:1;height:1px;background:#e8e8e8;}",
/* User nav styles */
".s2i-user-nav{position:relative;display:flex;align-items:center;gap:8px;cursor:pointer;padding:.35rem .75rem;border-radius:6px;transition:background .2s;}",
".s2i-user-nav:hover{background:rgba(201,169,97,.1);}",
'.s2i-user-avatar{width:32px;height:32px;border-radius:50%;background:#C9A961;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;font-family:"Poppins",sans-serif;flex-shrink:0;}',
'.s2i-user-name{color:#1A1A1A;font-size:.85rem;font-weight:600;font-family:"Poppins",sans-serif;white-space:nowrap;}',
".s2i-user-chevron{color:#999;font-size:.65rem;transition:transform .2s;}",
".s2i-user-chevron.open{transform:rotate(180deg);}",
".s2i-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border:1px solid #e8e8e8;border-radius:8px;min-width:200px;padding:.5rem 0;opacity:0;transform:translateY(-4px);transition:opacity .2s,transform .2s;pointer-events:none;z-index:9997;box-shadow:0 8px 24px rgba(0,0,0,.1);}",
".s2i-dropdown.active{opacity:1;transform:translateY(0);pointer-events:all;}",
'.s2i-dropdown a,.s2i-dropdown button{display:flex;align-items:center;gap:10px;width:100%;padding:.6rem 1rem;background:none;border:none;color:#555;font-size:.85rem;font-family:"Poppins",sans-serif;cursor:pointer;text-decoration:none;transition:background .15s,color .15s;text-align:left;}',
".s2i-dropdown a:hover,.s2i-dropdown button:hover{background:rgba(201,169,97,.08);color:#C9A961;}",
".s2i-dropdown .sep{height:1px;background:#f0f0f0;margin:.4rem 0;}",
".s2i-dropdown svg{width:16px;height:16px;flex-shrink:0;opacity:.7;}",
"@media(max-width:991px){.s2i-user-name{display:none;}.s2i-modal{padding:2rem 1.5rem 1.5rem;}}"
].join("\n");
document.head.appendChild(e);

/* ── SVG icons for dropdown ── */
var t='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
n='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
i='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
a='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15l-3-3m0 0l3-3m-3 3h12M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/></svg>',
o='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

/* ── Google logo SVG ── */
var googleLogoSVG='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';

/* ── Overlay ── */
var s=document.createElement("div");
s.className="s2i-overlay";
document.body.appendChild(s);

/* ── Modal HTML ── */
var r=document.createElement("div");
r.className="s2i-modal";
r.innerHTML=[
'<button class="s2i-modal-close" aria-label="Fechar">&times;</button>',
'<h3 id="s2i-modal-title">Iniciar sessão</h3>',
'<p class="subtitle" id="s2i-modal-subtitle">Acede à tua área de cliente</p>',
/* Google button */
'<button type="button" class="s2i-google-btn" id="s2i-google-btn">'+googleLogoSVG+' <span id="s2i-google-label">Continuar com Google</span></button>',
'<div class="s2i-divider" id="s2i-divider">ou</div>',
/* Form */
'<form id="s2i-auth-form">',
'  <div id="s2i-name-fields" class="name-row" style="display:none;">',
'    <div class="field"><label for="s2i-fname">Nome</label><input type="text" id="s2i-fname" placeholder="João" autocomplete="given-name"></div>',
'    <div class="field"><label for="s2i-lname">Apelido</label><input type="text" id="s2i-lname" placeholder="Silva" autocomplete="family-name"></div>',
'  </div>',
'  <div class="field"><label for="s2i-email">Email</label><input type="email" id="s2i-email" placeholder="o.teu@email.com" required autocomplete="email"></div>',
'  <div class="field"><label for="s2i-pass">Palavra-passe</label><input type="password" id="s2i-pass" placeholder="••••••••" required autocomplete="current-password"></div>',
'  <div class="field" id="s2i-pass-confirm-field" style="display:none;"><label for="s2i-pass2">Confirmar palavra-passe</label><input type="password" id="s2i-pass2" placeholder="••••••••" autocomplete="new-password"></div>',
'  <button type="submit" class="s2i-btn" id="s2i-submit-btn">Entrar</button>',
'  <div class="error-msg" id="s2i-error"></div>',
'  <div class="success-msg" id="s2i-success" style="display:none;"></div>',
'  <a class="forgot-link" id="s2i-forgot">Esqueceste a palavra-passe?</a>',
'  <a class="toggle-link" id="s2i-toggle">Ainda não tens conta? <strong>Cria aqui</strong></a>',
'</form>'
].join("\n");
document.body.appendChild(r);

/* ── Element references ── */
var l=document.getElementById("s2i-auth-form"),
d=document.getElementById("s2i-modal-title"),
c=document.getElementById("s2i-modal-subtitle"),
m=document.getElementById("s2i-name-fields"),
p=document.getElementById("s2i-pass-confirm-field"),
u=document.getElementById("s2i-email"),
f=document.getElementById("s2i-pass"),
g=document.getElementById("s2i-pass2"),
v=document.getElementById("s2i-fname"),
y=document.getElementById("s2i-lname"),
h=document.getElementById("s2i-submit-btn"),
b=document.getElementById("s2i-error"),
x=document.getElementById("s2i-success"),
w=document.getElementById("s2i-forgot"),
C=document.getElementById("s2i-toggle"),
k=r.querySelector(".s2i-modal-close"),
googleBtn=document.getElementById("s2i-google-btn"),
googleLabel=document.getElementById("s2i-google-label"),
dividerEl=document.getElementById("s2i-divider"),
E=!1,A=!1;

/* ── Close modal ── */
function I(){
s.classList.remove("active");
r.classList.remove("active");
document.body.style.overflow="";
b.textContent="";
x.style.display="none";
}

/* ── Switch mode ── */
function L(e){
b.textContent="";
x.style.display="none";
if("register"===e){
E=!0;A=!1;
d.textContent="Criar conta";
c.textContent="Regista-te para aceder às ferramentas";
m.style.display="flex";
p.style.display="block";
h.textContent="Criar conta";
w.style.display="none";
C.innerHTML="Já tens conta? <strong>Inicia sessão</strong>";
googleLabel.textContent="Registar com Google";
googleBtn.style.display="flex";
dividerEl.style.display="flex";
f.parentElement.style.display="block";
}else if("reset"===e){
E=!1;A=!0;
d.textContent="Recuperar palavra-passe";
c.textContent="Envia um link de recuperação para o teu email";
m.style.display="none";
p.style.display="none";
f.parentElement.style.display="none";
h.textContent="Enviar link";
w.style.display="none";
C.innerHTML="<strong>Voltar ao login</strong>";
googleBtn.style.display="none";
dividerEl.style.display="none";
}else{
E=!1;A=!1;
d.textContent="Iniciar sessão";
c.textContent="Acede à tua área de cliente";
m.style.display="none";
p.style.display="none";
f.parentElement.style.display="block";
h.textContent="Entrar";
w.style.display="";
C.innerHTML="Ainda não tens conta? <strong>Cria aqui</strong>";
googleLabel.textContent="Continuar com Google";
googleBtn.style.display="flex";
dividerEl.style.display="flex";
}
}

/* ── Google sign-in handler ── */
googleBtn.addEventListener("click",function(){
var sb=window.S2I_AUTH&&window.S2I_AUTH.supabaseClient;
if(!sb){b.textContent="Erro de ligação. Recarrega a página.";return;}
googleBtn.disabled=true;
googleLabel.textContent="A redirecionar...";
sb.auth.signInWithOAuth({
provider:"google",
options:{
redirectTo:window.location.origin+"/area-cliente/perfil"
}
}).then(function(res){
if(res.error){
b.textContent=res.error.message||"Erro ao iniciar sessão com Google.";
googleBtn.disabled=false;
googleLabel.textContent=E?"Registar com Google":"Continuar com Google";
}
}).catch(function(){
b.textContent="Erro ao iniciar sessão com Google.";
googleBtn.disabled=false;
googleLabel.textContent=E?"Registar com Google":"Continuar com Google";
});
});

/* ── Build user nav ── */
function T(){
var e,l,d=document.querySelector('a[href*="area-cliente"]');
if(d)e=d.closest("li")||d.parentElement;
else if(!(l=document.querySelector("#navbarNav .navbar-nav")||document.querySelector(".navbar-nav")||document.querySelector(".nav-links")))return;

/* ── Preserve language selector ONLY if inside the element being replaced ── */
var langEl=null;
if(e){
var langLink=e.querySelector('a[href*="/en/"]')||e.querySelector('a[href*="/pt/"]');
if(langLink&&langLink!==d){
/* Clone just the <a> link — keeps original classes/styles from React */
langEl=langLink.cloneNode(true);
}
}

var c=document.createElement("li");

function m(){
c.innerHTML="";
var e=document.createElement("a");
e.href="#";e.className="nav-link";
e.style.cssText="background:#BF9A33;color:#0a0a0a !important;padding:0.4rem 1rem;border-radius:4px;font-weight:600;transition:all 0.3s;cursor:pointer;";
e.textContent="Área de Cliente";
e.addEventListener("mouseenter",function(){this.style.background="#d4af5a"});
e.addEventListener("mouseleave",function(){this.style.background="#BF9A33"});
e.addEventListener("click",function(e){
e.preventDefault();
L("login");
s.classList.add("active");
r.classList.add("active");
document.body.style.overflow="hidden";
setTimeout(function(){u.focus()},200);
});
c.appendChild(e);
}

function p(e){
c.innerHTML="";
var s="",r="";
if(e.user_metadata&&e.user_metadata.full_name){
s=e.user_metadata.full_name.split(" ")[0];
var l=e.user_metadata.full_name.split(" ");
r=l[0].charAt(0).toUpperCase();
l.length>1&&(r+=l[l.length-1].charAt(0).toUpperCase());
}else e.user_metadata&&e.user_metadata.name?r=(s=e.user_metadata.name.split(" ")[0]).charAt(0).toUpperCase():e.email&&(r=(s=e.email.split("@")[0]).charAt(0).toUpperCase());

var d=document.createElement("div");
d.className="s2i-user-nav";
d.innerHTML=[
'<div class="s2i-user-avatar">'+r+"</div>",
'<span class="s2i-user-name">'+s+"</span>",
'<span class="s2i-user-chevron">&#9660;</span>'
].join("");

var p=document.createElement("div");
p.className="s2i-dropdown";
p.innerHTML=[
'<a href="/area-cliente/perfil">'+t+" Dashboard</a>",
'<a href="/area-cliente/perfil">'+n+" O meu perfil</a>",
'<a href="/area-cliente/planos">'+i+" Planos</a>",
'<a href="/area-cliente/membros">'+a+" Área de membros</a>",
'<div class="sep"></div>',
'<button id="s2i-logout-btn">'+o+" Terminar sessão</button>"
].join("");
d.appendChild(p);c.appendChild(d);

var u=!1;
d.addEventListener("click",function(e){
if(!e.target.closest("a")&&!e.target.closest("#s2i-logout-btn")){
u=!u;
p.classList.toggle("active",u);
d.querySelector(".s2i-user-chevron").classList.toggle("open",u);
}
});
document.addEventListener("click",function(e){
if(!d.contains(e.target)){
u=!1;p.classList.remove("active");
var t=d.querySelector(".s2i-user-chevron");
t&&t.classList.remove("open");
}
});
p.querySelector("#s2i-logout-btn").addEventListener("click",function(e){
e.stopPropagation();
var t=window.S2I_AUTH&&window.S2I_AUTH.supabaseClient;
t&&t.auth.signOut().then(function(){m()});
});
}

c.className="nav-item ms-2";
c.id="s2i-auth-nav-container";
if(e){
if(langEl){
/* Language link was inside the replaced element — wrap auth + lang together */
var wrapper=document.createElement(e.tagName||"div");
wrapper.id="s2i-auth-nav-container";
/* Copy the original element's className to preserve React/Tailwind styles */
if(e.className)wrapper.className=e.className;
else wrapper.style.cssText="display:flex;align-items:center;gap:8px;list-style:none;";
c.id="";
wrapper.appendChild(c);
wrapper.appendChild(langEl);
e.replaceWith(wrapper);
}else{
/* Language selector is a sibling — safe to just replace the auth element */
e.replaceWith(c);
}
}else if(l)l.appendChild(c);

if(window.S2I_AUTH&&window.S2I_AUTH.ready&&window.S2I_AUTH.currentUser)p(window.S2I_AUTH.currentUser);
else m();

if(window.S2I_AUTH){
var f=null;
setInterval(function(){
var e=window.S2I_AUTH.currentUser;
(e?e.id:null)!==(f?f.id:null)&&(f=e,e?p(e):m());
},500);
window.S2I_AUTH.ready||window.S2I_AUTH.onReady.push(function(e){
e.currentUser&&p(e.currentUser);
});
}
}

/* ── Event listeners ── */
k.addEventListener("click",I);
s.addEventListener("click",I);
C.addEventListener("click",function(e){e.preventDefault();L(A||E?"login":"register")});
w.addEventListener("click",function(e){e.preventDefault();L("reset")});

l.addEventListener("submit",function(e){
e.preventDefault();
b.textContent="";x.style.display="none";
var t=window.S2I_AUTH&&window.S2I_AUTH.supabaseClient;
if(t){
var n=u.value.trim(),i=f.value;
h.disabled=!0;
h.textContent=A?"A enviar...":E?"A criar...":"A entrar...";
if(A)t.auth.resetPasswordForEmail(n,{redirectTo:window.location.origin+"/area-cliente/"}).then(function(e){h.disabled=!1;h.textContent="Enviar link";e.error?b.textContent=e.error.message:(x.textContent="Email enviado! Verifica a tua caixa de correio.",x.style.display="block")});
else if(E){
if(i!==g.value){b.textContent="As palavras-passe não coincidem.";h.disabled=!1;h.textContent="Criar conta";return}
if(i.length<6){b.textContent="A palavra-passe deve ter pelo menos 6 caracteres.";h.disabled=!1;h.textContent="Criar conta";return}
var a=(v.value.trim()+" "+y.value.trim()).trim();
t.auth.signUp({email:n,password:i,options:{data:{full_name:a,name:a}}}).then(function(e){
if(h.disabled=!1,h.textContent="Criar conta",e.error){
var t=e.error.message;
-1!==t.indexOf("already registered")&&(t="Este email já está registado. Inicia sessão.");
b.textContent=t;
}else e.data&&e.data.user&&!e.data.session?(x.textContent="Conta criada! Verifica o teu email para confirmar.",x.style.display="block"):I();
});
}else t.auth.signInWithPassword({email:n,password:i}).then(function(e){
if(h.disabled=!1,h.textContent="Entrar",e.error){
var t=e.error.message;
-1!==t.indexOf("Invalid login")&&(t="Email ou palavra-passe incorretos.");
b.textContent=t;
}else I();
});
}else b.textContent="Erro de ligação. Recarrega a página.";
});

/* ── Init ── */
function _(){T()}
"loading"===document.readyState?document.addEventListener("DOMContentLoaded",_):setTimeout(_,300);

}();
