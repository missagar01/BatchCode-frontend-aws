import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext/AuthContext.jsx"

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading, isAuthenticated, user } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard/admin", { replace: true })
    }
  }, [isAuthenticated, navigate, user])

  const BubbleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '-50px',
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              background: `radial-gradient(circle at 30% 30%, 
                rgba(255, 100, 100, 0.3), 
                rgba(220, 40, 40, 0.2), 
                rgba(200, 20, 20, 0.1))`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 20 + 20}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-orange-50/10 to-yellow-50/5" />
      </div>
    )
  }

  const style = `
    @keyframes float {
      0% {
        transform: translateY(0) scale(0.8) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.2;
      }
      50% {
        transform: translateY(-100vh) scale(1.2) rotate(180deg);
        opacity: 0.3;
      }
      90% {
        opacity: 0.1;
      }
      100% {
        transform: translateY(-120vh) scale(0.8) rotate(360deg);
        opacity: 0;
      }
    }
    .animate-float {
      animation: float linear infinite;
    }
  `

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username.trim() || !formData.password.trim()) {
      showToast("Please enter both username and password", "error")
      return
    }

    const result = await login(formData)

    if (result.success) {
      showToast(`Login successful! Welcome, ${result.user.username}`, "success")
      // Redirect based on user role
      setTimeout(() => {
        navigate("/dashboard/admin")
      }, 1000)
    } else {
      showToast(result.error, "error")
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000)
  }

  return (
    <>
      <style>{style}</style>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 relative overflow-hidden">
        <BubbleBackground />

        {toast.show && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50 min-w-80 text-center ${toast.type === "success"
            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
            : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}>
            {toast.message}
          </div>
        )}

        <div className="w-full max-w-md shadow-lg border border-red-200 rounded-lg bg-white/80 backdrop-blur-sm z-10">
          <div className="space-y-1 p-3 bg-gradient-to-r from-red-100 to-white rounded-t-lg">
            <div className="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="SRMPL Logo"
                className="h-auto w-40 mr-3 object-contain"
              />
              <h2 className="text-2xl font-bold text-gray-700">Batch Code</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="flex items-center text-gray-700 font-medium">
                <i className="fas fa-user h-4 w-4 mr-2"></i>
                Username or Employee ID
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username or employee ID"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center text-gray-700 font-medium">
                <i className="fas fa-key h-4 w-4 mr-2"></i>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/90"
              />
            </div>

            <div className="bg-gradient-to-r from-red-50 to-white p-4 -mx-6 -mb-6 mt-6 rounded-b-lg">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-500 hover:from-red-600 hover:to-red-500 text-white rounded-md font-medium disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="fixed left-0 right-0 bottom-0 py-2 px-4 bg-gradient-to-r from-red-400 to-red-400 text-white text-center text-sm shadow-md z-10">
          Powered by-<span className="font-semibold">Botivate</span>
        </div>
      </div>
    </>
  )
}

export default LoginPage
