import { useEffect, useState } from "react";

import DashboardSidebar from "@/components/DashboardSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { restoreSession, useAppDispatch, useAppSelector } from "@/store";

function App() {
  const dispatch = useAppDispatch();
  const { user, token, status } = useAppSelector((state) => state.auth);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  useEffect(() => {
    if (token && !user) {
      dispatch(restoreSession());
    }
  }, [dispatch, token, user]);

  let content;
  if (token && !user && status === "loading") {
    content = (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  } else if (!user) {
    content =
      authView === "login" ? (
        <LoginPage onSwitchToRegister={() => setAuthView("register")} />
      ) : (
        <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
      );
  } else {
    content = <DashboardSidebar />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {content}
    </ThemeProvider>
  );
}

export default App;
