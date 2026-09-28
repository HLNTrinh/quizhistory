import { useEffect, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import { api, readToken } from "./lib/api.js";
import HomePage from "./pages/home/HomePage.jsx";
import LoginPage from "./pages/user/LoginPage.jsx";
import StudyHomePage from "./pages/user/StudyHomePage.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pathname, setPathname] = useState(window.location.pathname);

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