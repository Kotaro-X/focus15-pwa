(() => {
  const FOCUS_SECS = 15 * 60;
  const PENALTY = 5;

  const el = (id) => document.getElementById(id);
  const timerEl = el('timer');
  const startBtn = el('startBtn');
  const resetBtn = el('resetBtn');
  const overlay = el('overlay');
  const emergencyBtn = el('emergencyBtn');
  const toast = el('toast');

  const levelEl = el('level');
  const winsEl = el('wins');
  const failsEl = el('fails');
  const asciiEl = el('penguinAscii');
  const stageLabel = el('stageLabel');

  let state = {
    active: false,
    secs: 0,
    level: 0,
    wins: 0,
    fails: 0,
    tickHandle: null,
    listenersActive: false,
  };

  function load() {
    state.level = +(localStorage.getItem('level') || 0);
    state.wins  = +(localStorage.getItem('wins')  || 0);
    state.fails = +(localStorage.getItem('fails') || 0);
    renderStats();
    setTimer(FOCUS_SECS);
  }

  function save() {
    localStorage.setItem('level', state.level);
    localStorage.setItem('wins',  state.wins);
    localStorage.setItem('fails', state.fails);
  }

  function renderStats() {
    levelEl.textContent = state.level;
    winsEl.textContent = state.wins;
    failsEl.textContent = state.fails;
    const a = penguinAscii(state.level);
    asciiEl.textContent = a.ascii;
    stageLabel.textContent = a.stage;
  }

  function penguinAscii(lvl){
    if (lvl <= 0) return { stage: '卵', ascii: '（卵）\n  __\n (__)' };
    if (lvl < 5)  return { stage: 'ヒナ', ascii: 'ヒナ\n  (•ᴗ•)\n  /| |\\' };
    if (lvl < 15) return { stage: '若鳥', ascii: '若鳥\n  (•◡•) ﾉ\n  /|_|\\' };
    return { stage: '大人', ascii: '大人\n  (•ㅅ•)ゝ\n  /|██|\\' };
  }

  function setTimer(secs){
    state.secs = secs;
    const mm = String(Math.floor(secs / 60)).padStart(2,'0');
    const ss = String(secs % 60).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;
  }

  function start() {
    if (state.active) return;
    state.active = true;
    setTimer(FOCUS_SECS);
    overlay.classList.remove('hidden');
    startBtn.disabled = true;
    attachGuards();

    if (state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle = setInterval(() => {
      if (state.secs <= 1) {
        success();
      } else {
        setTimer(state.secs - 1);
      }
    }, 1000);
  }

  function success(){
    clearInterval(state.tickHandle);
    state.active = false;
    overlay.classList.add('hidden');
    startBtn.disabled = false;
    state.wins += 1;
    state.level += 1;
    save();
    renderStats();
    setTimer(FOCUS_SECS);
    detachGuards();
    showToast('成功！ペンギンが1成長しました');
  }

  function fail(reason){
    if (!state.active) return;
    clearInterval(state.tickHandle);
    state.active = false;
    overlay.classList.add('hidden');
    startBtn.disabled = false;
    state.fails += 1;
    state.level = Math.max(0, state.level - PENALTY);
    save();
    renderStats();
    setTimer(FOCUS_SECS);
    detachGuards();
    showToast(`失敗：${reason}（成長 −${PENALTY}）`);
  }

  function attachGuards(){
    if (state.listenersActive) return;
    state.listenersActive = true;
    // 触る系
    ['pointerdown','mousedown','touchstart','keydown','wheel','scroll','contextmenu'].forEach(ev =>
      document.addEventListener(ev, onInteract, { capture:true, passive:false })
    );
    // 別タブ・最小化
    document.addEventListener('visibilitychange', onVisibility, true);
    window.addEventListener('blur', onBlur, true);
  }
  function detachGuards(){
    if (!state.listenersActive) return;
    state.listenersActive = false;
    ['pointerdown','mousedown','touchstart','keydown','wheel','scroll','contextmenu'].forEach(ev =>
      document.removeEventListener(ev, onInteract, { capture:true })
    );
    document.removeEventListener('visibilitychange', onVisibility, true);
    window.removeEventListener('blur', onBlur, true);
  }
  function onInteract(e){
    // allow emergency button inside overlay (it triggers fail anyway)
    const emergency = document.getElementById('emergencyBtn');
    if (emergency && emergency.contains(e.target)) return; 
    e.preventDefault();
    e.stopPropagation();
    fail('操作検知');
  }
  function onVisibility(){
    if (document.hidden) fail('他タブ/最小化');
  }
  function onBlur(){
    // window blur alone can be noisy; pair with hidden to be safe
    if (document.hidden) fail('他タブ/最小化');
  }

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add('hidden'), 2200);
  }

  // UI bindings
  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', () => {
    if (!confirm('成長・統計をリセットしますか？')) return;
    state.level = 0; state.wins = 0; state.fails = 0;
    save(); renderStats(); showToast('リセットしました');
  });
  emergencyBtn.addEventListener('click', () => fail('手動終了'));

  load();
})();