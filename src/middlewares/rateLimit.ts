import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 3 * 60 * 60 * 1000, // 3 h
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const requestVerificationCodeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

export const createPostRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

export const updatePostRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

export const commentPostRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

export const uploadImageRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});
