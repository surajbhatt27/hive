import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthHeader, AuthShell } from "../components/AuthShell";
import { safeRedirect } from "../utils/redirect";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = safeRedirect(searchParams.get("redirect"));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await register(name, email, password);
            navigate(redirect, { replace: true });
        } catch (error: any) {
            setError(error.response?.data?.message || "Registration failed");
        }
    };

    return (
        <AuthShell>
            <AuthHeader title="Start a hive.">
                Group the habits you want to keep, alone or with people.
            </AuthHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="alert">{error}</p>}

                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        placeholder="What should we call you?"
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                    />
                </div>

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
                        placeholder="Choose something you'll remember"
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <button type="submit" className="btn-primary w-full">
                    Create account
                </button>

                <p className="text-sm">
                    Already have an account?{" "}
                    <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link>
                </p>
            </form>
        </AuthShell>
    );
}

export default Register;
