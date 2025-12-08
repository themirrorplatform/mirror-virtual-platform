import requests
BASE='http://127.0.0.1:8000'
# create user
r = requests.post(f'{BASE}/api/user/create', json={'name':'History Test User'})
print('create:', r.status_code, r.text)
if r.status_code!=200:
    raise SystemExit(1)
user_id = r.json().get('user_id')
# add a reflection via reflect endpoint
ref = requests.post(f'{BASE}/api/reflect', json={'user_id':user_id,'reflection_text':'Testing themes: I feel curious about learning, practice, and patience.'})
print('reflect:', ref.status_code, ref.text)
# call history
h = requests.get(f'{BASE}/api/user/{user_id}/history')
print('history:', h.status_code, h.text)
