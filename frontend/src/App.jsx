import { useEffect, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import { api, adminApi, clearAdminToken, readAdminToken, readToken } from "./lib/api.js";
import HomePage from "./pages/home/HomePage.jsx";
import LeaderboardPage from "./pages/user/LeaderboardPage.jsx";
import LoginPage from "./pages/user/LoginPage.jsx";
import PackagesPage from "./pages/user/PackagesPage.jsx";
import ProfilePage from "./pages/user/ProfilePage.jsx";
import StudyHomePage from "./pages/user/StudyHomePage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import AdminPackagesPage from "./pages/admin/AdminPackagesPage.jsx";
import AdminQuestionSetsPage from "./pages/admin/AdminQuestionSetsPage.jsx";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage.jsx";
import AdminLeaderboardPage from "./pages/admin/AdminLeaderboardPage.jsx";
import AdminSectionPage from "./pages/admin/AdminSectionPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";

const adminSectionTitles = {
  "/admin/reports": "Báo cáo",
  "/admin/settings": "Cài đặt"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAdminSession, setCheckingAdminSession] = useState(() => Boolean(readAdminToken()));

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

  useEffect(() => {
    if (!readAdminToken()) {
      setCheckingAdminSession(false);
      return;
    }
    adminApi("/admin/auth/me")
      .then(({ user: currentAdmin }) => setAdminUser(currentAdmin))
      .catch(() => clearAdminToken())
      .finally(() => setCheckingAdminSession(false));
  }, []);

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (!isAdminPath) return;
    if (adminUser && pathname === "/admin/login") navigate("/admin");
  }, [pathname, adminUser, isAdminPath]);

  function adminLogout() {
    clearAdminToken();
    setAdminUser(null);
    navigate("/admin/login");
  }

  function logout() {
    localStorage.removeItem("quizhistory-token");
    sessionStorage.removeItem("quizhistory-token");
    setUser(null);
    navigate("/");
  }

  if (isAdminPath) {
    if (checkingAdminSession) {
      return <div className="session-loading"><BrandMark /> Đang xác thực phiên quản trị...</div>;
    }
    if (!adminUser) {
      return <AdminLoginPage
        onAuthenticated={(currentAdmin) => { setAdminUser(currentAdmin); navigate("/admin"); }}
        onExit={() => navigate("/")}
      />;
    }
    if (pathname === "/admin/users") {
      return <AdminUsersPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
    }
    if (pathname === "/admin/packages") {
      return <AdminPackagesPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
    }
    if (pathname === "/admin/question-sets") {
      return <AdminQuestionSetsPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
    }
    if (pathname === "/admin/questions") {
      return <AdminQuestionsPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
    }
    if (pathname === "/admin/leaderboard") {
      return <AdminLeaderboardPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
    }
    const sectionTitle = adminSectionTitles[pathname];
    if (pathname !== "/admin" && sectionTitle) {
      return <AdminSectionPage
        admin={adminUser}
        onLogout={adminLogout}
        onNavigate={navigate}
        activePath={pathname}
        title={sectionTitle}
      />;
    }
    return <AdminDashboardPage admin={adminUser} onLogout={adminLogout} onNavigate={navigate} />;
  }
  if (checkingSession) return <div className="session-loading"><BrandMark /> Đang xác thực phiên học tập...</div>;
  if (user && (pathname === "/packages" || pathname.startsWith("/packages/"))) {
    const packageId = pathname.startsWith("/packages/") ? pathname.slice("/packages/".length) : null;
    return <PackagesPage user={user} onLogout={logout} onNavigate={navigate} packageId={packageId} />;
  }
  if (user && pathname === "/profile") {
    function updateUser(currentUser, token) {
      setUser(currentUser);
      const storage = localStorage.getItem("quizhistory-token") ? localStorage : sessionStorage;
      storage.setItem("quizhistory-token", token);
    }
    return <ProfilePage user={user} onUpdateUser={updateUser} onLogout={logout} onNavigate={navigate} />;
  }
  if (user && pathname === "/leaderboard") {
    return <LeaderboardPage user={user} onLogout={logout} onNavigate={navigate} />;
  }
  if (user && pathname !== "/") return <StudyHomePage user={user} onLogout={logout} onNavigate={navigate} />;
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