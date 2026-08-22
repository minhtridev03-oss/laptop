import { AlertTriangle, Check, Info } from 'lucide-react';
import { useCommerce } from '../../context/CommerceContext';

export default function CommerceToast() {
  const { notification } = useCommerce();
  if (!notification) return null;

  const Icon = notification.tone === 'warning' ? AlertTriangle : notification.tone === 'neutral' ? Info : Check;

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[min(92vw,430px)] -translate-x-1/2" role="status" aria-live="polite">
      <div className="luxury-panel flex items-center gap-3 rounded-[10px] px-4 py-3 shadow-2xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary-hover">
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-text-main">{notification.message}</span>
      </div>
    </div>
  );
}
