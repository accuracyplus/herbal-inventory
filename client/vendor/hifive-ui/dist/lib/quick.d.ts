/**
 * C17 · the quick form description an application sends, and the rules the
 * sheet applies while drawing it (Design Guide C17; decisions logged under
 * Part L, 10 Nov 2026).
 *
 * The application owns the form: its steps, fields, wording and rules. The hub
 * only draws it and sends the answers back; the application saves them and
 * applies its own rules again, so nothing here is the last word. What this file
 * decides is only what the sheet says is missing before it lets a step go.
 */
export type QuickValue = string | number | boolean;
export interface QuickField {
    key: string;
    /**
     * person (0.41.0, D-066): a searchable picker over `QuickForm.people`, for a
     * list too long for pills. It sends the chosen person's `code`; an optional
     * one can be cleared, and a cleared one that started filled sends ''.
     */
    type: 'scale' | 'choice' | 'text' | 'check' | 'person';
    label: string;
    /** choice: the options, in order. */
    options?: string[];
    /**
     * scale: the top score, 5 unless said (Recruitment's real form scores 1-10,
     * Part L log 10 Nov 2026). The words under a 1-5 scale are not shown for
     * any other range: "Strong" means nothing as a 7.
     */
    max?: number;
    placeholder?: string;
    /** A short line under the label. */
    hint?: string;
    optional?: boolean;
    /** Required after all when another field holds one of these answers: { rec: ['Hold', 'Do not hire'] }. */
    requiredWhen?: Record<string, string[]>;
    /** Shown only when another field holds one of these answers: { qRelative: ['Yes'] }. */
    showWhen?: Record<string, string[]>;
    /**
     * scale: a button beside the label that marks the field as not answered on
     * purpose ("Not evaluated", Recruitment's /rate). A skipped field is never
     * missing and never sent.
     */
    skipLabel?: string;
    /**
     * The starting answer (0.41.0, D-066: "pre-filled where known"). The field
     * opens already answered and is sent as it stands unless the person changes it.
     */
    value?: QuickValue;
}
/** Someone a person field can pick (0.41.0). `sub`: job · facility, to tell namesakes apart. */
export interface QuickPerson {
    code: string;
    name: string;
    sub?: string | null;
}
/** The value a field holds when its skip button is on. Never sent. */
export declare const SKIPPED = "__skipped__";
export interface QuickStep {
    title: string;
    fields: QuickField[];
    /** One line above the fields: "1 = Very Poor · 5 = Average · 10 = Excellent". */
    legend?: string;
    /** At least this many fields answered before the step can go on ("at least 3 scored"). */
    minAnswered?: {
        count: number;
        word: string;
        done?: string;
    };
}
/**
 * What the person needs in front of them to do the job well, drawn above the
 * form the way the application's own page draws it (C17, Part L 10 Nov 2026:
 * Recruitment's rating link). Every part is optional and is the application's
 * to fill: the hub only draws it.
 */
export interface QuickContext {
    chips?: string[];
    profile?: {
        label: string;
        value: string;
    }[];
    callout?: {
        title: string;
        lines: string[];
        note?: string;
    };
    notes?: {
        title: string;
        text: string;
    };
    history?: {
        title: string;
        sub?: string;
        outcome?: 'pass' | 'fail' | 'open';
        quote?: string;
    }[];
    links?: {
        label: string;
        href: string;
    }[];
}
export interface QuickItem {
    id: string;
    name: string;
    /** Job · facility. */
    sub?: string | null;
    /** Round, date, checkpoint: the line that says which one this is. */
    when?: string | null;
    facts?: string[];
    /** This item's own steps, when they differ by item (a round that leaves criteria out). */
    steps?: QuickStep[];
    context?: QuickContext;
    /** A field's hint for this item only: { actualDuration: 'Planned: 45 min' }. */
    hints?: Record<string, string>;
}
export interface QuickForm {
    app: string;
    appName: string;
    title: string;
    /** "Candidate", "Person": the word for one item, singular. */
    unit: string;
    steps: QuickStep[];
    items: QuickItem[];
    /** Where "Open in <app>" goes. */
    openUrl?: string | null;
    /** Who a person field can pick from (0.41.0). */
    people?: QuickPerson[];
}
export declare const SCALE_WORDS: string[];
export declare const isShown: (f: QuickField, vals: Record<string, QuickValue>) => boolean;
export declare const isRequired: (f: QuickField, vals: Record<string, QuickValue>) => boolean;
/** How many fields on the step hold a real answer (a skip is not one). */
export declare const answeredCount: (step: QuickStep, vals: Record<string, QuickValue>) => number;
/** The step's own rule, when it has one and it is not met: "Score at least 3." */
export declare function stepProblem(step: QuickStep, vals: Record<string, QuickValue>): string | null;
/** The fields on this step still to answer, in order. */
export declare function missingFields(step: QuickStep, vals: Record<string, QuickValue>): QuickField[];
/** The answers a form opens with: every field's starting `value`, if it has one. */
export declare function startingValues(steps: QuickStep[]): Record<string, QuickValue>;
/** The person a code names, from the form's list; null when the list does not have them. */
export declare function personFor(people: QuickPerson[] | undefined, code: QuickValue | undefined): QuickPerson | null;
/**
 * The answers to send: only fields that are shown, trimmed, nothing for an untouched optional field.
 * A person field that started filled and was cleared sends '', so the application knows to clear it.
 */
export declare function answersFor(steps: QuickStep[], vals: Record<string, QuickValue>): Record<string, QuickValue>;
/** What the primary button says it is waiting for, in one line (the button is always enabled). */
export declare function missingLine(missing: QuickField[]): string | null;
