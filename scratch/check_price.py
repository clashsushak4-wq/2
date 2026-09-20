import urllib.request
import json
try:
    resp = urllib.request.urlopen('http://localhost:8000/api/trade/instruments').read().decode('utf-8')
    data = json.loads(resp)
    item = next(i for i in data if i['symbol'] == '1000000BABYDOGEUSDT')
    print(json.dumps(item, indent=2))
except Exception as e:
    print(e)
