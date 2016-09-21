from django.core import serializers
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.http.response import JsonResponse
from django.shortcuts import render

from parse_app.models import Page


def index(request):
    pages_list = Page.objects.order_by('-created_at')
    paginator = Paginator(pages_list, 3)

    if request.is_ajax():
        page_number = request.GET.get('page_number')

        try:
            pages = paginator.page(page_number)
        except PageNotAnInteger:
            pages = []
        except EmptyPage:
            pages = []

        if not pages:
            return JsonResponse({"pages": pages})

        data = {"pages": [{"url": page.url,
                           "img": page.first_img,
                           "status": page.status,
                           "title": page.title,
                           "first_h1": page.first_h1,
                           "page_id": page.id}
                          for page in pages.object_list]}

        return JsonResponse(data)

    pages = paginator.page(1)
    return render(request, 'parse_app/index.html', context={"pages": pages})
