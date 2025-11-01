import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  text: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export default function Tooltip({ text, children, maxWidth = "320px" }: Props) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const timeout = useRef<number | null>(null);

  function handleMove(e: React.MouseEvent) {
    setCoords({ x: e.clientX + 12, y: e.clientY - 16 }); // 🎯 imlecin biraz sağı ve üstü
  }

  function handleEnter() {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setShow(true), 150); // küçük gecikme
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

  return (
    <>
      <div
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="inline-block cursor-default"
      >
        {children}
      </div>

      {show &&
        createPortal(
          <div
            className="fixed z-[9999] px-3 py-2 text-xs text-white bg-neutral-800 
                       rounded-lg shadow-lg whitespace-pre-line pointer-events-none
                       transition-all duration-100 opacity-100 transform animate-fadeIn"
            style={{
              top: coords.y,
              left: coords.x,
              maxWidth,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
