import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export async function register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), passwordHash });

  const payload: TokenPayload = { userId: user._id.toString(), email: user.email };
  const token = signToken(payload);

  return { token, user: { id: user._id.toString(), email: user.email } };
}

export async function login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const payload: TokenPayload = { userId: user._id.toString(), email: user.email };
  const token = signToken(payload);

  return { token, user: { id: user._id.toString(), email: user.email } };
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET!) as TokenPayload;
}
