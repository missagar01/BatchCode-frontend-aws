"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {},
    userRoles: {},
    userEmails: {}
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  // Bubble animation component
  const BubbleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated bubbles */}
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

        {/* Sunrise gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-orange-50/10 to-yellow-50/5" />
      </div>
    )
  }

  // Add CSS animations to your global CSS or CSS module
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

  const isInactiveRole = (role) => {
    if (!role) return false;
    const normalizedRole = String(role).toLowerCase().trim();
    return normalizedRole === "inactive" ||
      normalizedRole === "in active" ||
      normalizedRole === "inactiv" ||
      normalizedRole === "in activ";
  }

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrZtxegD2OX7GaemWnETrXygr7ZBqHEM_n7VHtG8cGPjbILiQNAHtzJLfZ7rhhRRtE/exec"

      try {
        setIsDataLoading(true)
        const SPREADSHEET_ID = "10ysqz-TF7GjdP1F1XBu4mkjSITulzXTmnfxaNmeK6O4"
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=master`

        const response = await fetch(sheetUrl)
        const text = await response.text()
        const jsonString = text.substring(47).slice(0, -2)
        const data = JSON.parse(jsonString)

        const userCredentials = {}
        const userRoles = {}
        const userEmails = {}

        if (data.table && data.table.rows) {
          for (let i = 1; i < data.table.rows.length; i++) {
            const row = data.table.rows[i]
            const username = row.c[2] ? String(row.c[2].v || '').trim().toLowerCase() : '';
            const password = row.c[3] ? String(row.c[3].v || '').trim() : '';
            const role = row.c[4] ? String(row.c[4].v || '').trim() : 'user';
            const email = row.c[5] ? String(row.c[5].v || '').trim() : '';

            if (username && password && password.trim() !== '') {
              if (isInactiveRole(role)) {
                continue;
              }

              const normalizedRole = role.toLowerCase();
              userCredentials[username] = password;
              userRoles[username] = normalizedRole;
              userEmails[username] = email || `${username}@example.com`;
            }
          }
        }

        setMasterData({ userCredentials, userRoles, userEmails })

      } catch (error) {
        console.error("Error Fetching Master Data:", error)
        try {
          const fallbackResponse = await fetch(SCRIPT_URL, { method: 'GET' })
          if (fallbackResponse.ok) {
            showToast("Unable to load user data. Please contact administrator.", "error")
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
        showToast(`Network error: ${error.message}. Please try again later.`, "error")
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      const trimmedUsername = formData.username.trim().toLowerCase()
      const trimmedPassword = formData.password.trim()

      if (trimmedUsername in masterData.userCredentials) {
        const correctPassword = masterData.userCredentials[trimmedUsername]
        const userRole = masterData.userRoles[trimmedUsername]
        const userEmail = masterData.userEmails[trimmedUsername]

        if (correctPassword === trimmedPassword) {
          sessionStorage.setItem('username', trimmedUsername)
          const isAdmin = userRole === "admin";
          sessionStorage.setItem('role', isAdmin ? 'admin' : 'user')
          sessionStorage.setItem('email', userEmail)

          if (isAdmin) {
            sessionStorage.setItem('department', 'all')
            sessionStorage.setItem('isAdmin', 'true')
          } else {
            sessionStorage.setItem('department', trimmedUsername)
            sessionStorage.setItem('isAdmin', 'false')
          }

          navigate("/dashboard/admin")
          showToast(`Login successful. Welcome, ${trimmedUsername}!`, "success")
          return
        } else {
          showToast("Username or password is incorrect. Please try again.", "error")
        }
      } else {
        showToast("Username or password is incorrect. Please try again.", "error")
      }

      console.error("Login Failed", {
        usernameExists: trimmedUsername in masterData.userCredentials,
        passwordMatch: (trimmedUsername in masterData.userCredentials) ?
          "Password did not match" : 'Username not found',
        userRole: masterData.userRoles[trimmedUsername] || 'No role'
      })
    } catch (error) {
      console.error("Login Error:", error)
      showToast(`Login failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoginLoading(false)
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

        {/* Toast Notification at Top */}
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
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
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
                disabled={isLoginLoading || isDataLoading}
              >
                {isLoginLoading ? "Logging in..." : isDataLoading ? "Loading..." : "Login"}
              </button>
            </div>
          </form>
        </div>

        <div className="fixed left-0 right-0 bottom-0 py-2 px-4 bg-gradient-to-r from-red-400 to-red-400 text-white text-center text-sm shadow-md z-10">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by-<span className="font-semibold">Botivate</span>
          </a>
        </div>
      </div>
    </>
  )
}

export default LoginPage