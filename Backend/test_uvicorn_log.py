import subprocess
import time
import urllib.request

process = subprocess.Popen([r'.\venv\Scripts\python.exe', '-m', 'uvicorn', 'main:app', '--port', '8001'], stderr=subprocess.PIPE, stdout=subprocess.PIPE)
time.sleep(5)

try:
    req = urllib.request.Request(
        'http://localhost:8001/soap/process_raw',
        data=b'{"raw_text": "Patient has a severe headache"}',
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req)
except Exception as e:
    pass

process.terminate()
out, err = process.communicate()
print("STDOUT:", out.decode('utf-8', errors='ignore'))
print("STDERR:", err.decode('utf-8', errors='ignore'))
