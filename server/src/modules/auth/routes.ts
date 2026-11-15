import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db.js';
import { authenticate } from '../../middleware/auth.js';

export const authRouter = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter a valid email and password' } });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { roles: { include: { role: true } } } });
    if (!user?.isActive || !await bcrypt.compare(parsed.data.password, user.passwordHash)) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    const roles = user.roles.map((r) => r.role.name);
    const token = jwt.sign({ id: user.id, roles }, process.env.JWT_SECRET!, { expiresIn: '8h' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    res.cookie('mediflow_session', token, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 });
    res.json({ data: { user: { id: user.id, name: user.name, email: user.email, roles } } });
  } catch (error) { next(error); }
});
authRouter.post('/logout', (_req, res) => { res.clearCookie('mediflow_session', { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true' }); res.json({ data: { loggedOut: true } }); });
authRouter.get('/me', authenticate, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, roles: { select: { role: { select: { name: true } } } } } }); res.json({ data: { ...user, roles: user?.roles.map((r) => r.role.name) ?? [] } }); }
  catch (error) { next(error); }
});
