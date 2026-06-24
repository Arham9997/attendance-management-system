/* ==========================================================================
   Auth helper — session storage, route guarding by role, logout.
   ========================================================================== */

const Auth = (() => {
  const TOKEN_KEY = 'ams_token';
  const USER_KEY = 'ams_user';

  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const getUser = () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const isLoggedIn = () => !!getToken();

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  };

  /**
   * Call at the top of every protected page.
   * allowedRoles: array of roles permitted on this page; omit to just require login.
   */
  const guard = (allowedRoles = []) => {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return null;
    }
    const user = getUser();
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard rather than showing a 403 page
      window.location.href = `${user.role}-dashboard.html`;
      return null;
    }
    return user;
  };

  const redirectToDashboard = () => {
    const user = getUser();
    if (!user) return (window.location.href = 'login.html');
    window.location.href = `${user.role}-dashboard.html`;
  };

  return { setSession, getUser, getToken, isLoggedIn, logout, guard, redirectToDashboard };
})();
