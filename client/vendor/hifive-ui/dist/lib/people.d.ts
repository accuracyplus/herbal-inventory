/** Someone who can be picked: id, name, and job · facility to tell namesakes apart. */
export interface Person {
    id: string;
    name: string;
    detail?: string | null;
}
/** Every typed word must start a word of the name: "am as" finds Amrutha Ashok. */
export declare function matchPeople(people: Person[], q: string, limit?: number): Person[];
/**
 * The name a colleague would use: the first word, unless it is an
 * abbreviation ("Ma." for Maria, "Md." for Mohammed), which is never said
 * alone, so the next word comes with it. "Ma. Cristina Reyes" → "Ma. Cristina".
 */
export declare function firstName(name: string): string;
