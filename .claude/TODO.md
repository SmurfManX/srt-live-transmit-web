# SRT Manager - TODO / Progress

## Дата: 2026-01-28

---

## СДЕЛАНО:

### 1. Очистка проекта
- Удалены: `app.py`, `requirements.txt`, `screenshots/`, `static/`, `backend.log`, `frontend.log`
- Удалены лишние скрипты: `restart_all.sh`, `start_backend.sh`, `start_frontend.sh`, `start_simple.sh`
- Осталось только нужное: `backend/`, `frontend/`, `start_all.sh`, `stop_all.sh`, `build_production.sh`

### 2. Dark Mode
- Файл: `frontend/src/app/providers.tsx`
- Тема сохраняется в localStorage (`themeMode`)
- При загрузке страницы применяется сохранённая тема

### 3. Таблица каналов (frontend/src/app/page.tsx)
- Новые колонки: **Bitrate**, **RTT** (из SRT статистики)
- Колонка **PID** показывает все PID для multi-destination каналов
- Удалён блок **Media Info** и колонка **Started**
- Данные обновляются каждые 5 секунд

### 4. SRT Аналитика (бэкенд)
- Новый сервис: `backend/app/services/srt_stats_service.py`
  - `parse_srt_stats_csv()` - парсинг CSV статистики
  - `get_srt_connections()` - получение соединений через `ss`
  - `get_combined_channel_info()` - объединение всех данных

- Новые API endpoints в `backend/app/api/channels.py`:
  - `GET /api/channels/{name}/full-info` - полная инфо о канале
  - `GET /api/channels/analytics/summary` - сводка по всем каналам

### 5. Frontend API (frontend/src/lib/api.ts)
- Добавлены типы: `SrtStats`, `ChannelFullInfo`, `AnalyticsSummary`
- Добавлены методы: `getFullInfo()`, `getAnalyticsSummary()`

---

## ПРОБЛЕМА - SRT статистика пустая:

### Симптомы:
- CSV файлы статистики создаются но пустые (0 bytes)
- SRT клиент не может подключиться к `srt://127.0.0.1:9102`
- Входящий UDP multicast поток есть (tcpdump показывает трафик)

### Текущие процессы:
```
PID 1951982: udp://233.23.23.100:23100 → srt://0.0.0.0:9102 (listener)
PID 1951983: udp://233.23.23.100:23100 → udp://233.23.23.101:23100
PID 1951984: udp://233.23.23.100:23100 → srt://0.0.0.0:9302 (listener)
```

### Возможные причины:
1. Multicast input требует правильный `adapter` параметр
2. SRT handshake не происходит - возможно firewall
3. srt-live-transmit не получает UDP пакеты (binding issue)

### Как проверить:
```bash
# Проверить UDP трафик
tcpdump -i any udp port 23100

# Проверить SRT сокеты
ss -unap | grep srt-live

# Попробовать подключиться внешним клиентом
ffplay "srt://207.180.240.247:9102?mode=caller"
```

---

## TODO:

1. [ ] Разобраться почему SRT статистика не записывается
2. [ ] Проверить multicast binding (adapter parameter)
3. [ ] Протестировать с внешним SRT клиентом (VLC, ffplay)
4. [ ] Добавить remote client IP в статистику
5. [ ] Показывать connection/disconnection события из логов

---

## Полезные команды:

```bash
# Запуск проекта
cd /project/srt-live-transmit-web && ./start_all.sh

# Проверка процессов
ps aux | grep srt-live-transmit

# Проверка статистики
ls -la backend/static/stats/*.csv

# Логи
tail -f logs/backend.log
```

---

## Конфигурация тестового канала:

```json
{
  "channel_name": "adjara-tv",
  "input_protocol": "udp",
  "input_ip": "233.23.23.100",
  "input_port": 23100,
  "output_protocol": "srt",
  "output_port": 9000,
  "mode": "listener"
}
```
