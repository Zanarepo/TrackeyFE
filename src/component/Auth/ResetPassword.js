import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Extract token from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!token) {
      setError("Invalid or expired reset link.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://trackitbe.onrender.com/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage("✅ Password reset successful! Redirecting to login in 3 seconds...");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-40 p-6 border rounded-lg shadow-md bg-white mb-10">
      <h2 className="text-2xl font-bold text-center text-indigo-800">Reset Password</h2>

      {message && <p className="text-green-600 text-center mt-2">{message}</p>}
      {error && <p className="text-red-600 text-center mt-2">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label className="block text-indigo-800">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-indigo-800">Confirm Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
  type="submit"
  className={`w-full py-2 mt-2 text-white font-bold rounded-md ${
    loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
  }`}
  disabled={loading}
>
  {loading ? "Resetting..." : "Reset Password"}
</button>

      </form>
    </div>
  );
};

export default ResetPassword;
