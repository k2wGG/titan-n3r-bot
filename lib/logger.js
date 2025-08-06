// lib/logger.js
const chalk = require('chalk');

// Брендированный баннер проекта
function banner() {
  console.log(chalk.bold.cyan(`
╔═════════════════════════════════════════════════════╗
║    ${chalk.magenta.bold('N3R - Titan Node Utility')} v1.0                    ║
║   🚀 Автоматизация TitanNode от @NodesN3R            ║
╚═════════════════════════════════════════════════════╝
`));
}

// Универсальный логгер с разными уровнями
const log = {
  info: (msg)    => console.log(chalk.blue('[INFO]'), msg),
  success: (msg) => console.log(chalk.green('[OK]'), msg),
  warn: (msg)    => console.log(chalk.yellow('[! WARNING]'), msg),
  error: (msg)   => console.log(chalk.red('[X ERROR]'), msg),
  action: (msg)  => console.log(chalk.white('[>]'), msg),
  point: (msg)   => console.log(chalk.magenta('[💰 Points]'), msg),
  proxy: (msg)   => console.log(chalk.gray(`[🌐 Proxy] ${msg}`)),
};

module.exports = { log, banner };
