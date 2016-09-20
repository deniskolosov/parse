# parse
redis is required to run (http://redis.io/download)

pip install -r requirements.txt

python3.4 manage.py runserver:8000

celery -A parse worker -l info
