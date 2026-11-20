import { Link } from "react-router-dom";

// The mark is a skep: a straw hive, three bands and a base. One copy, used by
// the app header and the signed-out pages, so it can never drift between them.
export const Wordmark = ({ className = "" }: { className?: string }) => (
    <Link
        to="/"
        className={`flex items-center gap-2 font-display text-lg text-ink no-underline ${className}`.trim()}
    >
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-moss"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M6.1 18.6c0-8.2 2.6-13.8 5.9-13.8s5.9 5.6 5.9 13.8" />
            <path d="M7.4 11.9c1.9-.9 7.3-.9 9.2 0" />
            <path d="M6.8 15.3c2.2-1 8.2-1 10.4 0" />
            <path d="M4.4 18.6h15.2" />
        </svg>
        hive
    </Link>
);
