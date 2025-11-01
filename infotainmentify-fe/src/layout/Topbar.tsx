// src/components/Topbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthProvider"; // senin dosya yoluna göre değiştir

type Props = { onOpenMobile: () => void };

export default function Topbar({ onOpenMobile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth(); // AuthContext'ten alıyoruz

  // dışarı tıklayınca menü kapanır
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleLogout = () => {
    logout(); // token ve user temizlenir
    navigate("/login"); // login sayfasına yönlendir
  };

  return (
    <div className="w-full px-3">
      <div className="flex items-center justify-between">
        {/* Sol taraf */}
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden px-3 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100"
            onClick={onOpenMobile}
          >
            Menu
          </button>
          <div className="text-sm text-neutral-500">Overview</div>
        </div>

        {/* Sağ taraf */}
        <div className="flex items-center gap-3">
          <input
            className="hidden md:block px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="Ara…"
          />

          <img
            src="/logo.png"
            alt="Infotainmentify"
            className="h-7 w-7 rounded-lg object-contain"
          />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100"
              onClick={() => setMenuOpen((s) => !s)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Hesap"
            >
              <span className="select-none text-sm text-neutral-600">☺</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
              >
                <button
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-100"
                  onClick={() => {
                    setMenuOpen(false);
                    setPwdOpen(true);
                  }}
                >
                  Şifre Değiştir
                </button>
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Şifre Değiştir Modal */}
      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </div>
  );
}
