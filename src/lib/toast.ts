export type ToastStatus = 'success' | 'error' | 'warning' | 'loading';

export interface ToastOptions {
  title: string;
  description?: string;
  status: ToastStatus;
  /** Duration in ms. Pass `null` for persistent (no auto-close). Default: 5000 */
  duration?: number | null;
}

export interface ToastItem extends ToastOptions {
  id: number;
  createdAt: number;
}

type Listener = () => void;

// ---------------------------------------------------------------------------
// Toast store — framework-agnostic, consumed by the React <Toaster> component
// ---------------------------------------------------------------------------

let nextId = 0;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function toast(options: ToastOptions): number {
  const id = ++nextId;
  items = [...items, { ...options, id, createdAt: Date.now() }];
  notify();

  const duration = options.duration === undefined ? 5000 : options.duration;
  if (duration !== null) {
    setTimeout(() => closeToast(id), duration);
  }

  return id;
}

export function closeToast(id: number) {
  items = items.filter((t) => t.id !== id);
  notify();
}

/** Update an existing toast (e.g., loading → success) */
export function updateToast(id: number, options: Partial<ToastOptions>) {
  items = items.map((t) => {
    if (t.id !== id) return t;
    const updated = { ...t, ...options };
    // If duration changed, schedule auto-close
    if (options.duration !== undefined && options.duration !== null) {
      setTimeout(() => closeToast(id), options.duration as number);
    }
    return updated;
  });
  notify();
}

/** Subscribe to toast state changes (used by <Toaster>) */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Get current toasts snapshot */
export function getSnapshot(): ToastItem[] {
  return items;
}
