import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";

export default function Dashboard() {
    const { logout } = useAuth();
    
    const testMe = async () => {
        try {
            const res = await authService.getMe();
            console.log('User data:', res.data.user);
            alert(`User: ${res.data.user.name} (${res.data.user.email})`);
        } catch (error) {
            console.error('Error fetching /me:', error);
            alert('Failed to fetch user data');
        }
    };
    
    return (
        <div>
            <h1>Dashboard</h1>
            <button onClick={testMe}>Test /me endpoint</button>
            <button onClick={logout}>Logout</button>
        </div>
    )
}