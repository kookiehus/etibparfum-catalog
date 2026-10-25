# Пересборка данных Помощника: python3 build_helper.py  (рядом index.html, tips.js, trainer-data.js, pron.js)
import re, json
def js(f, pre):
    t = open(f, encoding='utf-8').read()
    return json.loads(t[t.index(pre) + len(pre):].rstrip().rstrip(';'))
tips = js('tips.js', 'window.TIPS='); tr = js('trainer-data.js', 'window.TR='); pron = js('pron.js', 'window.PRON=')
ar = []
for a in tr:
    t = tips.get(a['c'] + '|' + a['n'], {})
    ar.append({'n': a['n'], 'nm': a['nm'], 'ru': pron.get(a['nm'], ''), 'c': a['c'], 't': a['t'],
               'top': a['top'], 'heart': a['heart'], 'base': a['base'],
               'how': t.get('how', ''), 'whom': t.get('whom', ''), 'pitch': t.get('pitch', ''), 'hooks': t.get('hooks', []), 'sim': t.get('sim', [])})
h = open('index.html', encoding='utf-8').read()
i = h.index('const IDX=') + 10
dec = json.JSONDecoder(); idx, _ = dec.raw_decode(h[i:])
sec = [{'s': x['s'], 'tile': x['tile'], 'n': x['n'], 'k': x.get('k', ''), 'x': x.get('x', ''), 'u': x.get('u', '')} for x in idx]
s = open('sales.html', encoding='utf-8').read()
s = re.sub(r'data:[a-z/+;0-9-]+;base64,[A-Za-z0-9+/=]+', '', s)
DL = json.JSONDecoder().raw_decode(s[s.index('const DL=') + 9:])[0]
bt = {v[1]: (k, v[0]) for k, v in DL.items()}
tx = lambda x: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', x)).strip()
qa = []; cur = ''
for m in re.finditer(r'<h2>(.*?)</h2>|<details(?: [^>]*)?><summary>((?:(?!<h2>).)*?)</summary><div[^>]*>(.*?)</div></details>', s, re.S):
    if m.group(1) is not None: cur = tx(m.group(1)); continue
    q, a = tx(m.group(2)), tx(m.group(3))
    if len(a) < 15: continue
    sl = bt.get(cur)
    qa.append({'q': q, 'a': a, 'sec': cur, 'u': ('sales.html#%s/%s' % (sl[1], sl[0])) if sl else 'sales.html'})
print(len(qa), 'вопросов-ответов из шпаргалки')
json.dump({'aromas': ar, 'sections': sec, 'qa': qa}, open('helper-data.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(ar), 'ароматов,', len(sec), 'разделов'); print(sorted({a['t'] for a in ar}), sorted({a['c'] for a in ar}))
