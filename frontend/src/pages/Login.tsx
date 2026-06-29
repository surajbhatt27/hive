import { useState } from "react"
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const {login} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate('/dashboard');
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
        </form>
    )
}

export default Login