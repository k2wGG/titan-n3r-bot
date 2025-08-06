// script.js
require('dotenv').config();

// Поддержка ESM- и CJS-версии inquirer
let inquirer = require('inquirer');
inquirer = inquirer.default || inquirer;

const { banner, log } = require('./lib/logger');
const { checkToken, readProxies } = require('./lib/api');
const { launchBotInstance } = require('./lib/node');
const readline = require('readline');

// Простая функция-пауза перед возвращением в меню
function pause() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Нажмите Enter для продолжения...', () => {
      rl.close();
      resolve();
    });
  });
}

async function mainMenu() {
  console.clear();  // очищаем терминал
  banner();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Выберите действие:',
      choices: [
        'Запустить бота (без прокси)',
        'Запустить бота (с прокси)',
        'Проверить REFRESH_TOKEN',
        'О проекте N3R',
        'Выйти',
      ],
    },
  ]);

  switch (action) {
    case 'Запустить бота (без прокси)':
      log.info('Запускаем бота в прямом режиме…');
      launchBotInstance(process.env.REFRESH_TOKEN, null);
      log.info('Бот запущен. Для остановки нажмите Ctrl+C.');
      // НЕ возвращаемся в меню, чтобы логи не смешивались с меню
      break;

    case 'Запустить бота (с прокси)':
      {
        const proxies = readProxies();
        if (proxies.length === 0) {
          log.warn('Прокси не найдены в proxies.txt.');
          await pause();
          return mainMenu();
        }
        log.info(`Запускаем ${proxies.length} инстансов бота через прокси…`);
        proxies.forEach((prx, idx) => {
          setTimeout(() => {
            launchBotInstance(process.env.REFRESH_TOKEN, prx);
          }, idx * 8000);
        });
        log.info('Боты запущены. Для остановки нажмите Ctrl+C.');
      }
      break;

    case 'Проверить REFRESH_TOKEN':
      await checkToken(process.env.REFRESH_TOKEN);
      await pause();
      return mainMenu();

    case 'О проекте N3R':
      console.log(`
Проект N3R — твой помощник для автоматизации участия в TitanNet.
Telegram: @NodesN3R
Авторский код, адаптированный под правила платформы.
      `);
      await pause();
      return mainMenu();

    case 'Выйти':
      log.info('До встречи!');
      process.exit();
  }
}

mainMenu();
