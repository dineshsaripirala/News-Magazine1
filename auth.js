// Stackly Authentication Module — session-based, no backend required
const AUTH_KEY      = 'stackly_user';
const ACCOUNTS_KEY  = 'stackly_accounts';

const Auth = {
    // ── Session ──────────────────────────────────────────────────────────────
    login(identifier, fullName, role, mobile, registeredAt) {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify({ identifier, fullName, role, mobile, registeredAt, loginTime: Date.now() }));
    },

    logout() {
        sessionStorage.removeItem(AUTH_KEY);
        window.location.href = 'index.html';
    },

    isLoggedIn() {
        return !!sessionStorage.getItem(AUTH_KEY);
    },

    getUser() {
        const d = sessionStorage.getItem(AUTH_KEY);
        return d ? JSON.parse(d) : null;
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'signin.html';
        }
    },

    // ── Account store (localStorage) ─────────────────────────────────────────
    getAccounts() {
        const data = localStorage.getItem(ACCOUNTS_KEY);
        return data ? JSON.parse(data) : [];
    },

    hasAccounts() {
        return this.getAccounts().length > 0;
    },

    register(userData) {
        const accounts = this.getAccounts();
        accounts.push(userData);
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    },

    // Returns the matching account or null
    findUser(identifier, password) {
        return this.getAccounts().find(acc =>
            acc.email === identifier && acc.password === password
        ) || null;
    }
};
