from django.shortcuts import render


def index(request):
    return render(request, 'parse_app/index.html')