import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`toast${visible ? ' on' : ''}`}>{message}</div>
  );
}

// Hook to manage toast state
export function useToast() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = (message: string, dur = 2400) => {
    setMsg(message);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), dur);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { msg, visible, toast };
}
