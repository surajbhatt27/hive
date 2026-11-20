import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthHeader, AuthShell } from "../components/AuthShell";
import { safeRedirect } from "../utils/redirect";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = safeRedirect(searchParams.get("redirect"));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate(redirect, { replace: true });
        } catch (error: any) {
            setError(error.response?.data?.message || "login failed");
        }
    };

    return (
        <AuthShell>
            <AuthHeader title="Welcome back.">
                Your habits kept their place while you were away.
            </AuthHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="alert">{error}</p>}

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button type="submit" className="btn-primary w-full">
                    Sign in
                </button>

                <p className="text-sm">
                    No account yet?{" "}
                    <Link to={`/register?redirect=${encodeURIComponent(redirect)}`}>Create one</Link>
                </p>
            </form>
        </AuthShell>
    );
}

export default Login;
