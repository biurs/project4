from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    poster = models.ForeignKey('User', on_delete=models.CASCADE, related_name='posts')
    body = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "posterid": self.poster.id,
            "poster": self.poster.username,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%-I:%M %p • %b %-d, %Y"),
            'likes': self.likes.count()
        }

class Like(models.Model):
    liker = models.ForeignKey('User', on_delete=models.CASCADE, related_name="liked_posts")
    likedpost = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='likes')

class Follow(models.Model):
    followed = models.ForeignKey('User', on_delete=models.CASCADE, related_name='following')
    follower = models.ForeignKey('User', on_delete=models.CASCADE, related_name='followed_by')