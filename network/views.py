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
    #view of default page, all posts

    #pagecount calculated how many pages of 10 posts the paginator should display
    pagecount = math.ceil(Post.objects.all().count() / 10)

    return render(request, "network/index.html", {
        'pagecount': range(1,pagecount+1),
        'userid': request.user.id
    })


def following(request):
    #view of following tab

    #pagecount calculates how many pages of 10 posts the paginator should display
    pagecount = math.ceil(Post.objects.filter(poster__following__follower=request.user).count() / 10)

    return render(request, "network/following.html", {
        'pagecount': range(1,pagecount+1),
        'userid': request.user.id
    })


@csrf_exempt
@login_required
def new_post(request):
    #takes json formatted post and creates a Post in the db
    if request.method == 'PUT':
        data = json.loads(request.body)
        if data.get("body") is not None and data['body'] != '':
            post = Post.objects.get(pk=data.get("id"))
            post.body = data["body"]
            post.save()
            return HttpResponse(status=204)
        else:
            return JsonResponse({'error': 'empty body'})

    elif request.method != 'POST':
        return JsonResponse({'error': 'POST request required'})
    
    else:
        data = json.loads(request.body)
        body = data.get('body', '')
        post = Post(
            poster = request.user,
            body = body
        )
        post.save()

        return JsonResponse({'message': 'Posted successfully'}, status=201)


def postbox(request, postbox, pagenum=None):
    #takes a get request and returns array of json formatted posts, loads up to 10 posts at a time
    if postbox == 'all':
        posts = Post.objects.all()
    elif postbox == 'following':
        posts = Post.objects.filter(poster__following__follower=request.user)
    
                
    #sort posts by most recent
    posts = posts.order_by('-timestamp').all()

    #posts are organized in pages of 10 posts
    p = Paginator(posts, 10)

    #if no pagenumber specificed assume first page
    if pagenum == None:
        pagetoload = 1
    else:
        pagetoload = pagenum

    posts = p.page(pagetoload)
    posts = posts.object_list
    postarray = []
    for post in posts:
        serialized = post.serialize()
        if Like.objects.filter(likedpost__id=serialized['id'], liker__id=request.user.id).exists():
            serialized['liked'] = 'true'
        else:
            serialized['liked'] = 'false'
        postarray.append(serialized)
    return JsonResponse(postarray, safe=False)


def profilebox(request, userid, pagenum=None):
    #takes a get request with a userid and returns array of json formatted posts from that user, loads up to 10 posts at a time
    posts = Post.objects.filter(poster = userid)

    posts = posts.order_by('-timestamp').all()
    p = Paginator(posts, 10)

    if pagenum == None:
        pagetoload = 1
    else:
        pagetoload = pagenum
        
    posts = p.page(pagetoload)
    posts = posts.object_list

    postarray = []
    for post in posts:
        serialized = post.serialize()
        if Like.objects.filter(likedpost__id=serialized['id'], liker__id=request.user.id).exists():
            serialized['liked'] = 'true'
        else:
            serialized['liked'] = 'false'
        postarray.append(serialized)
    return JsonResponse(postarray, safe=False)


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
    #load profile of user based on id

    #make a variable for is on own profile
    isuser = (request.user.id == userid)


    # creates 2 veriables to check if the profile belongs to viewer and if viewer is following the profile
    profileuser = User.objects.get(id=userid)
    if request.user.is_authenticated:
        myuser = User.objects.get(id=request.user.id)
        isfollow = Follow.objects.filter(follower=myuser, followed=profileuser).exists()
    else:
        isfollow = False

    #gets username based on userid
    user = User.objects.get(
        id = userid
    )
    username = user.username

    #pagecount calculated how many pages of 10 posts the paginator should display
    pagecount = math.ceil(Post.objects.filter(poster = userid).count() / 10)

    return render(request, "network/profile.html", {
        'username': username,
        'isuser': isuser,
        'isfollow': isfollow,
        'pagecount': range(1, pagecount+1),
        'userid': request.user.id
    })


@csrf_exempt
@login_required
def follow(request):
    #takes posts json string and creates/deleted follow
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'})

    
    data = json.loads(request.body)

    #id of user being followed/unfollowed
    followedid = data.get('followed', '')
    #true if follow, false if unfollowed
    followstate = data.get('follow', '')
    followed = User.objects.get(id=followedid)
    
    #if following create a new follow object, else delete an existing follow object then give according jsonresponse
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


@csrf_exempt
@login_required
def like(request):
    #takes posts json string and creates/deleted follow
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'})

    
    data = json.loads(request.body)

    #id of user being followed/unfollowed
    postid = data['likedpost']
    #true if follow, false if unfollowed
    likestate = data['like']
    likedpost = Post.objects.get(id=postid)
    
    #if liking create a new like object, else delete an existing like object then give according jsonresponse
    if likestate == 'Like':
        like = Like(
            liker = request.user,
            likedpost = likedpost
        )
        like.save()
        return JsonResponse({'message': 'liked successfully'}, status=201)
    else:
        Like.objects.filter(liker=request.user, likedpost=likedpost).delete()
        return JsonResponse({'message': 'Unliked successfully'}, status=201)


def like_count(request, postid):
    likedpost = Post.objects.get(pk=postid)
    likecount = likedpost.likes.count()
    likedict = {'likecount': likecount}
    return JsonResponse(likedict, safe=False)



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
