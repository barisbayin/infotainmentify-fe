// src/components/ChangePasswordModal.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
// alias kullanmıyorsan: import * as UsersApi from "../api/users";
import * as UsersApi from "../api/users";
import type { HttpError } from "../api/types";

type Props = { open: boolean; onClose: () => void };

function ModalContent({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(false);
    if (newPassword.length < 6) {
      setErr("Yeni şifre en az 6 karakter olmalı.");
      setBusy(false);
      return;
    }
    if (newPassword === currentPassword) {
      setErr("Yeni şifre mevcut şifreyle aynı olamaz.");
      setBusy(false);
      return;
    }
    try {
      await UsersApi.changeMyPassword(currentPassword, newPassword);
      setOk(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(onClose, 900);
    } catch (ex: unknown) {
      const he = ex as HttpError;
      const msg =
        (he?.detail && (he.detail.title || he.detail.message)) ||
        he?.message ||
        "Şifre değiştirilemedi.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={busy ? undefined : onClose}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Şifre Değiştir</h2>
          <p className="text-sm text-neutral-500">
            Mevcut şifreni doğrula ve yeni şifreni belirle.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              Mevcut Şifre
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-400"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={1}
              disabled={busy}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              Yeni Şifre
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-400"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={busy}
            />
          </div>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Şifre güncellendi.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
              onClick={onClose}
              disabled={busy}
            >
              Kapat
            </button>
            <button
              type="submit"
              className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  if (!open) return null;
  // modal-root yoksa body'ye oluştur
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
  return createPortal(<ModalContent onClose={onClose} />, root);
}
