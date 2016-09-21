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
def parse(self, page_id, reply_channel, time_template=None):
    # delay parsing
    if time_template:
        exec_in = execute_in(time_template)
        time_template = None
        raise self.retry(args=(page_id, reply_channel, time_template),
                         exc=Exception, countdown=exec_in)
    page = Page.objects.get(pk=page_id)
    time.sleep(2)  # to have time to stop task

    response = requests.get(page.url)
    soup = bs4.BeautifulSoup(response.text)

    first_img = soup.img.attrs['src'] if soup.img else ''
    if "http" not in first_img:
        first_img = page.url + '/' + first_img
    page.first_img = first_img
    page.first_h1 = soup.h1.text if soup.h1 else None
    page.title = soup.title.text

    page.status = "parsed"
    page.save()

    if reply_channel is not None:
        Channel(reply_channel).send({
            "text": json.dumps({
                "action": "parsed",
                "page_id": page.id
            })
        })


def execute_in(time_template):
    now = datetime.now()
    cron = croniter.croniter(time_template, now)
    next_exec = cron.get_next()
    return int(next_exec - now.timestamp())
