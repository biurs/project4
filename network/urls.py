
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<int:userid>", views.load_profile, name='profile'),

    #API routes
    path('posts', views.new_post, name='newpost'),
    path('posts/<str:postbox>', views.postbox, name='postbox'),
    path('profile/posts/<int:userid>', views.profilebox, name='userpost')

]

