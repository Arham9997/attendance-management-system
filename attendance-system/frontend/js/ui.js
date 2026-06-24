/* ==========================================================================
   Shared UI utilities: toast notifications, sidebar injection,
   formatting helpers, attendance percentage styling.
   ========================================================================== */

const UI = (() => {
  const toastContainer = () => {
    let el = document.querySelector('.toast-stack');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-stack';
      document.body.appendChild(el);
    }
    return el;
  };

  const toast = (message, type = 'info') => {
    const colors = {
      success: '#2f7d4f',
      danger: '#b3432b',
      info: '#14213d',
      warning: '#c8863a',
    };
    const el = document.createElement('div');
    el.style.cssText = `
      background: ${colors[type] || colors.info};
      color: #fff;
      padding: 0.75rem 1.1rem;
      border-radius: 6px;
      margin-bottom: 0.6rem;
      font-size: 0.9rem;
      box-shadow: 0 8px 20px rgba(0,0,0,0.18);
      min-width: 240px;
      max-width: 360px;
      animation: fadeSlideIn 0.2s ease;
    `;
    el.textContent = message;
    toastContainer().appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  };

  const pctClass = (pct) => {
    if (pct >= 85) return 'pct-good';
    if (pct >= 75) return 'pct-warn';
    return 'pct-bad';
  };

  const pctTextClass = (pct) => {
    if (pct >= 85) return 'text-success';
    if (pct >= 75) return 'text-warning';
    return 'text-danger';
  };

  const statusBadge = (status) => {
    const map = {
      present: 'badge-present',
      absent: 'badge-absent',
      late: 'badge-late',
      excused: 'badge-excused',
    };
    return `<span class="badge-soft ${map[status] || 'badge-excused'}">${status}</span>`;
  };

  const rolePill = (role) => `<span class="role-pill role-${role}">${role}</span>`;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const initials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const NAV_ITEMS = {
    admin: [
      { href: 'admin-dashboard.html', icon: '&#9632;', label: 'Dashboard' },
      { href: 'admin-users.html', icon: '&#9670;', label: 'Manage Users' },
      { href: 'admin-departments.html', icon: '&#9633;', label: 'Departments' },
      { href: 'admin-subjects.html', icon: '&#9635;', label: 'Subjects' },
    ],
    teacher: [
      { href: 'teacher-dashboard.html', icon: '&#9632;', label: 'Dashboard' },
      { href: 'teacher-classes.html', icon: '&#9670;', label: 'My Classes' },
      { href: 'teacher-attendance.html', icon: '&#10003;', label: 'Mark Attendance' },
      { href: 'teacher-reports.html', icon: '&#9636;', label: 'Reports' },
    ],
    student: [
      { href: 'student-dashboard.html', icon: '&#9632;', label: 'Dashboard' },
      { href: 'student-attendance.html', icon: '&#9636;', label: 'My Attendance' },
      { href: 'student-reports.html', icon: '&#9660;', label: 'Reports' },
    ],
  };

  /**
   * Injects the sidebar + topbar shell into a page.
   * Expects the page body to contain:
   *   <div id="sidebar-mount"></div>
   *   <div id="main-mount"><div class="topbar">...page content follows...</div></div>
   * Simpler usage: call renderShell(pageTitle) on DOMContentLoaded, it builds both.
   */
  const renderShell = (pageTitle) => {
    const user = Auth.getUser();
    if (!user) return;

    const items = NAV_ITEMS[user.role] || [];
    const currentPage = window.location.pathname.split('/').pop();

    const sidebarHTML = `
      <aside class="sidebar" id="appSidebar">
        <div class="sidebar-brand d-flex align-items-center">
          <span class="mark">A</span>
          <div>
            <div class="name">AttendCloud</div>
            <div class="tagline">Attendance System</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${items
            .map(
              (item) => `
            <a href="${item.href}" class="nav-link ${currentPage === item.href ? 'active' : ''}">
              <span aria-hidden="true">${item.icon}</span> ${item.label}
            </a>`
            )
            .join('')}
        </nav>
        <div class="sidebar-foot">
          Logged in as<br/><strong style="color:#fff">${user.name}</strong>
        </div>
      </aside>
    `;

    const topbarUserHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="user-chip">
          <span class="avatar">${initials(user.name)}</span>
          <span>${user.name}</span>
        </div>
        <button class="btn btn-outline-ink btn-sm" id="logoutBtn">Log out</button>
      </div>
    `;

    document.getElementById('sidebar-mount').innerHTML = sidebarHTML;

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-ink sidebar-toggle-btn" id="sidebarToggleBtn">&#9776;</button>
        <h1 class="page-title">${pageTitle}</h1>
      </div>
      ${topbarUserHTML}
    `;
    const mainMount = document.getElementById('main-mount');
    mainMount.prepend(topbar);

    document.getElementById('logoutBtn').addEventListener('click', Auth.logout);
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.getElementById('appSidebar').classList.toggle('open');
      });
    }
  };

  return { toast, pctClass, pctTextClass, statusBadge, rolePill, formatDate, initials, renderShell };
})();
