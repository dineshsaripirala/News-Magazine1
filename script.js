// Shared behaviour for every page of the Stackly site.

function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

const validators = {
    email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone:    (v) => /^\d{10}$/.test(v.replace(/\D/g, '')),
    name:     (v) => /^[a-zA-Z\s]+$/.test(v),
    username: (v) => /^[a-zA-Z0-9_]{3,}$/.test(v),
    password: (v) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)
};

function setFieldError(fieldId, message) {
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (field)   field.classList.toggle('form-error', !!message);
    if (errorEl) errorEl.textContent = message || '';
}

function clearErrors(fieldIds) {
    fieldIds.forEach((id) => setFieldError(id, ''));
}

document.addEventListener('DOMContentLoaded', () => {

    // ── Route protection ────────────────────────────────────────────────────
    const isDashboard = document.body.classList.contains('dashboard-page');

    if (isDashboard) {
        Auth.requireAuth();

        // Populate user info on dashboard
        const user = Auth.getUser();
        if (user) {
            const nameEl = document.getElementById('dashUserName');
            const emailEl = document.getElementById('dashUserEmail');
            const roleEl = document.getElementById('dashUserRole');
            const timeEl = document.getElementById('dashLoginTime');
            const welcomeEl = document.getElementById('dashWelcome');
            const mobileEl = document.getElementById('dashUserMobile');
            const memberEl = document.getElementById('dashMemberSince');
            const avatarEl = document.getElementById('dashAvatar');

            if (nameEl) nameEl.textContent = user.fullName || user.identifier;
            if (emailEl) emailEl.textContent = user.identifier;
            if (roleEl) roleEl.textContent = user.role || 'Reader';
            if (timeEl) timeEl.textContent = new Date(user.loginTime).toLocaleString();
            if (welcomeEl) welcomeEl.textContent = 'Welcome, ' + (user.fullName || user.identifier) + '!';
            if (mobileEl) mobileEl.textContent = user.mobile || '—';
            if (memberEl) memberEl.textContent = user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
            if (avatarEl) {
                var initials = (user.fullName || user.identifier || '').split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
                avatarEl.textContent = initials || '?';
            }
        }
    }

    // ── Sign-out link (dashboard pages) ────────────────────────────────────
    const signOutLink = document.getElementById('signOutLink');
    if (signOutLink) {
        signOutLink.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // ── Auth-aware nav (public pages) ───────────────────────────────────────
    if (!isDashboard) {
        const navMenu = document.getElementById('navMenu');
        if (navMenu && Auth.isLoggedIn()) {
            const user = Auth.getUser();
            const role = user && user.role;
            let dashHref = 'reader-dashboard.html';
            if (role === 'Analyst' || role === 'Editor' || role === 'Journalist' || role === 'Moderator' || role === 'Publisher' || role === 'Admin') {
                dashHref = 'editor-dashboard.html';
            }

            const siEl = navMenu.querySelector('a[href="signin.html"]');
            const regEl = navMenu.querySelector('a[href="register.html"]');
            if (siEl) siEl.remove();
            if (regEl) regEl.remove();

            const dashLink = document.createElement('a');
            dashLink.href = dashHref;
            dashLink.textContent = 'Dashboard';

            navMenu.appendChild(dashLink);
        }
    }

    // ── Site-wide 404 routing ───────────────────────────────────────────────
    const PATH_404 = '404.html';

    function go404(e) {
        if (e && e.preventDefault) e.preventDefault();
        window.location.href = PATH_404;
    }

    // Social links with no real URL
    document.querySelectorAll('a.social-link[href="#"]').forEach(link => {
        link.addEventListener('click', go404);
    });

    // Footer "News & Magazine" items
    document.querySelectorAll('.newsroom-link').forEach(el => {
        el.addEventListener('click', go404);
    });

    // Footer social media icons with no real URL
    document.querySelectorAll('a.footer-social-icon[href="#"]').forEach(link => {
        link.addEventListener('click', go404);
    });

    // Unlinked action buttons
    document.querySelectorAll('button[type="button"]').forEach(btn => {
        if (btn.getAttribute('onclick')) return;
        const text = (btn.textContent || '').trim();
        const isUnlinked =
            text.includes('Read Full Column') ||
            text.includes('Download Edition') ||
            text.includes('Subscribe Now') ||
            text.includes('Read →') ||
            text.includes('Edit →');
        if (isUnlinked) btn.addEventListener('click', go404);
    });

    // ── Fade-in animation ───────────────────────────────────────────────────
    const fadeTargets = document.querySelectorAll('.fade-in-up');
    if (fadeTargets.length) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

            fadeTargets.forEach((el) => observer.observe(el));
        } else {
            fadeTargets.forEach((el) => el.classList.add('is-visible'));
        }
    }

    // ── Contact form ────────────────────────────────────────────────────────
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const fields = ['firstName', 'lastName', 'email', 'phone', 'message'];
            clearErrors(fields);

            const firstName = document.getElementById('firstName').value.trim();
            const lastName  = document.getElementById('lastName').value.trim();
            const email     = document.getElementById('email').value.trim();
            const phone     = document.getElementById('phone').value.trim();
            const message   = document.getElementById('message').value.trim();

            let hasError = false;
            if (!firstName || !validators.name(firstName))  { setFieldError('firstName', 'Valid name required'); hasError = true; }
            if (!lastName  || !validators.name(lastName))   { setFieldError('lastName',  'Valid name required'); hasError = true; }
            if (!email     || !validators.email(email))     { setFieldError('email',      'Valid email required'); hasError = true; }
            if (!phone     || !validators.phone(phone))     { setFieldError('phone',      'Valid 10-digit phone required'); hasError = true; }
            if (!message)                                   { setFieldError('message',    'Message required'); hasError = true; }

            if (!hasError) {
                window.location.href = '404.html';
            }
        });
    }

    // ── Sign-in form ────────────────────────────────────────────────────────
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const fields = ['identifier', 'password', 'role'];
            clearErrors(fields);

            const identifier = document.getElementById('identifier').value.trim();
            const password   = document.getElementById('password').value;
            const roleEl     = document.getElementById('role');
            const role       = roleEl ? roleEl.value : '';

            let hasError = false;
            if (!identifier)                       { setFieldError('identifier', 'Email required'); hasError = true; }
            if (!password || password.length < 3)  { setFieldError('password', 'Password required'); hasError = true; }
            if (!role)                             { setFieldError('role', 'Select a role'); hasError = true; }

            if (!hasError) {
                if (!Auth.hasAccounts()) {
                    window.location.href = 'register.html';
                    return;
                }

                const account = Auth.findUser(identifier, password);
                if (!account) {
                    setFieldError('identifier', 'Account not found. Check your email and password.');
                    return;
                }

                Auth.login(identifier, account.fullName, role, account.mobile, account.registeredAt);

                if (role === 'Analyst' || role === 'Editor' || role === 'Journalist' || role === 'Moderator' || role === 'Publisher' || role === 'Admin') {
                    window.location.href = 'editor-dashboard.html';
                } else {
                    window.location.href = 'reader-dashboard.html';
                }
            }
        });
    }

    // ── Register form ───────────────────────────────────────────────────────
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const fields = ['fullName', 'email', 'mobile', 'password', 'confirmPassword', 'role'];
            clearErrors(fields);

            const fullName        = document.getElementById('fullName').value.trim();
            const email           = document.getElementById('email').value.trim();
            const mobile          = document.getElementById('mobile').value.trim();
            const role            = document.getElementById('role').value;
            const password        = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            let hasError = false;
            if (!fullName  || !validators.name(fullName))       { setFieldError('fullName',  'Valid full name required (letters only)'); hasError = true; }
            if (!email     || !validators.email(email))         { setFieldError('email',      'Valid email address required'); hasError = true; }
            if (!mobile    || !validators.phone(mobile))        { setFieldError('mobile',     'Valid 10-digit mobile number required'); hasError = true; }
            if (!role)                                          { setFieldError('role',        'Please select a role'); hasError = true; }
            if (!validators.password(password))                 { setFieldError('password',   'Password: 8+ chars, 1 uppercase, 1 number'); hasError = true; }
            if (password !== confirmPassword)                   { setFieldError('confirmPassword', 'Passwords must match'); hasError = true; }

            if (!hasError) {
                Auth.register({ fullName, email, mobile, role, password, registeredAt: Date.now() });

                registerForm.style.display = 'none';
                const successEl = document.getElementById('registerSuccess');
                if (successEl) successEl.style.display = 'block';

                let count = 5;
                const countEl = document.getElementById('countdown');
                const timer = setInterval(() => {
                    count--;
                    if (countEl) countEl.textContent = count;
                    if (count <= 0) {
                        clearInterval(timer);
                        window.location.href = 'signin.html';
                    }
                }, 1000);
            }
        });
    }
});
