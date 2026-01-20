import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { User, PrivateUser} from '@betteam/shared/interfaces/User';
import { RegisterRequest } from '@betteam/shared/api/registerRequest';
import { RegisterResponse } from '@betteam/shared/api/registerResponse';
import { LoginRequest } from '@betteam/shared/api/loginRequest';
import { LoginResponse } from '@betteam/shared/api/loginResponse';
import { AuthMeResponse } from '@betteam/shared/api/authmeResponse';
import { LogoutRequest } from '@betteam/shared/api/logoutRequest';
import { LogoutResponse } from '@betteam/shared/api/logoutResponse';
import { RefreshTokenRequest } from '@betteam/shared/api/refreshTokenRequest';
import { RefreshTokenResponse } from '@betteam/shared/api/refreshTokenResponse';
import { ForgotPasswordRequest } from '@betteam/shared/api/forgotPasswordRequest';
import { ForgotPasswordResponse } from '@betteam/shared/api/forgotPasswordResponse';
import { ResetPasswordRequest } from '@betteam/shared/api/resetPasswordRequest';
import { ResetPasswordResponse } from '@betteam/shared/api/resetPasswordResponse';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a short-lived access token (JWT)
 */
const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET!,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

/**
 * Generate a random refresh token
 */
const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a token using SHA-256
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a password reset token
 */
const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create and store a refresh token for a user
 */
const createRefreshToken = async (userId: string): Promise<string> => {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return refreshToken;
};

const transformPrivateUserToUser = (privateUser: PrivateUser): User => {
  const { passwordHash, ...user } = privateUser;
  return user;
}

// POST /api/auth/register
router.post('/register', async (req: Request<{}, {}, RegisterRequest.Body>, res: Response<RegisterResponse | { error: string }>)=> {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        error: "Email, username and password are required.",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : "Username";
      return res.status(409).json({
        error: `${field} is already used by another account.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName,
        lastName,
      },
    });

    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = await createRefreshToken(newUser.id);

    const publicUser = transformPrivateUserToUser(newUser);

    return res.status(201).json({
      user: publicUser,
      token: accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Erreur Register:', error);
    return res.status(500).json({
      error: 'Internal Server Error, an error occurred during registration.',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, LoginRequest.Body>, res: Response<LoginResponse | { error: string }>) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // On cherche l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);
    const publicUser = transformPrivateUserToUser(user);

    return res.status(200).json({
      message: 'Login successful',
      user: publicUser,
      token: accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Erreur Login:', error);
    return res.status(500).json({ error: 'Internal Server Error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response<AuthMeResponse | { error: string }>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed token.' });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    if (!payload || typeof payload.userId !== 'string') {
        return res.status(403).json({ error: 'Invalid token payload.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const publicUser = transformPrivateUserToUser(user);
    
    return res.status(200).json({
      user: publicUser,
    });

  } catch (error) {
    console.error('Erreur Auth Me:', error);
    return res.status(500).json({
      error: 'Internal Server Error while fetching user profile.',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response<LogoutResponse | { error: string }>) => {
  try {
    const { refreshToken } = req.body as LogoutRequest.Body;

    if (refreshToken) {
      // Revoke specific refresh token
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          userId: req.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } else {
      // Revoke all refresh tokens for this user
      await prisma.refreshToken.updateMany({
        where: {
          userId: req.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      message: 'Logged out successfully.',
    });

  } catch (error) {
    console.error('Erreur Logout:', error);
    return res.status(500).json({
      error: 'Internal Server Error during logout.',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request<{}, {}, RefreshTokenRequest.Body>, res: Response<RefreshTokenResponse | { error: string }>) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const tokenHash = hashToken(refreshToken);

    // Find the refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      return res.status(401).json({ error: 'Refresh token has been revoked.' });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token has expired.' });
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    // Revoke the old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken(storedToken.userId);
    const newRefreshToken = await createRefreshToken(storedToken.userId);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Erreur Refresh Token:', error);
    return res.status(500).json({
      error: 'Internal Server Error during token refresh.',
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request<{}, {}, ForgotPasswordRequest.Body>, res: Response<ForgotPasswordResponse | { error: string }>) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Always return success to prevent email enumeration
    const successResponse: ForgotPasswordResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      // Return success even if user doesn't exist (security)
      return res.status(200).json(successResponse);
    }

    // Invalidate any existing password reset tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate new password reset token
    const resetToken = generatePasswordResetToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // For now, log the reset URL (development only)
    console.log('===========================================');
    console.log('PASSWORD RESET REQUESTED');
    console.log(`User: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires at: ${expiresAt.toISOString()}`);
    console.log('===========================================');

    return res.status(200).json(successResponse);

  } catch (error) {
    console.error('Erreur Forgot Password:', error);
    return res.status(500).json({
      error: 'Internal Server Error during password reset request.',
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request<{}, {}, ResetPasswordRequest.Body>, res: Response<ResetPasswordResponse | { error: string }>) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const tokenHash = hashToken(token);

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      return res.status(400).json({ error: 'Reset token has already been used.' });
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired.' });
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens (force re-login on all devices)
      prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return res.status(200).json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });

  } catch (error) {
    console.error('Erreur Reset Password:', error);
    return res.status(500).json({
      error: 'Internal Server Error during password reset.',
    });
  }
});

export default router;
