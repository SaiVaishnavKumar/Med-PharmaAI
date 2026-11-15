import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: string; roles: string[] };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.mediflow_session;
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue' } });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser; next(); }
  catch { return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Session expired' } }); }
}
export function allowRoles(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles.some((role) => allowed.includes(role))) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    next();
  };
}
