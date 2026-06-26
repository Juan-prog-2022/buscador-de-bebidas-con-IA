import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Token required' })

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireOwner(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' })
  }
  next()
}
