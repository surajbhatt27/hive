// Where to go after signing in: an invite link the visitor came from, or the
// dashboard. Only same-app paths are accepted.
export const safeRedirect = (value: string | null) =>
    value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
