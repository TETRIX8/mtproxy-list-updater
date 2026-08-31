Источник: https://mtproxytg7.vercel.app/

Страница загружает два JSON-эндпоинта:
- https://proxy-sponsor.llimonix.dev/v1/site-proxies — прокси с полями geo/country, server/host, port, secret, status, placement_id.
- https://proxy-public.llimonix.dev/v1/public-proxies — публичные прокси с полями country, host, port, secret.

Оба ответа имеют конверт {v: 1, alg: "A256GCM", iv: base64, ct: base64}. Сайт расшифровывает AES-GCM-256. Ключ строится так: seed bytes = ASCII "mt91zxq"; Q = [78,116,96,107,87,98,106,70,128,93,70,119,60,101,122,67,139,119,123,85,125,67,100,137,121,72,114,69,117,87,84,115,86,120,129,116,86,117,65,136,88,117,87,85]; reverse Q, subtract 0x11 from each value, base64-decode result to x; SHA-256(seed), then XOR x with hash. AES-GCM uses iv from envelope; WebCrypto ciphertext includes 16-byte authentication tag.

На странице Telegram-ссылки строятся как tg://proxy?server=...&port=...&secret=....
