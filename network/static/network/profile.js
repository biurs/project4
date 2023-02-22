const userid = JSON.parse(document.getElementById('data-userid').textContent);
const userauth = JSON.parse(document.getElementById('data-userauth').textContent);


document.addEventListener('DOMContentLoaded', function() {

    console.log('loadpage')
    const isuser = JSON.parse(document.getElementById('data-isuser').textContent);

    
    followbutton = document.querySelector('#follow')
    //checks if the profile page is yours
    //if true, allows you to make a post
    //checks if you are following this profile and allow to follow/unfollow
    if (isuser === true) {
        make_post();
    } else {
        const isfollow = JSON.parse(document.getElementById('data-isfollow').textContent);
        if (isfollow === true) {
            followbutton.innerHTML = "Unfollow"
            followbutton.onclick = function() {
                follow(followbutton.innerHTML)
            }
        } else {
            if (followbutton != null) {
                followbutton.innerHTML = "Follow"
                followbutton.onclick = function() {
                    follow(followbutton.innerHTML)
                }
            }
        }
    }

    load_posts(1);


    //for each pagenumber button in pagintor, if they are clicked on, load posts for that page
    var pagenum = document.querySelectorAll('.page-num')
    pagenum.forEach(element => {
        element.onclick = function() {
            pagenum = element.innerHTML
            load_posts(pagenum)
        }
    });
    

});

function make_post() {

    //variables for content of new post and submit buttom
    const bodyform = document.querySelector('#body-form');
    const submit = document.querySelector('#post-form');

    //on submit make an api post with post body then reload posts, clear contents of textbox, and
    // return false to stop page from reloading
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
            load_posts(1)
        })

        bodyform.value = '';
        return false;
    }



}

function load_posts(pagenum) {

    console.log('loadpost')

    document.querySelector('#post-box').innerHTML = '';
    
    //handles the html buttons for the paginator
    changepage(pagenum)

    const url = new URL(window.location.href)
    profileid = url.pathname.slice(9)

    console.log(profileid)
    //api path that returns all posts for this pagenum
    fetch(`posts/${profileid}/${pagenum}`)
    .then(response => response.json())
    .then(posts => {
        //create a div for each post and format into html
        posts.forEach(post => {

            const postbox = document.querySelector('#post-box');

            const postdiv = document.createElement('div');
            postdiv.className = 'post-div';

            const namediv = document.createElement('div');
            namediv.className = 'name-div';

            const bodydiv = document.createElement('div');
            bodydiv.className = 'body-div';

            const infodiv = document.createElement('div');
            infodiv.className = 'info-div';

            namediv.innerHTML = `<b>${post.poster}:</b>`
            bodydiv.innerHTML = `${post.body}`
            infodiv.innerHTML = `${post.likes} likes, posted on: ${post.timestamp}`

            postdiv.append(namediv, bodydiv, infodiv)

            //if post belongs to user allow them to edit it
            if (userid == post.posterid) {
                const editbutton = document.createElement('button');
                editbutton.className = 'btn btn-primary'
                editbutton.innerHTML = 'Edit'
                postdiv.append(editbutton)
                editbutton.onclick = function() {

                    //on click of edit button: remove button, create a textarea with contents the post-body, and remove post-body
                    postdiv.removeChild(editbutton)
                    var editarea = document.createElement('textarea');
                    editarea.className = 'edit-area';
                    editarea.innerHTML = bodydiv.innerHTML
                    postdiv.replaceChild(editarea, bodydiv)

                    //create a save changes button
                    const postedit = document.createElement('button');
                    postedit.className = 'btn btn-primary'
                    postedit.innerHTML = 'Save Changes'
                    postdiv.append(postedit)
                    postedit.onclick = function() {
                        //submit json to edit body of post, checks that body is not blank
                        fetch(`/posts`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                body: editarea.value,
                                id: post.id
                            })
                          })
                        //if textarea is blank treats 
                        if (editarea.value != '') {
                            bodydiv.innerHTML = editarea.value
                        }
                        postdiv.replaceChild(bodydiv, editarea)
                        postdiv.replaceChild(editbutton, postedit)
                        postdiv.removeChild(canceledit)

                    }

                    //create a cancel edit button
                    const canceledit = document.createElement('button');
                    canceledit.className = 'btn btn-primary'
                    canceledit.innerHTML = 'Cancel'
                    postdiv.append(canceledit)
                    canceledit.onclick = function() {

                        postdiv.replaceChild(bodydiv, editarea)
                        postdiv.replaceChild(editbutton, postedit)
                        postdiv.removeChild(canceledit)

                    }
                }
            }

            if (userauth === true) {
                const likebutton = document.createElement('button');
                likebutton.className = 'btn btn-primary'
                if (post.liked === 'false') {
                    var likestate = 'Like'
                } else {
                    var likestate = 'Unlike'
                }
                likebutton.innerHTML = likestate
                postdiv.append(likebutton)
                //onclick the button sends a json request which creates a new like object
                likebutton.onclick = function() {

                    fetch(`/like`, {
                        method: 'POST',
                        body: JSON.stringify({
                            likedpost: post.id,
                            like: likestate
                        }) 
                    })
                    .then(response => response.json())
                    //after new like object is created, makes an api request for the updated total of likes on the post
                    .then(result => {
                        fetch(`/like/${post.id}`)
                        .then(response => response.json())
                        .then(result => {
                            console.log(`likecount: ${result.likecount}`)
                            infodiv.innerHTML = `${result.likecount} likes, posted on: ${post.timestamp}`
                        })
                    })

                    //toggle like/unlike text when user likes or unlikes
                    if (likestate === 'Like') {
                        likestate = 'Unlike'
                    } else {
                        likestate = 'Like'
                    }
                    likebutton.innerHTML = likestate
                }
            }

            //add all the posts to postbox
            postbox.append(postdiv)
        })
    })

    //create variables for each list 
    var nextlist = document.getElementById('click-next')
    var prevlist = document.getElementById('click-prev')

    //if nextbutton is enabled, make an onclick that loads the next page. else remove any onlick
    if (nextlist.getAttribute('aria-disabled') !== "true") {
        nextlist.onclick = function() {
            curpage = parseInt(pagenum) + 1
            load_posts(curpage)
        }
    } else {
        nextlist.onclick = function() {
            return false
        }
    }

    //if prevbutton is enabled, make an onclick that loads the prev page. else remove any onlick
    if (prevlist.getAttribute('aria-disabled') !== "true") {
        console.log('prevavail')
        prevlist.onclick = function() {
            curpage = parseInt(pagenum) - 1
            load_posts(curpage)
        }
    } else {
        console.log('diable prev')
        prevlist.onclick = function() {
            return false
        }
    }
}

function changepage(pagenum) {
    //function that handles the html disabling and enabling when the page is changed

    //calculates the total number of pages
    pagecount = document.getElementsByClassName('page-num').length
    var pageint = parseInt(pagenum)


    //if more than 10 pages, display 10 pages, else display 1-pagecount
    if (pagecount > 10) {
        //if currentpage > 5, display from currentpage -4 to currentpage +5, else display 1-10
        if (pageint > 5) {
            //if currantpage + 5 less than pagecount display -4 to +5, else display last 10 pages
            if (pageint + 5 <= pagecount) {
                var pagestart = pageint - 4
                var pageend = pageint + 5
            } else {
                var pagestart = pagecount - 9
                var pageend = pagecount
            }
        } else {
            var pagestart = 1
            var pageend = 10
        }
    } else {
        var pagestart = 1
        var pageend = pagecount
    }
    //create an array from pagestart to pageend
    var loadedpages = range(pagestart, pageend)

    //for each element with pagelist class, only display if it is in the array of pages
    document.querySelectorAll('.page-list').forEach(page => {
        var listnumber = parseInt(page.getAttribute('value'))
        if (loadedpages.includes(listnumber)) {
            page.style.display = 'block'
        } else {
            page.style.display = 'none'
        }
    })
    


    //remove active class from all page lists and buttons
    var activepage = document.querySelector('.page-item.active')
    if (activepage != null){
        activepage.classList.remove('active')
    }
    var activelist = document.querySelector('.page-link.active-page')
    if (activepage != null){
        activelist.classList.remove('active-page')
    }

    //adds active tag to new currant page numbers and links
    console.log(pagenum)
    document.querySelector(`#page-list-${pagenum}`).classList.add('active')
    document.querySelector(`#page-link-${pagenum}`).classList.add('active-page')


    //creates variables for each list and button in paginator
    var nextbutton = document.getElementById('page-next')
    var prevbutton = document.getElementById('page-prev')

    var nextlist = document.getElementById('click-next')
    var prevlist = document.getElementById('click-prev')



    
    //if currentpage is less than total page count, next button is enabled
    if (pagenum < pagecount) {
        nextlist.setAttribute('aria-disabled', 'false')
        nextbutton.classList.remove('disabled')
    } else {
        nextlist.setAttribute('aria-disabled', 'true')
        nextbutton.classList.add('disabled')
    }


    //if currentpage is greater than 1, prev button is enabled
    if (pagenum > 1) {
        prevlist.setAttribute('aria-disabled', 'false')
        prevbutton.classList.remove('disabled')
    } else {
        prevlist.setAttribute('aria-disabled', 'true')
        prevbutton.classList.add('disabled')
    }

}

function range(min, max) {
    //helper function to create an array from min-max
    var len = max - min + 1;
    var arr = new Array(len)
    for (var i=0; i<len; i++) {
        arr[i] = min + i;
    }
    return arr;
}

function follow(state) {
    //puts a json post with profile you are on's id, if state is follow then the follow value is true, else it is false
    if (state === "Follow") {

        //uses url of page to get userid
        const url = new URL(window.location.href)
        profileid = url.pathname.slice(9)

        fetch(`/follow`, {
            method: 'POST',
            body: JSON.stringify({
                followed: profileid,
                follow: true
            }) 
        })
        .then(response => response.json())
        .then(result => {
            console.log(result)
        })
        followbutton.innerHTML = "Unfollow"
        return false;
    } else {

        console.log('unfollow')
        const url = new URL(window.location.href)
        profileid = url.pathname.slice(9)

        fetch(`/follow`, {
            method: 'POST',
            body: JSON.stringify({
                followed: profileid,
                follow: false
            }) 
        })
        .then(response => response.json())
        .then(result => {
            console.log(result)
        })
        followbutton.innerHTML = "Follow"
        return false;
    }
}