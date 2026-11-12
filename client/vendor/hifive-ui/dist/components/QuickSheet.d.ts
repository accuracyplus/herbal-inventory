import { type QuickForm, type QuickItem, type QuickValue } from '../lib/quick';
export interface QuickSheetProps {
    form: QuickForm | null;
    open: boolean;
    onSave: (item: QuickItem, answers: Record<string, QuickValue>) => Promise<void>;
    /** Called with the ids saved in this run, possibly none. */
    onClose: (savedIds: string[]) => void;
}
export declare function QuickSheet({ form, open, onSave, onClose }: QuickSheetProps): import("react").JSX.Element;
