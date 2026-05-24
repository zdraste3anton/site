# PostgreSQL на Windows для CharacterForge API

## Результат проверки на этой машине

- Порт **localhost:5432** недоступен (`TcpTestSucceeded: false`) — сервер PostgreSQL **не слушает** порт или **не установлен**.
- Служба с именем, содержащим `postgres`, **не найдена** через `sc query`.

Без запущенного PostgreSQL команды **`npx prisma migrate dev`** и **регистрация** работать не будут.

---

## 1. Установка PostgreSQL (официально)

1. Откройте: **https://www.postgresql.org/download/windows/**
2. Скачайте установщик (рекомендуется **EDB Installer**).
3. Запустите установщик от имени администратора.
4. Запомните пароль суперпользователя **`postgres`** (в `.env` по умолчанию указано `postgres`/`postgres` — задайте такой же пароль при установке или измените `DATABASE_URL` в `server/.env`).
5. Порт оставьте **5432**.
6. Завершите установку и убедитесь, что отмечен запуск службы **PostgreSQL** при старте Windows.

---

## 2. Запуск службы вручную

1. Нажмите `Win + R`, введите **`services.msc`**, Enter.
2. Найдите службу вида **postgresql-x64-XX** (номер версии может отличаться).
3. Состояние должно быть **«Выполняется»**. Если **«Остановлена»** — ПКМ → **Запустить**.

Альтернатива (PowerShell **от администратора**), подставьте точное имя службы:

```powershell
Get-Service *postgres*
Start-Service -Name "postgresql-x64-16"
```

---

## 3. Создание базы `characterforge`

Откройте **SQL Shell (psql)** из меню Пуск или выполните (путь к `psql` может отличаться):

```text
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost
```

В консоли:

```sql
CREATE DATABASE characterforge;
\q
```

---

## 4. Дальнейшие шаги в папке `server`

```powershell
cd server
npx prisma generate
npx prisma migrate dev
npm run dev
```

Проверка: **GET** http://localhost:3001/api/health — в ответе `"ok": true` и `"db": "ok"`.

Регистрация: **POST** http://localhost:3001/api/auth/register с JSON-телом (без переносов внутри строк):

```json
{"username":"крутой","email":"rutovskajaalisa@gmail.com","password":"72tovefa17"}
```

---

## 5. Если был EPERM при `prisma generate`

Закройте все окна с `npm start` / `npm run dev` / другими `node`, затем снова:

```powershell
npx prisma generate
```
