(function () {
  const sharedKeys = [
    'zhuxu-tasks', 'zhuxu-document-state', 'zhuxu-followups', 'zhuxu-organization', 'zhuxu-plans',
    'zhuxu-resource-entries', 'zhuxu-resource-plans', 'zhuxu-concealed-acceptances',
    'zhuxu-quality-checks', 'zhuxu-attendance', 'zhuxu-safety-inspections', 'zhuxu-site-records',
    'zhuxu-intake-records', 'zhuxu-technical-documents', 'zhuxu-cost-documents', 'zhuxu-daily-execution', 'zhuxu-daily-coordination',
    'zhuxu-drawing-buildings'
  ];
  const bridge = {
    active: false,
    user: null,
    needsInit: false,
    projects: [],
    sharedKeys,
    async request(path, options = {}) {
      const response = await fetch(path, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error || `服务器请求失败（${response.status}）`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    },
    hydrate(state = {}) {
      sharedKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(state, key)) localStorage.setItem(key, JSON.stringify(state[key]));
        else if (key === 'zhuxu-cost-documents' && this.user?.permissions?.cost === false) localStorage.removeItem(key);
      });
    },
    async login(account, password, projectId, remember) {
      const payload = await this.request('/api/login', { method: 'POST', body: JSON.stringify({ account, password, projectId, remember }) });
      this.active = true;
      this.user = payload.user;
      this.hydrate(payload.state);
      sessionStorage.setItem('zhuxu-auth-session', String(payload.user.id));
      localStorage.setItem('zhuxu-auth-project', String(payload.user.project.id));
      localStorage.removeItem('zhuxu-auth-remember');
      return payload.user;
    },
    async initProject(payload) {
      const result = await this.request('/api/projects/init', { method: 'POST', body: JSON.stringify(payload) });
      this.active = true;
      this.user = result.user;
      this.hydrate(result.state);
      sessionStorage.setItem('zhuxu-auth-session', String(result.user.id));
      localStorage.setItem('zhuxu-auth-project', String(result.user.project.id));
      return result.user;
    },
    async switchProject(projectId) {
      const payload = await this.request('/api/projects/switch', { method: 'POST', body: JSON.stringify({ projectId }) });
      this.user = payload.user;
      this.hydrate(payload.state);
      sessionStorage.setItem('zhuxu-auth-session', String(payload.user.id));
      localStorage.setItem('zhuxu-auth-project', String(payload.user.project.id));
      return payload.user;
    },
    async logout() {
      if (this.active) await this.request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {});
    },
    saveState(key, value) {
      if (!this.active || !sharedKeys.includes(key)) return Promise.resolve();
      return this.request(`/api/state/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) });
    },
    async approve(planId, stepIndex, action) {
      return this.request(`/api/approvals/${encodeURIComponent(planId)}/${encodeURIComponent(stepIndex)}`, {
        method: 'POST', body: JSON.stringify({ action })
      });
    },
    async withdraw(planId) {
      return this.request(`/api/approvals/${encodeURIComponent(planId)}/withdraw`, { method: 'POST', body: '{}' });
    },
    async uploadAttachment(file) {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/attachments', { method: 'POST', credentials: 'same-origin', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || '附件上传失败');
      return payload;
    },
    attachmentUrl(storageKey) {
      return `/api/attachments/${encodeURIComponent(storageKey)}`;
    }
  };
  window.ZhuxuServer = bridge;

  async function bootstrap() {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      try {
        const response = await fetch('/api/bootstrap', { credentials: 'same-origin' });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 200 || response.status === 401) {
          bridge.active = true;
          if (response.ok && payload.user) {
            bridge.user = payload.user;
            bridge.hydrate(payload.state);
            sessionStorage.setItem('zhuxu-auth-session', String(payload.user.id));
            localStorage.setItem('zhuxu-auth-project', String(payload.user.project.id));
            localStorage.removeItem('zhuxu-auth-remember');
          } else {
            bridge.needsInit = Boolean(payload.needsInit);
            bridge.projects = Array.isArray(payload.projects) ? payload.projects : [];
            sessionStorage.removeItem('zhuxu-auth-session');
            localStorage.removeItem('zhuxu-auth-remember');
          }
        }
      } catch (error) {
        bridge.active = false;
      }
    }
    const script = document.createElement('script');
    script.src = 'app.js';
    script.defer = false;
    document.body.appendChild(script);
  }

  bootstrap();
})();
