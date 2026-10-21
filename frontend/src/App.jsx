import { useEffect, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import { api, readToken } from "./lib/api.js";
import HomePage from "./pages/home/HomePage.jsx";
import AdminDashboard from "./pages/pageAdmin/AdminDashboard.jsx";
import AdminLogin from "./pages/pageAdmin/AdminLogin.jsx";
import AdminUserManagement from "./pages/pageAdmin/AdminUserManagement.jsx";
import LoginPage from "./pages/user/LoginPage.jsx";
import StudyHomePage from "./pages/user/StudyHomePage.jsx";
import { clearAdminSession, readAdminSession } from "./lib/adminSession.js";

const ADMIN_SECTION_BY_PATH = {
  "/admin/packages": "packages",
  "/admin/sets": "sets",
  "/admin/bank": "bank",
  "/admin/leaderboard": "leaderboard",
  "/admin/stats": "stats",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [adminSession, setAdminSession] = useState(() => readAdminSession());

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", syncPathname);
    return () => window.removeEventListener("popstate", syncPathname);
  }, []);

  function navigate(path) {
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (!readToken()) {
      setCheckingSession(false);
      return;
    }
    api("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem("quizhistory-token");
        sessionStorage.removeItem("quizhistory-token");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function logout() {
    localStorage.removeItem("quizhistory-token");
    sessionStorage.removeItem("quizhistory-token");
    setUser(null);
    navigate("/");
  }

  function enterAdmin() {
    setAdminSession(readAdminSession());
    navigate("/admin");
  }

  function logoutAdmin() {
    clearAdminSession();
    setAdminSession(null);
    navigate("/admin/login");
  }

  if (pathname === "/admin/login") {
    return <AdminLogin
      onSuccess={enterAdmin}
      onBackToStudent={() => navigate("/")}
    />;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const goToAdminPage = (path) => navigate(path);

    if (!adminSession) return <AdminLogin
      onSuccess={enterAdmin}
      onBackToStudent={() => navigate("/")}
    />;
    if (pathname === "/admin/users") {
      return <AdminUserManagement
        admin={adminSession}
        onNavigate={goToAdminPage}
        onLogout={logoutAdmin}
      />;
    }
    return <AdminDashboard
      admin={adminSession}
      initialNav={ADMIN_SECTION_BY_PATH[pathname] || "overview"}
      onNavigate={goToAdminPage}
      onLogout={logoutAdmin}
    />;
  }
  if (checkingSession) return <div className="session-loading"><BrandMark /> Đang xác thực phiên học tập...</div>;
  if (user && pathname !== "/") return <StudyHomePage user={user} onLogout={logout} />;
  if (pathname === "/login" || pathname === "/register" || pathname === "/app") {
    return <LoginPage
      initialMode={pathname === "/register" ? "register" : "login"}
      onLogin={(currentUser) => { setUser(currentUser); navigate("/app"); }}
    />;
  }
  return <HomePage
    onLogin={() => navigate("/login")}
    onSignup={() => navigate("/register")}
    onStartFree={() => navigate(user ? "/app" : "/login")}
  />;
}