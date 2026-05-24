import jwt from 'jsonwebtoken';

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s || !String(s).trim()) {
    throw new Error('JWT_SECRET is not set');
  }
  return s;
};

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET(), { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET());
}
