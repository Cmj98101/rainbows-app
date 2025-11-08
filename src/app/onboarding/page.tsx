"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Church information
  const [churchName, setChurchName] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [churchPhone, setChurchPhone] = useState("");
  const [churchAddress, setChurchAddress] = useState("");

  // Admin information
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNext = () => {
    setError("");

    if (step === 1) {
      if (!churchName || !churchEmail) {
        setError("Church name and email are required");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminName || !adminEmail || !adminPassword) {
      setError("All admin fields are required");
      return;
    }

    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchName,
          churchEmail,
          churchPhone,
          churchAddress,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Onboarding failed");
      }

      // Redirect to dashboard - use window.location for full page reload
      // This ensures cookies are properly set before navigating
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl mb-6">Welcome to Rainbows App</h1>

          {/* Progress Steps */}
          <ul className="steps steps-horizontal w-full mb-8">
            <li className={`step ${step >= 1 ? "step-primary" : ""}`}>
              Church Info
            </li>
            <li className={`step ${step >= 2 ? "step-primary" : ""}`}>
              Admin Account
            </li>
            <li className={`step ${step >= 3 ? "step-primary" : ""}`}>
              Complete
            </li>
          </ul>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Church Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Church Information</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Church Name *</span>
                  </label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="input input-bordered"
                    placeholder="First Rainbow Church"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Church Email *</span>
                  </label>
                  <input
                    type="email"
                    value={churchEmail}
                    onChange={(e) => setChurchEmail(e.target.value)}
                    className="input input-bordered"
                    placeholder="contact@church.org"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={churchPhone}
                    onChange={(e) => setChurchPhone(e.target.value)}
                    className="input input-bordered"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <textarea
                    value={churchAddress}
                    onChange={(e) => setChurchAddress(e.target.value)}
                    className="textarea textarea-bordered"
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>

                <div className="card-actions justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Create Admin Account</h2>
                <p className="text-sm text-gray-600">
                  This account will have full access to manage your church.
                </p>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="input input-bordered"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email *</span>
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="input input-bordered"
                    placeholder="admin@church.org"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password *</span>
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="input input-bordered"
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm Password *</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input input-bordered"
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <div className="card-actions justify-between mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-ghost"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Creating...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
