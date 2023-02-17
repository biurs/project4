import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt


from .models import User, Post, Like, Follow


def index(request):
    return render(request, "network/index.html")


@csrf_exempt
@login_required
def new_post(request):
    
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'})

    
    data = json.loads(request.body)
    body = data.get('body', '')
    post = Post(
        poster = request.user,
        body = body
    )
    post.save()

    return JsonResponse({'message': 'Posted successfully'}, status=201)


def postbox(request, postbox):
    if postbox == 'all':
        posts = Post.objects.all()
    else:
        userid = postbox
        posts = Post.objects.filter(
            poster = userid
        )

    posts = posts.order_by('-timestamp').all()
    return JsonResponse([post.serialize() for post in posts], safe=False)

def profilebox(request, userid):
    posts = Post.objects.filter(
        poster = userid
    )

    posts = posts.order_by('-timestamp').all()
    return JsonResponse([post.serialize() for post in posts], safe=False)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def load_profile(request, userid):
    return render(request, "network/profile.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
