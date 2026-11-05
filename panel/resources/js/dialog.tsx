import { AlertTriangle, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// In-app replacements for window.confirm / window.alert. The browser's own
// dialogs always sit at the top of the window and cannot be styled, so these
// render a modal centred on the screen instead and resolve a promise.

type Kind = 'confirm' | 'alert';

const DANGER = /\b(delete|remove|terminate|cancel|close|refund|sign out)\b/i;

function Dialog({ kind, message, onDone }: { kind: Kind; message: string; onDone: (ok: boolean) => void }) {
    const okRef = useRef<HTMLButtonElement>(null);
    const danger = kind === 'confirm' && DANGER.test(message);

    useEffect(() => {
        okRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onDone(kind === 'alert');
            }
        };
        // Capture phase, so an open Modal underneath does not also close.
        window.addEventListener('keydown', onKey, true);

        return () => window.removeEventListener('keydown', onKey, true);
    }, [kind, onDone]);

    const Icon = kind === 'confirm' ? AlertTriangle : Info;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onDone(kind === 'alert')}>
            <div role={kind === 'confirm' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-describedby="app-dialog-message" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
                        <Icon size={20} />
                    </span>
                    <p id="app-dialog-message" className="whitespace-pre-line pt-2 text-sm text-slate-700">{message}</p>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    {kind === 'confirm' && <button type="button" className="ui-btn ui-btn-secondary" onClick={() => onDone(false)}>Cancel</button>}
                    <button ref={okRef} type="button" className={`ui-btn ${danger ? 'ui-btn-danger' : 'ui-btn-primary'}`} onClick={() => onDone(true)}>OK</button>
                </div>
            </div>
        </div>
    );
}

function open(kind: Kind, message: unknown): Promise<boolean> {
    return new Promise((resolve) => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const previous = document.activeElement as HTMLElement | null;
        const done = (ok: boolean) => {
            root.unmount();
            host.remove();
            previous?.focus?.();
            resolve(ok);
        };
        root.render(<Dialog kind={kind} message={String(message ?? '')} onDone={done} />);
    });
}

/** Resolves true when the user presses OK, false on Cancel / Escape / backdrop. */
export const confirmDialog = (message: string) => open('confirm', message);

export const alertDialog = (message: unknown): Promise<void> => open('alert', message).then(() => undefined);

/** Runs `then` only after the user confirms. */
export function ask(message: string, then: () => unknown): void {
    void confirmDialog(message).then((ok) => {
        if (ok) then();
    });
}
