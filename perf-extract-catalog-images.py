#!/usr/bin/env python3
"""ETIB: вынимает фото ароматов из catalog.html в отдельные файлы img/*.webp.

Зачем: сейчас ~170 фото лежат прямо внутри catalog.html (base64, ~2,2 МБ), поэтому
страница каталога качается и разбирается целиком, даже если смотреть 3 карточки.
После скрипта catalog.html весит ~140 КБ, а фото грузятся по мере прокрутки (loading="lazy")
и сохраняются на телефоне для работы без сети (sw.js читает список img/list.json).

Как запускать (из папки сайта):   python3 perf-extract-catalog-images.py
    --dry-run          только показать, что будет сделано, ничего не менять
    --html ФАЙЛ        другой файл каталога (по умолчанию catalog.html рядом со скриптом)

Повторный запуск безопасен: уже вынутые фото не трогаются, вынимаются только новые
(например, добавленные через «Редактор» и сохранённые кнопкой «Скачать обновлённый каталог»).
Имя файла = ключ фото + отпечаток содержимого: img/p12-3fa94c0b1d.webp. Если картинка
поменяется — у неё будет новое имя, поэтому телефоны никогда не покажут старую.

Что меняется в catalog.html: только значения внутри блока /*PH_START*/ … /*PH_END*/
("p0":"data:image/webp;base64,…"  ->  "p0":"img/p0-3fa94c0b1d.webp"). Код страницы уже умеет
работать с такими адресами (<img src>, увеличение фото, экспорт каталога).
Только стандартная библиотека Python 3.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import sys

# блок данных фото: const PHOTOS=/*PH_START*/{…}/*PH_END*/  (строки '/*PH_START*/'+pj+… в коде экспорта не подходят — там нет «{»)
PH_RE = re.compile(r'/\*PH_START\*/(\{.*?\})/\*PH_END\*/', re.S)
ITEM_RE = re.compile(r'"([^"\\]+)":"data:image/(webp|jpeg|jpg|png|avif|gif);base64,([A-Za-z0-9+/=]+)"')
PATH_RE = re.compile(r'"(img/[^"\\]+)"')
EXT = {'webp': 'webp', 'jpeg': 'jpg', 'jpg': 'jpg', 'png': 'png', 'avif': 'avif', 'gif': 'gif'}
# формат по первым байтам — на случай, если в data: указан не тот тип
MAGIC = [(b'RIFF', 'webp'), (b'\xff\xd8\xff', 'jpg'), (b'\x89PNG', 'png'), (b'GIF8', 'gif')]


def safe_key(k):
    return re.sub(r'[^A-Za-z0-9_-]+', '_', k)[:40] or 'ph'


def sniff(data, declared):
    for sig, ext in MAGIC:
        if data.startswith(sig) and (ext != 'webp' or data[8:12] == b'WEBP'):
            return ext
    return EXT[declared]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--html', default=os.path.join(here, 'catalog.html'))
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    html_path = os.path.abspath(a.html)
    root = os.path.dirname(html_path)
    img_dir = os.path.join(root, 'img')
    with open(html_path, encoding='utf-8', newline='') as f:
        html = f.read()

    blocks = list(PH_RE.finditer(html))
    if len(blocks) != 1:
        sys.exit('Ошибка: в %s должен быть ровно один блок /*PH_START*/…/*PH_END*/ (найдено: %d)' % (html_path, len(blocks)))
    m = blocks[0]
    block = m.group(1)

    written = skipped = 0

    def repl(it):
        nonlocal written, skipped
        key, declared, b64 = it.group(1), it.group(2), it.group(3)
        data = base64.b64decode(b64, validate=True)
        ext = sniff(data, declared)
        name = '%s-%s.%s' % (safe_key(key), hashlib.sha256(data).hexdigest()[:10], ext)
        path = os.path.join(img_dir, name)
        if os.path.exists(path):
            with open(path, 'rb') as f:
                if f.read() != data:
                    sys.exit('Ошибка: %s уже есть, но с другим содержимым' % path)
            skipped += 1
        else:
            if not a.dry_run:
                os.makedirs(img_dir, exist_ok=True)
                tmp = path + '.tmp'
                with open(tmp, 'wb') as f:
                    f.write(data)
                os.replace(tmp, path)
            written += 1
        return '"%s":"img/%s"' % (key, name)

    new_block = ITEM_RE.sub(repl, block)
    left = len(re.findall(r'data:image/', new_block))
    if left:
        sys.exit('Ошибка: в блоке фото остались %d нераспознанных data:-картинок — ничего не изменено' % left)

    # проверка: блок по-прежнему корректный JSON, все пути ведут на существующие файлы
    try:
        photos = json.loads(new_block)
    except ValueError as e:
        sys.exit('Ошибка: блок фото после замены не читается как JSON (%s) — ничего не изменено' % e)
    refs = sorted({v[4:] for v in photos.values() if isinstance(v, str) and v.startswith('img/')})
    if not a.dry_run:
        missing = [r for r in refs if not os.path.exists(os.path.join(img_dir, r))]
        if missing:
            sys.exit('Ошибка: нет файлов %s' % ', '.join(missing[:5]))

    new_html = html[:m.start(1)] + new_block + html[m.end(1):]
    changed = new_html != html
    if not a.dry_run:
        if changed:
            tmp = html_path + '.tmp'
            with open(tmp, 'w', encoding='utf-8', newline='') as f:
                f.write(new_html)
            os.replace(tmp, html_path)
        os.makedirs(img_dir, exist_ok=True)
        # список для sw.js (работа без сети); пишем, только если он поменялся
        lst = json.dumps(refs, ensure_ascii=False, indent=0) + '\n'
        lp = os.path.join(img_dir, 'list.json')
        old = open(lp, encoding='utf-8').read() if os.path.exists(lp) else None
        if old != lst:
            with open(lp, 'w', encoding='utf-8') as f:
                f.write(lst)

    on_disk = set(os.listdir(img_dir)) if os.path.isdir(img_dir) else set()
    orphans = sorted(x for x in on_disk if x not in refs and x != 'list.json' and not x.endswith('.tmp'))
    print('%s%s: фото в каталоге %d, вынуто сейчас %d, уже лежали в img/ %d' % (
        '[проба] ' if a.dry_run else '', os.path.basename(html_path), len(photos), written, len(refs) - written))
    print('размер страницы: %d КБ -> %d КБ' % (len(html.encode()) // 1024, len(new_html.encode()) // 1024))
    if orphans:
        print('В img/ есть файлы, на которые каталог больше не ссылается (можно удалить вручную): %d, напр. %s'
              % (len(orphans), ', '.join(orphans[:3])))
    if not changed:
        print('catalog.html уже в нужном виде — ничего не изменено.')


if __name__ == '__main__':
    main()
