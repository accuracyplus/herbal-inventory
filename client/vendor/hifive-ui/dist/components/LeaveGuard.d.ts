/**
 * The leave guard for a React app (C21, 20 Nov 2026). Installs the page's guard once (or uses the
 * corner button's) and hands back what an app's own screen changes need:
 *
 *   const { confirmLeave, saved } = useLeaveGuard();
 *   function go(to) { if (confirmLeave()) navigate(to); }
 *
 * Mark each form, edit drawer or editing sheet with `data-hf-guard` (a library Sheet with `guard`).
 */
export declare function useLeaveGuard(): {
    confirmLeave: (message?: string) => boolean;
    isUnsaved: () => boolean;
    saved: (el?: Element | null) => void | undefined;
    setUnsaved: (name: string, on: boolean) => void | undefined;
};
