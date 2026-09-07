import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { api } from "./api/client";
import { clearToken, currentToken, loadToken, onSessionLost } from "./api/auth";
import type { PlatformAdmin } from "./api/types";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Framework } from "./pages/Framework";
import { InstituteDetail } from "./pages/InstituteDetail";
import { InstituteNew } from "./pages/InstituteNew";
import { Institutes } from "./pages/Institutes";
import { SignIn } from "./pages/SignIn";
import { Universities } from "./pages/Universities";
import { UniversityDetail } from "./pages/UniversityDetail";
import { Button, Loading, PageHeader } from "./components/ui";

type Session =
  | { state: "checking" }
  | { state: "signed_out" }
  | { state: "signed_in"; admin: PlatformAdmin };

export default function App() {
  const [session, setSession] = useState<Session>({ state: "checking" });

  const signOut = useCallback(() => {
    clearToken();
    setSession({ state: "signed_out" });
  }, []);

  // A stored token may have expired or been revoked while the tab was closed,
  // so it is not trusted until the server confirms it.
  useEffect(() => {
    onSessionLost(() => setSession({ state: "signed_out" }));

    if (!loadToken()) {
      setSession({ state: "signed_out" });
      return;
    }

    let live = true;

    api
      .get<PlatformAdmin>("/platform/me")
      .then((admin) => live && setSession({ state: "signed_in", admin }))
      .catch(() => live && setSession({ state: "signed_out" }));

    return () => {
      live = false;
    };
  }, []);

  async function endSession() {
    // Revoke it server-side so the token is dead everywhere, not just here. A
    // failure is ignored: signing out locally must always succeed.
    if (currentToken()) {
      await api.del("/platform/session").catch(() => undefined);
    }
    signOut();
  }

  if (session.state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Restoring session" />
      </div>
    );
  }

  if (session.state === "signed_out") {
    return <SignIn onSignedIn={(admin) => setSession({ state: "signed_in", admin })} />;
  }

  return (
    <Layout admin={session.admin} onSignOut={endSession}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/institutes" element={<Institutes />} />
        <Route path="/institutes/new" element={<InstituteNew />} />
        <Route path="/institutes/:id" element={<InstituteDetail />} />
        <Route path="/universities" element={<Universities />} />
        <Route path="/universities/:id" element={<UniversityDetail />} />
        <Route path="/framework" element={<Framework />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function NotFound() {
  return (
    <PageHeader
      title="Page not found"
      description="That route does not exist in this console."
      actions={
        <Link to="/">
          <Button variant="primary">Back to overview</Button>
        </Link>
      }
    />
  );
}
