import { useEffect, type ReactNode } from "react";

interface ModalProps {
    label: string;
    onClose: () => void;
    children: ReactNode;
}

/**
 * Overlay shell for the habit forms: backdrop click and Escape close it, the
 * panel itself swallows clicks so editing never dismisses.
 */
export const Modal = ({ label, onClose, children }: ModalProps) => {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-label={label}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};
