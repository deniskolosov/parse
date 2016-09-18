import json

from channels import Channel
from channels.sessions import channel_session

from parse_app.models import Page
from parse_app.tasks import parse


@channel_session
def ws_connect(message):
    message.reply_channel.send({
        "text": json.dumps({
            "action": "reply_channel",
            "reply_channel": message.reply_channel.name,
        })
    })


@channel_session
def ws_receive(message):
    try:
        data = json.loads(message['text'])
    except ValueError:
        print("ws message isn't json text=%s", message.content)
        return
    if data:
        reply_channel = message.reply_channel.name
        if data['action'] == "add_parsing_task":
            start_parsing(data, reply_channel)
        elif data['action'] == "is_processing":
            page = Page.objects.get(pk=data['page_id'])
            if page:
                Channel(reply_channel).send({
                    "text": json.dumps({
                        "action": page.status,
                        "timer_id": data['timer_id']
                    })
                })


def start_parsing(data, reply_channel):
    time_template = [item['value'] for item in data['data'] if item['name'] == 'time_template'][0]
    urls = [item['value'] for item in data['data'] if 'url' in item['name']]
    print(urls)
    for url in urls:
        page = Page(url=url)
        page.status = "delayed" if time_template else "processing"
        page.save()
        parse_task = parse.delay(page.id, reply_channel, time_template)
        page.celery_id = parse_task.id
        page.save()
        Channel(reply_channel).send({
            "text": json.dumps({
                "action": "added",
                "page_id": page.id,
                "page_url": page.url,
                "page_status": page.status,
            })
        })

