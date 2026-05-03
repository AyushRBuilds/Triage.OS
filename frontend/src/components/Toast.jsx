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
<<<<<<< HEAD
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastListener = (toastObj) => {
      setToasts((prev) => [...prev, toastObj]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastObj.id));
      }, 5000);
=======
  const [queue, setQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);

  useEffect(() => {
    addToastListener = (toastObj) => {
      setQueue((prev) => [...prev, toastObj]);
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
    };
    return () => { addToastListener = null; };
  }, []);

<<<<<<< HEAD
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
=======
  useEffect(() => {
    if (!currentToast && queue.length > 0) {
      setCurrentToast(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, currentToast]);

  useEffect(() => {
    if (currentToast) {
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 3000); // 3 seconds per toast for a smoother sequence
      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  const removeToast = () => setCurrentToast(null);

  return (
    <div className="toast-container">
      {currentToast && (
        <div key={currentToast.id} className={`toast-message toast-${currentToast.type} animate-slide-up`}>
          <div className="toast-icon">
            {currentToast.type === 'success' && <CheckCircle size={18} />}
            {currentToast.type === 'error' && <XCircle size={18} />}
            {currentToast.type === 'warning' && <AlertTriangle size={18} />}
            {currentToast.type === 'info' && <Info size={18} />}
          </div>
          <span className="toast-text">{currentToast.msg}</span>
          <button className="toast-close" onClick={removeToast}>
            <X size={14} />
          </button>
        </div>
      )}
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
    </div>
  );
}
