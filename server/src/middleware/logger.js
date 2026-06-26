import pc from 'picocolors'

export function requestLogger(req, _res, next) {
  const method = pc.bold(
    req.method === 'GET' ? pc.green(req.method) :
    req.method === 'POST' ? pc.blue(req.method) :
    req.method === 'PUT' ? pc.yellow(req.method) :
    req.method === 'DELETE' ? pc.red(req.method) :
    pc.white(req.method)
  )
  console.log(`  ${method} ${req.originalUrl}`)
  next()
}
