/****************************************************
 * PURGE GAME - Auth Déboguée
 * Ouvre la console (F12) pour voir les logs
 ****************************************************/

// Config
const CONFIG = {
  WHATSAPP_CHANNEL: 'https://whatsapp.com/channel/0029VbCLsX44IBhF4woPb93M',
  CONTACT: 'PrimePurge@proton.me'
};
const OWNER_PHONE = "+24160248210";
let ADMIN_LIST = ["+221708137251","+221769426236","+22897173547","+2250777315113","+50946801238"];

// État
const state = {
  user: null,
  users: [],
  currentTeam: { code: null, players: [], messages: [] },
  game1: { round: 0, playerDebts: {} },
  game2: { currentImgIndex: 0, positions: {} }
};

// BroadcastChannel
const channel = new BroadcastChannel('purge_team');
channel.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === 'TEAM_UPDATE' && data.code === state.currentTeam.code) {
    state.currentTeam.players = data.players;
    state.currentTeam.messages = data.messages;
    if (screens.lobby.classList.contains('active')) updateLobbyUI();
  }
};

// Écrans
const screens = {
  subscribe: document.getElementById('screen-subscribe'),
  auth: document.getElementById('screen-auth'),
  lobby: document.getElementById('screen-lobby'),
  game1: document.getElementById('screen-game1'),
  game2: document.getElementById('screen-game2'),
  game3: document.getElementById('screen-game3'),
  results: document.getElementById('screen-results')
};
function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
}

// Helpers localStorage
function loadUsers() {
  const saved = localStorage.getItem('purge_users');
  state.users = saved ? JSON.parse(saved) : [];
  console.log('👥 Utilisateurs chargés:', state.users);
}
function saveUsers() {
  localStorage.setItem('purge_users', JSON.stringify(state.users));
  console.log('💾 Utilisateurs sauvegardés');
}

// Admin
function loadAdminList() {
  const saved = localStorage.getItem('purge_admin_list');
  if (saved) ADMIN_LIST = JSON.parse(saved);
}
function saveAdminList() {
  localStorage.setItem('purge_admin_list', JSON.stringify(ADMIN_LIST));
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM chargé');
  loadUsers();
  loadAdminList();

  // Abonnement
  document.getElementById('verify-subscription').onclick = () => showScreen('auth');

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('login-form').classList.toggle('active', isLogin);
      document.getElementById('register-form').classList.toggle('active', !isLogin);
    };
  });

  // Register
  document.getElementById('reg-avatar-file').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => document.getElementById('reg-avatar-preview').src = ev.target.result;
      reader.readAsDataURL(file);
    }
  };
  document.getElementById('register-btn').onclick = register;

  // Login
  document.getElementById('login-btn').onclick = login;
  console.log('✅ Bouton login lié');

  // Lobby
  document.getElementById('back-to-teams').onclick = () => showScreen('auth');
  document.getElementById('copy-code-btn').onclick = () => {
    navigator.clipboard?.writeText(state.currentTeam.code);
    alert('Code copié');
  };
  document.getElementById('leave-team').onclick = leaveTeam;
  document.getElementById('start-game').onclick = startGame1;

  // Jeux...
  document.getElementById('validate-round').onclick = validateGame1Round;
  document.getElementById('submit-devine').onclick = submitDevine;
  document.getElementById('vote-blanc').onclick = voteBlanc;
  document.getElementById('next-game2').onclick = () => showScreen('game3');
  document.getElementById('finish-game3').onclick = finishGame;
  document.getElementById('play-again').onclick = () => location.reload();

  // Admin
  document.getElementById('show-admin-btn').onclick = () => {
    document.getElementById('admin-panel').classList.toggle('hidden');
  };
  document.getElementById('close-admin').onclick = () => {
    document.getElementById('admin-panel').classList.add('hidden');
  };
  document.getElementById('admin-login-btn').onclick = adminLogin;
  document.getElementById('add-admin-btn').onclick = addAdmin;
  document.getElementById('add-question-btn').onclick = addQuestion;
  document.getElementById('new-question-type').onchange = (e) => {
    document.getElementById('game2-image-field').classList.toggle('hidden', e.target.value !== 'game2');
  };

  checkBan();
});

function checkBan() {
  const ban = localStorage.getItem('purge_ban');
  if (ban && new Date(ban) > new Date()) {
    alert('Banni');
    document.body.innerHTML = '<h1>BANNI</h1>';
  }
}

// ---------- AUTH CORRIGÉE ----------
function register() {
  console.log('📝 register() appelée');
  const phone = document.getElementById('reg-phone').value.trim();
  const pseudo = document.getElementById('reg-pseudo').value.trim();
  const avatar = document.getElementById('reg-avatar-preview').src;

  if (!phone || !pseudo) {
    alert('Tous les champs sont requis');
    return;
  }

  if (state.users.find(u => u.phone === phone)) {
    alert('Numéro déjà utilisé. Connectez-vous.');
    document.querySelector('[data-tab="login"]').click();
    return;
  }

  const newUser = { phone, pseudo, avatar };
  state.users.push(newUser);
  saveUsers();
  state.user = newUser;
  console.log('✅ Inscription réussie:', state.user);
  goToLobby();
}

function login() {
  console.log('🔑 login() appelée');
  const phone = document.getElementById('login-phone').value.trim();
  const pseudo = document.getElementById('login-pseudo').value.trim();

  console.log('📱 Phone:', phone, '👤 Pseudo:', pseudo);

  if (!phone || !pseudo) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  loadUsers(); // recharger pour être sûr

  const user = state.users.find(u => u.phone === phone && u.pseudo.toLowerCase() === pseudo.toLowerCase());
  console.log('🔍 Utilisateur trouvé ?', user);

  if (!user) {
    alert('Numéro ou pseudo incorrect.');
    return;
  }

  state.user = user;
  console.log('✅ Connexion réussie:', state.user);
  goToLobby();
}

function goToLobby() {
  console.log('🏠 goToLobby');
  document.getElementById('my-pseudo-display').textContent = state.user.pseudo;
  document.getElementById('my-avatar-small').src = state.user.avatar;

  if (!state.currentTeam.code) {
    createTeam();
  }

  showScreen('lobby');
  updateLobbyUI();
}

// ---------- ÉQUIPE ----------
function createTeam() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  state.currentTeam = {
    code,
    players: [state.user],
    messages: [{ system: true, text: `Équipe créée par ${state.user.pseudo}` }]
  };
  broadcastTeam();
}
function broadcastTeam() {
  channel.postMessage({ type: 'TEAM_UPDATE', data: state.currentTeam });
}
function updateLobbyUI() {
  if (!state.currentTeam) return;
  document.getElementById('online-count').textContent = `(${state.currentTeam.players.length}/4)`;
  document.getElementById('invite-code').textContent = state.currentTeam.code;
  document.getElementById('start-game').disabled = state.currentTeam.players.length !== 4;

  const membersDiv = document.getElementById('members-list');
  membersDiv.innerHTML = '';
  state.currentTeam.players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'member-item';
    div.innerHTML = `<img src="${p.avatar}"><span>${p.pseudo}</span>`;
    membersDiv.appendChild(div);
  });

  const chatDiv = document.getElementById('chat-messages');
  chatDiv.innerHTML = '';
  state.currentTeam.messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message' + (msg.system ? ' system' : '');
    div.innerHTML = msg.system
      ? `<div class="message-bubble system">${msg.text}</div>`
      : `<img src="${msg.avatar}" class="message-avatar"><div class="message-bubble"><strong>${msg.pseudo}</strong> ${msg.text}</div>`;
    chatDiv.appendChild(div);
  });
}
function leaveTeam() {
  state.currentTeam.players = state.currentTeam.players.filter(p => p.phone !== state.user.phone);
  if (state.currentTeam.players.length === 0) {
    state.currentTeam = { code: null, players: [], messages: [] };
    showScreen('auth');
  } else {
    state.currentTeam.messages.push({ system: true, text: `${state.user.pseudo} a quitté l'équipe` });
    broadcastTeam();
    updateLobbyUI();
  }
}

// ---------- JEUX (simplifiés) ----------
function startGame1() {
  state.game1.round = 1;
  state.game1.playerDebts = {};
  state.currentTeam.players.forEach(p => state.game1.playerDebts[p.phone] = 0);
  showScreen('game1');
  loadQuestion();
}
function loadQuestion() {
  const q = GAME1_QUESTIONS[(state.game1.round-1) % GAME1_QUESTIONS.length];
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('round-current').textContent = state.game1.round;
  const grid = document.getElementById('players-answers');
  grid.innerHTML = '';
  state.currentTeam.players.forEach((p, i) => {
    const box = document.createElement('div');
    box.className = 'answer-box';
    box.innerHTML = `<img src="${p.avatar}"><div><strong>${p.pseudo}</strong></div><input type="text" id="answer-${i}" placeholder="Réponse...">`;
    grid.appendChild(box);
  });
  document.getElementById('validate-round').disabled = false;
  startTimer(60);
}
function startTimer(sec) {
  let timer = sec;
  const display = document.getElementById('timer');
  const interval = setInterval(() => {
    timer--;
    display.textContent = `00:${timer < 10 ? '0'+timer : timer}`;
    if (timer <= 0) { clearInterval(interval); validateGame1Round(); }
  }, 1000);
}
function validateGame1Round() {
  const answers = [];
  state.currentTeam.players.forEach((p, i) => {
    const input = document.getElementById(`answer-${i}`);
    answers.push({ player: p, answer: input.value.trim().toLowerCase() });
  });
  const counts = {};
  answers.forEach(a => counts[a.answer] = (counts[a.answer]||0)+1);
  const minority = Object.entries(counts).find(([_,c]) => c === 1)?.[0];
  if (minority) {
    const traitor = answers.find(a => a.answer === minority);
    state.game1.playerDebts[traitor.player.phone] += 500;
    alert(`${traitor.player.pseudo} +500 dettes`);
  }
  state.game1.round++;
  if (state.game1.round <= 5) loadQuestion();
  else {
    const phones = Object.keys(state.game1.playerDebts);
    const max = phones.reduce((a,b) => state.game1.playerDebts[a] > state.game1.playerDebts[b] ? a : b);
    const total = phones.filter(ph => ph !== max).reduce((s,ph) => s + state.game1.playerDebts[ph], 0);
    state.game1.playerDebts[max] += total;
    const loser = state.currentTeam.players.find(p => p.phone === max);
    alert(`${loser.pseudo} récupère toutes les dettes`);
    showScreen('game2');
    initGame2();
  }
}
function initGame2() {
  state.game2.currentImgIndex = 0;
  state.game2.positions = {};
  state.currentTeam.players.forEach(p => state.game2.positions[p.phone] = 0);
  loadDevineImage();
}
function loadDevineImage() {
  const img = GAME2_IMAGES[state.game2.currentImgIndex % GAME2_IMAGES.length];
  document.getElementById('devine-img').src = img.img;
  document.getElementById('devine-question').textContent = img.description;
}
function submitDevine() {
  const answer = document.getElementById('devine-input').value.trim().toLowerCase();
  const current = GAME2_IMAGES[state.game2.currentImgIndex % GAME2_IMAGES.length];
  const isCorrect = answer === current.personnage.toLowerCase();
  state.currentTeam.players.forEach(p => state.game2.positions[p.phone] += isCorrect ? 2 : 1);
  nextDevine();
}
function voteBlanc() {
  state.currentTeam.players.forEach(p => state.game2.positions[p.phone] += 1);
  nextDevine();
}
function nextDevine() {
  state.game2.currentImgIndex++;
  if (state.game2.currentImgIndex < 3) loadDevineImage();
  else {
    const pos = Object.entries(state.game2.positions).sort((a,b) => b[1] - a[1]);
    const loser = state.currentTeam.players.find(p => p.phone === pos[0][0]);
    alert(`${loser.pseudo} a perdu le jeu 2`);
    document.getElementById('next-game2').classList.remove('hidden');
  }
}
function finishGame() {
  const pts = 1200;
  const size = pts >= 1000 ? 300 : 0;
  document.getElementById('final-score').textContent = `Score: ${pts}`;
  if (size) {
    document.getElementById('win-reward').classList.remove('hidden');
    document.getElementById('group-size').textContent = size;
  } else {
    document.getElementById('lose-ban').classList.remove('hidden');
    localStorage.setItem('purge_ban', new Date(Date.now()+7*86400000).toISOString());
  }
  showScreen('results');
}

// Admin (idem)
function adminLogin() {
  const phone = document.getElementById('admin-phone-input').value.trim();
  if (phone === OWNER_PHONE) {
    document.getElementById('owner-section').classList.remove('hidden');
    document.getElementById('admin-section').classList.remove('hidden');
    displayAdminList();
  } else if (ADMIN_LIST.includes(phone)) {
    document.getElementById('admin-section').classList.remove('hidden');
  }
}
function displayAdminList() {
  document.getElementById('admin-list').innerHTML = ADMIN_LIST.map((p,i) => `<li>${p} <button onclick="removeAdmin(${i})">X</button></li>`).join('');
}
function addAdmin() {
  const phone = document.getElementById('new-admin-phone').value.trim();
  if (phone && !ADMIN_LIST.includes(phone)) {
    ADMIN_LIST.push(phone);
    saveAdminList();
    displayAdminList();
  }
}
window.removeAdmin = (i) => { ADMIN_LIST.splice(i,1); saveAdminList(); displayAdminList(); };
function addQuestion() {
  const type = document.getElementById('new-question-type').value;
  const q = document.getElementById('new-question-text').value;
  const a = document.getElementById('new-question-answer').value;
  if (type === 'game1' && q && a) {
    GAME1_QUESTIONS.push({ question: q, reponse: a.toLowerCase() });
    localStorage.setItem('purge_game1_questions', JSON.stringify(GAME1_QUESTIONS));
    alert('Question ajoutée');
  } else if (type === 'game2') {
    const img = document.getElementById('new-question-image').value;
    const pers = document.getElementById('new-question-personnage').value;
    const desc = document.getElementById('new-question-description').value;
    if (img && pers && desc) {
      GAME2_IMAGES.push({ img, personnage: pers, description: desc });
      localStorage.setItem('purge_game2_images', JSON.stringify(GAME2_IMAGES));
      alert('Image ajoutée');
    }
  }
}
