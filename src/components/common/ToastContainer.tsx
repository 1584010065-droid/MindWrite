/**
 * Toast 消息组件
 */
import { useToastStore } from '../../stores/toastStore';

const typeStyles = {
  info: 'bg-ink/90 text-paper',
  success: 'bg-sage/90 text-paper',
  error: 'bg-clay/90 text-paper',
  warning: 'bg-amber-500/90 text-paper',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-ui animate-slide-up ${typeStyles[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}