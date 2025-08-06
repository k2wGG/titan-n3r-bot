// lib/api.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { log } = require('./logger');

// Проверяет, действителен ли REFRESH_TOKEN
async function checkToken(refreshToken) {
  if (!refreshToken) {
    log.error('REFRESH_TOKEN не задан в .env');
    return false;
  }
  log.info('Проверяем валидность REFRESH_TOKEN...');
  try {
    const res = await axios.post(
      'https://task.titannet.info/api/auth/refresh-token',
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.data && res.data.code === 0) {
      log.success('Токен действительный.');
      return true;
    } else {
      log.error(`Проверка токена не удалась: ${res.data.msg || 'неизвестная ошибка'}`);
      return false;
    }
  } catch (err) {
    log.error(`Ошибка при проверке токена: ${err.message}`);
    return false;
  }
}

// Читает список прокси из proxies.txt
function readProxies() {
  const file = path.join(__dirname, '..', 'proxies.txt');
  try {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, 'utf-8')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      log.info(`Загружено прокси: ${lines.length}`);
      return lines;
    } else {
      log.warn('proxies.txt не найден.');
      return [];
    }
  } catch (err) {
    log.error(`Ошибка чтения proxies.txt: ${err.message}`);
    return [];
  }
}

module.exports = { checkToken, readProxies };
