import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth"; 
import { User, LogOut, KeyRound, ChevronDown, Settings, Save } from "lucide-react";
import { Modal, Input, Button, Label } from "./ui-kit";
import { changeMyPassword } from "../api/users";
import toast from "react-hot-toast";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Click outside logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    window.location.href = "/login";
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      toast.success("Şifreniz başarıyla değiştirildi.");
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Şifre değiştirilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <User size={16} />
          </div>
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
              {user?.username || "Kullanıcı"}
            </span>
            <span className="text-[10px] text-zinc-500">Yönetici</span>
          </div>
          <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 ml-1" />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1">
            <div className="px-3 py-2 border-b border-zinc-800/50 mb-1">
              <p className="text-xs font-medium text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email || "admin@infotainmentify.com"}</p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Settings size={14} /> Ayarlar
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsPasswordModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <KeyRound size={14} /> Şifre Değiştir
            </button>
            
            <div className="h-px bg-zinc-800/50 my-1 mx-2" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={14} /> Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Şifre Değiştir"
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-200/80 text-xs">
            Güvenliğiniz için lütfen güçlü bir şifre seçin. Şifreniz en az 6 karakter uzunluğunda olmalıdır.
          </div>

          <div>
            <Label>Mevcut Şifre</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Yeni Şifre</Label>
               <Input
                 type="password"
                 placeholder="••••••••"
                 value={passwordForm.newPassword}
                 onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
               />
             </div>
             <div>
               <Label>Yeni Şifre (Tekrar)</Label>
               <Input
                 type="password"
                 placeholder="••••••••"
                 value={passwordForm.confirmPassword}
                 onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
               />
             </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
             <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>İptal</Button>
             <Button onClick={handleChangePassword} isLoading={loading}>
                <Save size={16} className="mr-2" />
                Güncelle
             </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
