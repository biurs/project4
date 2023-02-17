document.addEventListener('DOMContentLoaded', function() {

    console.log('loadpage')
    //by default load all posts
    make_post();
    load_posts();

});

function make_post() {

    const bodyform = document.querySelector('#body-form');
    const submit = document.querySelector('#post-form');

    submit.onsubmit = function() {
        console.log('post request')
        fetch('/posts', {
            method: 'POST',
            body: JSON.stringify({
                body: bodyform.value
            })
        })
        .then(response => {
            response.json()
            load_posts()
        })
        .then(result => {
            console.log(result)
        })
        bodyform.value = '';
        return false;
    }



}

function load_posts() {

    console.log('loadpost')

    document.querySelector('#post-box').innerHTML = '';
    
    
    const currenturl = window.location.href

    fetch(`posts/all`)
    .then(response => response.json())
    .then(posts => {
        console.log(posts)

        //create a div for each post
        posts.forEach(post => {

            const postbox = document.querySelector('#post-box');
            const postdiv = document.createElement('div');
            postdiv.className = 'post-div';

            postdiv.innerHTML = `${post.id}, ${post.posterid}<br><b>${post.poster}:</b> ${post.body}, ${post.likes} likes, posted on: ${post.timestamp}`

            postbox.append(postdiv)
        })
    })
}