// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Protected from "./components/Protected";
import GuestOnly from "./components/GuestOnly";
import LoginPage from "./pages/LoginPage";
import Layout from "./layout/Layout";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route element={<Protected />}>
        <Route path="/*" element={<Layout />} />
      </Route>
    </Routes>
  );
}
