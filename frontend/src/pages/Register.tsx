import { useState } from "react"
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const {register} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (error: any) {
            setError(error.response?.data?.message || "Registration failed")
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h1>Register</h1>
            {error && <p className="text-red-500">{error}</p>}
            <input 
            type="text"
            value={name} 
            placeholder="Enter ur name"
            onChange={(e) => setName(e.target.value)}
            required
            />
            <input 
            type="email"
            value={email}
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
            required
            />
            <input 
            type="password"
            value={password}
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)}
            required
            />
            <button type="submit">Register</button>
        </form>
    )
}

export default Register