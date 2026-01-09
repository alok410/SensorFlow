// middleware/auth.middleware.js
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};
