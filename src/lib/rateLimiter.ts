import { RateLimiterMemory } from "rate-limiter-flexible";

// Create a rate limiter for registration attempts
export const registrationLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 60 * 60, // Per hour (in seconds)
});

// Create a rate limiter for sign-in attempts
export const signInLimiter = new RateLimiterMemory({
  points: 10, // Number of attempts
  duration: 60 * 15, // Per 15 minutes (in seconds)
});

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await limiter.consume(key);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: "Too many attempts. Please try again later.",
      };
    }
    return {
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    };
  }
}
