import json
from datetime import datetime
import time

import bs4
import croniter
import requests
from channels import Channel

from parse.celery import app
from parse_app.models import Page


@app.task(bind=True)
def parse(self, job_id, reply_channel, time_template=None):
    if time_template:
        exec_in = execute_in(time_template)
        time_template = None
        raise self.retry(args=(job_id, reply_channel, time_template),
                         exc=Exception, countdown=exec_in)
    page = Page.objects.get(pk=job_id)
    time.sleep(1)  # for convenience

    response = requests.get(page.url)
    soup = bs4.BeautifulSoup(response.text)
    first_img = soup.img.attrs['src'] if soup.img else ''
    first_h1 = soup.h1.text if soup.h1 else None
    title = soup.title.text

    if "http" not in first_img:
        first_img = page.url + '/' + first_img

    page.status = "parsed"
    page.save()

    if reply_channel is not None:
        Channel(reply_channel).send({
            "text": json.dumps({
                "action": "parsed",
                "page_id": page.id,
                "page_url": page.url,
                "page_status": page.status,
                "first_img": first_img,
                "first_h1": first_h1,
                "title": title
            })
        })


def execute_in(time_template):
    now = datetime.now()
    cron = croniter.croniter(time_template, now)
    next_exec = cron.get_next()
    return int(next_exec - now.timestamp())
