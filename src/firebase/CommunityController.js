const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export class CommunityController {
  constructor(service) {
    this.service = service;
    this.currentResult = null;
    this.body = document.getElementById('support-body');
    this.resultForm = document.getElementById('score-submit-form');
    this.resultNickname = document.getElementById('score-nickname');
    this.resultStatus = document.getElementById('score-submit-status');
    this.resultSubmit = document.getElementById('score-submit-btn');
    this.lastSuggestionAt = 0;

    this.resultNickname.value = this.readNickname();
    this.resultForm.addEventListener('submit', (event) => this.submitResult(event));
  }

  readNickname() {
    try { return localStorage.getItem('ai-troll-lab:nickname') || ''; } catch { return ''; }
  }

  saveNickname(nickname) {
    try { localStorage.setItem('ai-troll-lab:nickname', nickname); } catch { /* optional */ }
  }

  setResult(result) {
    this.currentResult = result;
    this.resultForm.classList.remove('hidden');
    this.resultSubmit.disabled = false;
    this.resultStatus.textContent = `점수 ${result.score.toLocaleString('ko-KR')}점을 랭킹에 등록할 수 있습니다.`;
  }

  resetResult() {
    this.currentResult = null;
    this.resultForm.classList.add('hidden');
    this.resultStatus.textContent = '';
    this.resultSubmit.textContent = '점수 등록';
  }

  async submitResult(event) {
    event.preventDefault();
    if (!this.currentResult) return;

    const nickname = this.resultNickname.value.trim();
    this.resultSubmit.disabled = true;
    this.resultStatus.textContent = '랭킹 등록 중…';
    try {
      await this.service.submitScore(nickname, this.currentResult);
      this.saveNickname(nickname);
      this.resultStatus.textContent = '랭킹 등록 완료! 🏆';
      this.resultSubmit.textContent = '등록 완료';
    } catch (error) {
      this.resultStatus.textContent = error.message || '랭킹 등록에 실패했습니다.';
      this.resultSubmit.disabled = false;
    }
  }

  async render(type) {
    if (type === 'leaderboard') return this.renderLeaderboard();
    if (type === 'feedback') return this.renderSuggestionForm();
    this.body.innerHTML = '<p class="community-empty">후원 링크가 확정되면 이곳에 연결됩니다.</p>';
  }

  async renderLeaderboard() {
    this.body.innerHTML = '<p class="community-empty">랭킹을 불러오는 중…</p>';
    try {
      const entries = await this.service.getLeaderboard(10);
      if (!entries.length) {
        this.body.innerHTML = '<p class="community-empty">아직 등록된 기록이 없습니다. 첫 번째 도전자가 되어보세요!</p>';
        return;
      }
      this.body.innerHTML = `<ol class="leaderboard-list">${entries.map((entry, index) => `
        <li>
          <span class="leaderboard-rank">${index + 1}</span>
          <strong>${escapeHtml(entry.nickname)}</strong>
          <span>STAGE ${Number(entry.stage) || 1}</span>
          <span>${entry.difficulty === 'nightmare' ? '지옥' : '도전'}</span>
          <b>${Number(entry.score || 0).toLocaleString('ko-KR')}점</b>
        </li>`).join('')}</ol>`;
    } catch (error) {
      this.body.innerHTML = `<p class="community-empty community-error">${escapeHtml(error.message || '랭킹을 불러오지 못했습니다.')}</p>`;
    }
  }

  renderSuggestionForm() {
    this.body.innerHTML = `
      <form id="suggestion-form" class="community-form">
        <input id="suggestion-nickname" type="text" maxlength="20" placeholder="닉네임 (선택)" value="${escapeHtml(this.readNickname())}" autocomplete="nickname">
        <textarea id="suggestion-text" maxlength="500" required placeholder="버그, 난이도, 새로운 억까 아이디어를 남겨주세요."></textarea>
        <div class="community-form-footer"><span id="suggestion-status">최대 500자 · 내용은 개발자만 확인합니다.</span><button type="submit">건의 보내기</button></div>
      </form>`;

    const form = this.body.querySelector('#suggestion-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const now = Date.now();
      if (now - this.lastSuggestionAt < 30000) {
        form.querySelector('#suggestion-status').textContent = '건의사항은 30초에 한 번 전송할 수 있습니다.';
        return;
      }
      const button = form.querySelector('button');
      const status = form.querySelector('#suggestion-status');
      const nickname = form.querySelector('#suggestion-nickname').value.trim();
      const text = form.querySelector('#suggestion-text').value.trim();
      button.disabled = true;
      status.textContent = '전송 중…';
      try {
        await this.service.submitSuggestion(nickname, text);
        this.lastSuggestionAt = Date.now();
        if (nickname) this.saveNickname(nickname);
        form.reset();
        status.textContent = '건의사항이 전송되었습니다. 감사합니다! 💡';
      } catch (error) {
        status.textContent = error.message || '전송에 실패했습니다.';
        button.disabled = false;
      }
    });
  }
}
