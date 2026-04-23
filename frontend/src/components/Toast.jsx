import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

let toastId = 0;
let addToastListener = null;

export const toast = {
  success: (msg) => addToastListener?.({ id: toastId++, msg, type: 'success' }),
  error: (msg) => addToastListener?.({ id: toastId++, msg, type: 'error' }),
  warning: (msg) => addToastListener?.({ id: toastId++, msg, type: 'warning' }),
  info: (msg) => addToastListener?.({ id: toastId++, msg, type: 'info' })
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastListener = (toastObj) => {
      setToasts((prev) => [...prev, toastObj]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastObj.id));
      }, 5000);
    };
    return () => { addToastListener = null; };
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-message toast-${t.type} animate-slide-up`}>
          <div className="toast-icon">
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'error' && <XCircle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'info' && <Info size={18} />}
          </div>
          <span className="toast-text">{t.msg}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
