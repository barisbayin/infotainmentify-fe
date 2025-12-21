import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
// import { v4 as uuidv4 } from "uuid";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

export interface ActiveJob {
  id: string;
  title: string;
  progress: number; // 0-100
  status: string; // e.g. "İşleniyor", "Render Alınıyor"
  startTime: Date;
}

interface NotificationContextType {
  notifications: AppNotification[];
  activeJobs: ActiveJob[];
  unreadCount: number;
  addNotification: (title: string, type?: NotificationType, message?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  startJob: (id: string, title: string) => void;
  updateJobProgress: (id: string, progress: number, status?: string) => void;
  finishJob: (id: string, success: boolean, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);

  const addNotification = useCallback((title: string, type: NotificationType = "info", message?: string) => {
    const newNotif: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // Son 50 bildirim
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // --- JOB MANAGEMENT ---
  const startJob = useCallback((id: string, title: string) => {
    setActiveJobs((prev) => {
      if (prev.find((j) => j.id === id)) return prev;
      return [...prev, { id, title, progress: 0, status: "Başlıyor...", startTime: new Date() }];
    });
  }, []);

  const updateJobProgress = useCallback((id: string, progress: number, status?: string) => {
    setActiveJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, progress, status: status || j.status } : j))
    );
  }, []);

  const finishJob = useCallback((id: string, success: boolean, message?: string) => {
    setActiveJobs((prev) => {
      const job = prev.find((j) => j.id === id);
      if (job) {
        // Job bittiğinde kalıcı bildirim ekle
        addNotification(
          success ? "İşlem Tamamlandı" : "İşlem Başarısız",
          success ? "success" : "error",
          message || `${job.title} işlemi sona erdi.`
        );
      }
      return prev.filter((j) => j.id !== id);
    });
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeJobs,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        startJob,
        updateJobProgress,
        finishJob,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
