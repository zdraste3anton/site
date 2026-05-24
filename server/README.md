# CharacterForge API

Backend для [CharacterForge](../): авторизация (JWT), справочник D&D (расы, классы, заклинания), персонажи, ИИ-генерация (GigaChat), экспорт PDF.

## Стек

- Node.js, Express, PostgreSQL, Prisma ORM  
- JWT, bcrypt, cors, dotenv, express-validator  
- GigaChat API (Сбер) для текста ИИ, опционально [Replicate](https://replicate.com) для картинки портрета, PDFKit (+ шрифт DejaVu с CDN для кириллицы в PDF)

## Требования

- Node.js 18+  
- PostgreSQL 14+

## Установка

```bash
cd server
npm install
```

Создайте файл **`server/.env`** (в той же папке, что и `package.json` сервера):

```bash
cd server
copy .env.example .env
# отредактируйте .env: реальные DATABASE_URL и JWT_SECRET обязательны
```

**Обязательные переменные** (без них процесс завершится с понятным сообщением в консоли):

| Переменная       | Описание |
|------------------|----------|
| `DATABASE_URL`   | Строка подключения PostgreSQL (см. пример в `.env.example`) |
| `JWT_SECRET`     | Секрет подписи JWT (≥ 32 символов, случайная строка) |
| `PORT`           | Порт API (по умолчанию 3001, если не задан) |

Для работы ИИ-маршрутов (`POST /api/ai/attributes`, `/api/ai/story`, `/api/ai/portrait`) дополнительно нужен **`GIGACHAT_AUTH_KEY`** в `server/.env`. Без него эти эндпоинты отвечают **503** с телом `{ "message": "Сервис ИИ не настроен", "code": "GIGACHAT_NOT_CONFIGURED" }` (не `OPENAI_*`).

Дополнительно:

| Переменная       | Описание |
|------------------|----------|
| `FRONTEND_URL`   | Origin CRA для CORS (например `http://localhost:3000`) |

### GigaChat (маршруты `/api/ai/*`)

Текстовая генерация (характеристики, история, текстовый промпт портрета) идёт через **GigaChat**. Нужен аккаунт в [Sber Developer / GigaChat API](https://developers.sber.ru/): создайте проект, получите **ключ авторизации** (для заголовка `Authorization: Basic …`).

**Обязательно для ИИ:** `GIGACHAT_AUTH_KEY` (см. `server/.env.example`). Без него ответы `/api/ai/*` — **503** JSON: `{ "message": "Сервис ИИ не настроен", "code": "GIGACHAT_NOT_CONFIGURED" }`.

| Переменная | Описание |
|------------|----------|
| `GIGACHAT_AUTH_KEY` | Ключ для `Authorization: Basic` (значение после `Basic ` или целая строка с префиксом — см. кабинет разработчика) |
| `GIGACHAT_SCOPE` | По умолчанию `GIGACHAT_API_PERS` |
| `GIGACHAT_AUTH_URL` | OAuth, по умолчанию `https://ngw.devices.sberbank.ru:9443/api/v2/oauth` |
| `GIGACHAT_BASE_URL` | API, по умолчанию `https://gigachat.devices.sberbank.ru/api/v1` |
| `GIGACHAT_MODEL` | По умолчанию `GigaChat` |
| `GIGACHAT_VERIFY_SSL` | `true` (по умолчанию). Для локальной отладки при ошибках TLS: `false` — **только в доверенной среде** |
| `GIGACHAT_TIMEOUT_MS` | Таймаут HTTP (мс), по умолчанию `120000` |

**Текст ИИ (GigaChat)** и **картинка портрета (Replicate)** разделены: промпт для изображения собирает GigaChat; если задан **`REPLICATE_API_TOKEN`**, сервер вызывает Replicate и подставляет **`imageUrl`** (обычно HTTPS URL на `replicate.delivery`). Без токена `imageUrl` будет `null`, в ответе может быть **`portraitHint`**.

| Переменная | Описание |
|------------|----------|
| `REPLICATE_API_TOKEN` | API-токен Replicate ([аккаунт](https://replicate.com/account/api-tokens)) |
| `REPLICATE_MODEL` | Модель в формате `owner/name`, по умолчанию `black-forest-labs/flux-schnell` |
| `REPLICATE_TIMEOUT_MS` | Ожидание завершения прогона (мс), по умолчанию `180000` |

**Prisma и переменные окружения:** команды `npx prisma …` и `npm run prisma:*` нужно выполнять **из папки `server`**, чтобы подхватился `server/.env`. Ошибка `Environment variable not found: DATABASE_URL` при `prisma migrate` или `prisma generate` обычно значит: нет `DATABASE_URL` в `server/.env` или команда запущена не из `server`.

**Порядок загрузки в runtime:** точка входа `src/index.js` сначала импортирует `src/loadEnv.js` (только `dotenv`), затем остальные модули — так `DATABASE_URL` доступен до инициализации Prisma Client.

## База данных

**Windows:** если порт `5432` закрыт или миграции падают с `P1001`, откройте **[POSTGRESQL-WINDOWS.md](./POSTGRESQL-WINDOWS.md)** (установка, служба, `CREATE DATABASE`). Быстрая проверка: `powershell -File scripts/windows-check-backend.ps1` из папки `server`.

Создайте БД:

```sql
CREATE DATABASE characterforge;
```

Применить миграции (интерактивное имя миграции при необходимости):

```bash
cd server
npx prisma migrate dev
# или
npm run prisma:migrate
```

Или развернуть уже подготовленную миграцию:

```bash
npx prisma migrate deploy
```

Сгенерировать клиент Prisma (после смены схемы или первого клонирования):

```bash
cd server
npx prisma generate
# или
npm run prisma:generate
```

Заполнить справочник (расы, классы, заклинания из `../src/data/spellsData.js`):

```bash
npm run prisma:seed
```

## Запуск

```bash
npm run dev
```

С hot-reload через `node --watch`. Продакшен:

```bash
npm start
```

Сервер: `http://localhost:3001` (или `PORT` из `.env`).

## Проверка

```http
GET /api/health
```

Пример ответа:

```json
{
  "ok": true,
  "db": "ok"
}
```

- `db` — `ok` при успешном подключении к PostgreSQL, `error` если БД недоступна, `not_configured` если `DATABASE_URL` пуст (без URL сервер не стартует).

**Регистрация:** после миграций и запуска `npm run dev`:

```http
POST /api/auth/register
Content-Type: application/json

{"username":"demo","email":"demo@example.com","password":"secret12"}
```

## Основные маршруты

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/api/auth/register` | Регистрация `{ username, email, password }` |
| POST | `/api/auth/login` | Вход `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | Текущий пользователь (Bearer JWT) |
| GET | `/api/races` | Список рас |
| GET | `/api/classes` | Список классов |
| GET | `/api/spells` | Все заклинания (`{ items }`, без query-фильтров) |
| GET | `/api/health` | `{ ok, db }` — без секретов |
| POST | `/api/characters` | Создать персонажа (JWT) |
| GET | `/api/characters` | Список персонажей пользователя |
| GET | `/api/characters/:id` | Лист персонажа |
| DELETE | `/api/characters/:id` | Удалить (JWT) |
| POST | `/api/ai/attributes` | ИИ: характеристики (GigaChat) → JSON `attributes`, `explanation`, опционально `archetype` |
| POST | `/api/ai/story` | ИИ: история (GigaChat) → `{ story }` |
| POST | `/api/ai/portrait` | Промпт портрета (GigaChat) → `promptUsed`; `imageUrl` — HTTPS URL при наличии `REPLICATE_API_TOKEN`, иначе `null` и при необходимости `portraitHint` |

Детали по id рас/классов и фильтры заклинаний: `routes/compendiumRoutes.js` (не подключён). PUT и PDF персонажа: `routes/characterRoutes.js` (не подключён).

ИИ-маршруты без `GIGACHAT_AUTH_KEY` отвечают **503** с JSON `{ "message": "Сервис ИИ не настроен", "code": "GIGACHAT_NOT_CONFIGURED" }`. Ошибки GigaChat и таймауты — **502/503/504** с JSON `{ message, code }` (без HTML).

## Вместе с фронтендом

Из корня репозитория:

```bash
npm run dev
```

В `package.json` корня скрипт `dev` должен поднимать и CRA (прокси `/api` → `localhost:3001`), и API. Убедитесь, что PostgreSQL запущен, миграции и seed выполнены.

## Структура

```
server/
  prisma/
    schema.prisma
    seed.mjs
    migrations/
  src/
    app.js
    index.js
    routes/
    controllers/
    services/
    middleware/
    utils/
```

Точка входа: `server/src/index.js`.

Сервисы ИИ: `src/services/gigachatService.js` (OAuth + кеш токена, `POST /chat/completions`), `src/services/gigachatGeneration.service.js` (логика этапов), `src/services/replicateImageService.js` (картинка портрета через Replicate), `src/utils/gigachatHttp.js` (TLS через флаг `GIGACHAT_VERIFY_SSL`). Файл `hfImageService.js` в репозитории остаётся, но цепочка портрета его не вызывает.

## Ручная проверка ИИ (после `npm run dev` и настройки `.env`)

Базовый URL: `http://localhost:3001`. Заголовок: `Content-Type: application/json`.

1. **Характеристики** — `POST /api/ai/attributes` с телом, например:
   `{"race":"Человек","className":"Воин","playStylePrompt":"танк","messages":[]}`  
   Ожидается JSON с полем `attributes` (значения только из 15,14,13,12,10,8) и `explanation`.

2. **История** — `POST /api/ai/story` с `race`, `className`, `attributes`, `playStylePrompt`, `storyPrompt` (при необходимости), `chatSummary` (опционально).  
   Ожидается `{ "story": "..." }`.

3. **Портрет (промпт)** — `POST /api/ai/portrait` с `race`, `className`, `attributes`, `story`, `appearancePrompt`.  
   Ожидается как минимум `{ "promptUsed": "...", "imageUrl": null или HTTPS URL }`. Картинка — через Replicate (`REPLICATE_API_TOKEN`, `REPLICATE_MODEL`). Если токен не задан или Replicate вернул ошибку — см. `portraitHint`.

## Проверка в Postman

Базовый URL: `http://localhost:3001` (или ваш `PORT`).

1. **GET** `/api/health` — ожидается `{ "ok": true }`.
2. **POST** `/api/auth/register` — Body → raw JSON: `{ "username": "demo", "email": "demo@mail.com", "password": "password123" }` → сохраните `token`.
3. **POST** `/api/auth/login` — `{ "email": "demo@mail.com", "password": "password123" }`.
4. **GET** `/api/auth/me` — Headers → `Authorization: Bearer <token>`.
5. **GET** `/api/races`, `/api/classes`, `/api/spells` — без токена.
6. **POST** `/api/characters` — с `Authorization: Bearer <token>`, JSON с полем `name` (остальные поля по желанию).
7. **GET** `/api/characters`, **GET** `/api/characters/:id`, **DELETE** `/api/characters/:id` — с тем же Bearer.
8. **POST** `/api/ai/attributes` — без JWT, JSON как в разделе «Ручная проверка ИИ» (нужен настроенный GigaChat в `.env`).
9. **POST** `/api/ai/story`, **POST** `/api/ai/portrait` — аналогично.
