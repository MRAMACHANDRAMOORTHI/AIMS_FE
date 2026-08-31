import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Framework } from "./pages/Framework";
import { InstituteDetail } from "./pages/InstituteDetail";
import { InstituteNew } from "./pages/InstituteNew";
import { Institutes } from "./pages/Institutes";
import { Universities } from "./pages/Universities";
import { UniversityDetail } from "./pages/UniversityDetail";
import { Button, PageHeader } from "./components/ui";

export default function App() {
  return (
    <Layout>
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
