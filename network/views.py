import json
import math
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator



from .models import User, Post, Like, Follow


def index(request):
    #calculates the amount of pages
    pagecount = math.ceil(Post.objects.all().count() / 10)
    return render(request, "network/index.html", {
        'pagecount': range(1,pagecount+1)
    })

def following(request):

    pagecount = math.ceil(Post.objects.filter(poster__following__follower=request.user).count() / 10)
    return render(request, "network/following.html", {
        'pagecount': range(1,pagecount+1)
    })

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


def postbox(request, postbox, pagenum=None):
    if postbox == 'all':
        posts = Post.objects.all()
    elif postbox == 'following':
        posts = Post.objects.filter(poster__following__follower=request.user)
    
                

    posts = posts.order_by('-timestamp').all()
    p = Paginator(posts, 10)

    if pagenum == None:
        pagetoload = 1
    else:
        pagetoload = pagenum
    posts = p.page(pagetoload)
    posts = posts.object_list
    return JsonResponse([post.serialize() for post in posts], safe=False)


def profilebox(request, userid, pagenum=None):
    posts = Post.objects.filter(poster = userid)

    posts = posts.order_by('-timestamp').all()
    p = Paginator(posts, 10)

    if pagenum == None:
        pagetoload = 1
    else:
        pagetoload = pagenum
    posts = p.page(pagetoload)
    posts = posts.object_list
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

    #make a variable for is on own profile
    if request.user.id == userid:
        isuser = True
    else:
        isuser = False

    profuser = User.objects.get(id=userid)
    if request.user.is_authenticated:
        myuser = User.objects.get(id=request.user.id)
        isfollow = Follow.objects.filter(follower=myuser, followed=profuser).exists()
    else:
        isfollow = False

    user = User.objects.get(
        id = userid
    )
    username = user.username

    pagecount = math.ceil(Post.objects.filter(poster = userid).count() / 10)

    return render(request, "network/profile.html", {
        'username': username,
        'isuser': isuser,
        'isfollow': isfollow,
        'pagecount': range(1, pagecount+1)
    })


@csrf_exempt
@login_required
def follow(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'})

    
    data = json.loads(request.body)
    followedid = data.get('followed', '')
    followstate = data.get('follow', '')
    followed = User.objects.get(id=followedid)
    if followstate:
        follow = Follow(
            follower = request.user,
            followed = followed
        )
        follow.save()
        return JsonResponse({'message': 'Followed successfully'}, status=201)
    else:
        Follow.objects.filter(follower=request.user, followed=followed).delete()
        return JsonResponse({'message': 'Unfollowed successfully'}, status=201)




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
