/**
 * C2 · Profile card. With a photo, a 4:3 portrait with name and role on a
 * dark gradient; without, a compact row with an initials squircle. Tap opens
 * My access. Photos come only from the ID-card system, approved by HR
 * (Part Q); until that ships every card is the initials variant.
 */
export interface ProfileCardProps {
    name: string;
    role?: string | null;
    company?: string | null;
    photo?: string | null;
    onOpen?: () => void;
}
export declare const initials: (n: string) => string;
export declare function ProfileCard({ name, role, company, photo, onOpen }: ProfileCardProps): import("react").JSX.Element;
