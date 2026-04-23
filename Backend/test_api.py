import urllib.request, json
req = urllib.request.Request(
    'http://localhost:8000/soap/process_raw',
    data=b'{"raw_text": "Patient has a severe headache"}',
    headers={'Content-Type': 'application/json'}
)
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode('utf-8'))
