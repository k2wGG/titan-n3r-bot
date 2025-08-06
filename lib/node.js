// lib/node.js
const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { HttpsProxyAgent } = require('https-proxy-agent');
const randomUseragent = require('random-useragent');
const { log } = require('./logger');

// Запуск одного инстанса бота
async function launchBotInstance(refreshToken, proxy) {
  const deviceId = uuidv4();
  const agent = proxy ? new HttpsProxyAgent(proxy) : null;
  const api = axios.create({
    httpsAgent: agent,
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'User-Agent': randomUseragent.getRandom(),
    },
  });

  // 1) Обновляем access token
  log.action('Обновляем access token...');
  let accessToken;
  try {
    const resp = await api.post(
      'https://task.titannet.info/api/auth/refresh-token',
      { refresh_token: refreshToken }
    );
    if (resp.data.code === 0) {
      accessToken = resp.data.data.access_token;
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      log.success('Access token получен.');
    } else {
      log.error(`Не удалось обновить токен: ${resp.data.msg}`);
      return;
    }
  } catch (e) {
    log.error(`Ошибка при обновлении токена: ${e.message}`);
    return;
  }

  // 2) Регистрируем ноду
  log.action('Регистрируем ноду...');
  try {
    const payload = {
      ext_version: '0.0.4',
      language: 'en',
      user_script_enabled: true,
      device_id: deviceId,
      install_time: new Date().toISOString(),
    };
    const reg = await api.post(
      'https://task.titannet.info/api/webnodes/register',
      payload
    );
    if (reg.data.code === 0) {
      log.success('Нода зарегистрирована.');
      log.point(`Данные регистрации: ${JSON.stringify(reg.data.data)}`);
    } else {
      log.error(`Ошибка регистрации: ${reg.data.msg}`);
    }
  } catch (e) {
    log.error(`Ошибка при регистрации ноды: ${e.message}`);
  }

  // 3) Подключаемся к WebSocket
  const wsUrl = `wss://task.titannet.info/api/public/webnodes/ws?token=${accessToken}&device_id=${deviceId}`;
  log.action('Подключаемся к WebSocket...');
  const ws = new WebSocket(wsUrl, proxy ? { agent } : {});

  ws.on('open', () => {
    log.success('WebSocket открыт, ожидаем заданий...');
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          cmd: 1,
          echo: 'echo me',
          jobReport: { cfgcnt: 2, jobcnt: 0 }
        }));
      }
    }, 30000);
    ws.on('close', () => clearInterval(ping));
  });

  ws.on('message', data => {
    try {
      const msg = JSON.parse(data);
      if (msg.userDataUpdate) {
        log.point(`Баллы — сегодня: ${msg.userDataUpdate.today_points}, всего: ${msg.userDataUpdate.total_points}`);
      }
      if (msg.cmd === 1) {
        ws.send(JSON.stringify({ cmd: 2, echo: msg.echo }));
      }
    } catch {
      log.warn(`Не удалось разобрать сообщение: ${data}`);
    }
  });

  ws.on('error', err => {
    log.error(`WebSocket error: ${err.message}`);
    ws.close();
  });

  ws.on('close', () => {
    log.warn('WebSocket закрыт. Перезапуск через 5 мин...');
    setTimeout(() => launchBotInstance(refreshToken, proxy), 5 * 60 * 1000);
  });
}

module.exports = { launchBotInstance };
