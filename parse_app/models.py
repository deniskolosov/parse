from django.db import models


class Page(models.Model):
    url = models.URLField()
    content = models.TextField(null=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    celery_id = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "Page with url: %s" % self.url
