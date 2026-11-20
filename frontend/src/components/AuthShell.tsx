import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";

// Sign-in and sign-up share one narrow, vertically centred column.
export const AuthShell = ({ children }: { children: ReactNode }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-14">
        {children}
    </div>
);

export const AuthHeader = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="mb-8">
        <Wordmark className="mb-7" />
        <h1 className="mb-1">{title}</h1>
        <p className="text-sm">{children}</p>
    </div>
);
