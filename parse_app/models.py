from django.db import models


class Page(models.Model):
    url = models.URLField()
    first_img = models.CharField(max_length=255, null=True, blank=True)
    first_h1 = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, null=True, blank=True)
    celery_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "Page with url: %s" % self.url
