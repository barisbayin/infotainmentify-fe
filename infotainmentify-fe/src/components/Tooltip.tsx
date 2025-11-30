import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  text: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export default function Tooltip({ text, children, maxWidth = "250px" }: Props) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const timeout = useRef<number | null>(null);

  // 🖱️ Mouse hareketini takip et
  function handleMove(e: React.MouseEvent) {
    // Kanka burada ufak bir zeka ekliyoruz:
    // Eğer mouse ekranın sağına çok yakınsa (%80'den sonrası), tooltip'i sola doğru açarız.
    const isRightSide = e.clientX > window.innerWidth * 0.8;
    const isBottomSide = e.clientY > window.innerHeight * 0.8;

    setCoords({
      x: e.clientX,
      y: e.clientY,
    });

    // Yön bilgisini state'e atmaya gerek yok, render sırasında CSS ile halledeceğiz
  }

  function handleEnter() {
    if (timeout.current) clearTimeout(timeout.current);
    // ⚡️ Kullanıcı yanlışlıkla geçerse hemen açılmasın, 300ms beklesin (SaaS standardı)
    timeout.current = window.setTimeout(() => setShow(true), 300);
  }

  function handleLeave() {
    if (timeout.current) clearTimeout(timeout.current);
    setShow(false);
  }

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  // Tooltip içeriği yoksa boş dön (Hata önleyici)
  if (!text) return <>{children}</>;

  return (
    <>
      <div
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="inline-flex cursor-help" // cursor-help kullanıcıya ipucu olduğunu anlatır
      >
        {children}
      </div>

      {show &&
        createPortal(
          <div
            // ✨ PREMIUM STİL GÜNCELLEMESİ
            className="fixed z-[9999] px-3 py-2 pointer-events-none
                       bg-slate-900/95 text-slate-50 text-xs font-medium leading-relaxed
                       rounded-lg shadow-xl shadow-slate-900/20 
                       ring-1 ring-white/10 backdrop-blur-sm
                       transition-opacity duration-200 animate-in fade-in zoom-in-95"
            style={{
              top: coords.y,
              left: coords.x,
              maxWidth,
              // 🧠 AKILLI KONUMLANDIRMA:
              // Mouse'un biraz altına (12px) koyuyoruz.
              // Eğer ekranın sağındaysak (coords.x > windowWidth/2) tooltip'i sola (-100%) kaydırıyoruz.
              transform: `translate(
                ${coords.x > window.innerWidth - 200 ? "-100%" : "12px"}, 
                ${coords.y > window.innerHeight - 100 ? "-120%" : "16px"}
              )`,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
