import axios from "axios";
import { useEffect, useState } from "react"

function App() {

  const [message, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    checkBackendConnection();
  }, [])

  const checkBackendConnection = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/health')
      setMsg(response.data.message );
      console.log("backend response: ", response.data);
    } catch (err) {
      setErr("Unable to connect backend")
      console.log("Backend connection failed: ", err);
    }
  }

  return (
      <>
        <h1 className="text-center text-5xl pt-8 text-teal-400">🐝 bees in a hive</h1>
        <div className="text-center mt-10">
          <h1 className="text-xl text-white p-6">Connection test</h1>
          {message ? (
            <div className="text-green-400 p-4">
              <h2>✅ Connected</h2>
              <p>{message}</p>
            </div>
          ) : err ? (
            <div className="text-red-400 p-4">
              <h2>❌ Connection failed</h2>
              <p>{err}</p>
            </div>
          ) : (
            <p className="text-gray-400">Connecting...</p>
          )}

          <button
            onClick={checkBackendConnection}
            className="mt-5 p-2 bg-teal-400 rounded"
          >
            Test connection
          </button>
        </div>
      </>
    )
  }

export default App