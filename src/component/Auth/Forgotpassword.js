import { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
        const response = await fetch("https://trackitbe.onrender.com/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-40">
      <h2 className="text-xl font-bold text-yellow-800 text-center mb-4">Forgot Password</h2>
      
      {message && <p className="text-indigo-500 text-center">{message}</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-indigo-800">Email Address</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Sending..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
