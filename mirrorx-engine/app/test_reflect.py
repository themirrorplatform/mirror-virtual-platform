import requests

BASE='http://127.0.0.1:8000'

r = requests.post(f'{BASE}/api/user/create', json={'name':'Test Local User'})
print(r.status_code, r.text)
if r.status_code==200:
    data=r.json()
    user_id=data.get('user_id')
    print('user_id:', user_id)
    ref = requests.post(f'{BASE}/api/reflect', json={'user_id':user_id,'reflection_text':'This is a short reflection for testing the mirrorback.'})
    print('reflect status:', ref.status_code)
    print(ref.text)
else:
    print('Failed to create user')
