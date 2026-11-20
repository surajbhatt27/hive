import { useState } from "react"
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// Where to go after signing in: an invite link the visitor came from, or the
// dashboard. Only same-app paths are accepted.
const safeRedirect = (value: string | null) =>
    value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const {login} = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = safeRedirect(searchParams.get('redirect'));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate(redirect, { replace: true });
        } catch (error: any) {
            setError(error.response?.data?.message || "login failed")
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            {error && <p className="text-red-500">{error}</p>}
            <input 
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
            />
            <input 
            type="password"
            value={password}
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            required
            />
            <button type="submit">Login</button>
            <p>
                No account?{' '}
                <Link to={`/register?redirect=${encodeURIComponent(redirect)}`}>Create one</Link>
            </p>
        </form>
    )
}

export default Login