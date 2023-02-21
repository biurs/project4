document.addEventListener('DOMContentLoaded', function() {

    console.log('loadpage')
    //by default load all posts

    //copies user.is_authenticated variable into script
    const userauth = JSON.parse(document.getElementById('data-userauth').textContent);

    if (userauth) {
        make_post();
    }
    //by default load first page
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

    //api path that returns all posts for this pagenum
    fetch(`posts/following/${pagenum}`)
    .then(response => response.json())
    .then(posts => {
        //create a div for each post and format into html
        posts.forEach(post => {

            const postbox = document.querySelector('#post-box');
            const postdiv = document.createElement('div');
            postdiv.className = 'post-div';

            postdiv.innerHTML = `<a href="profile/${post.posterid}"><b>${post.poster}:</b></a>
            ${post.body} <br> ${post.likes} likes, posted on: ${post.timestamp}`

            //add new div to end of postbox
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