# MTProxy list updater

Репозиторий автоматически получает актуальные MTProto-прокси со страницы [mtproxytg7.vercel.app](https://mtproxytg7.vercel.app/) и сохраняет их в `proxies.json`.

## Что обновляется

Файл `proxies.json` содержит время последнего обновления, количество прокси и массив объектов с кодом страны, сервером, портом, секретом, готовой ссылкой `tg://proxy`, источником и статусом, если он предоставлен источником.

Скрипт объединяет два официально используемых страницей источника:

- `https://proxy-sponsor.llimonix.dev/v1/site-proxies`
- `https://proxy-public.llimonix.dev/v1/public-proxies`

Перед нормализацией данные расшифровываются по той же схеме AES-256-GCM, которую использует исходная страница. Дубликаты удаляются по комбинации `server`, `port` и `secret`.

## Автоматизация

Workflow `.github/workflows/update-proxies.yml` запускается каждый день в 03:00 UTC и доступен для ручного запуска через **Actions → Update MTProxy list → Run workflow**. Если JSON изменился, GitHub Actions автоматически создаёт коммит и отправляет его в ветку `main`.

## Локальный запуск

Требуется Node.js 20 или новее:

```bash
node update-proxies.mjs
```

Команда перезапишет `proxies.json` актуальными данными.
