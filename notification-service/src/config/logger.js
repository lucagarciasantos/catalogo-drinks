// Logger simples e centralizado: toda linha carrega o nome do servico de origem.
const SERVICE = process.env.SERVICE_NAME || 'notification-service';

function write(level, message, meta) {
  const line =
    `[${new Date().toISOString()}] [${SERVICE}] ${level} ${message}` +
    (meta ? ` ${JSON.stringify(meta)}` : '');
  if (level === 'ERROR') console.error(line);
  else console.log(line);
}

module.exports = {
  info: (m, meta) => write('INFO', m, meta),
  warn: (m, meta) => write('WARN', m, meta),
  error: (m, meta) => write('ERROR', m, meta),
};
