// Makes the intro div in the middle of the page upon resize
function resizeWindowReset() { 
    
    let divHeight = $('#main-container').height() / 2.0;
    let headerHeight = $("#top-bar").height();
    let windowHeight = $(window).height() / 2.0;
    let finalHeight = windowHeight - (divHeight + headerHeight);

    $('#main-container').css('margin-top', `${finalHeight}px`);
    $('#main-container').css('margin-bottom', `${windowHeight}px`);
}

// Checks if an element is within viewport.
function elementWithinViewport(elem) {
    let elemTop = $(elem).offset().top;
    let elemBot = elemTop + $(elem).outerHeight();
    let screenTop = $(window).scrollTop();
    let screenBot = screenTop + $(window).innerHeight();

    return (screenBot > elemTop) && (screenTop < elemBot);
}

$(document).ready(function() {
    resizeWindowReset();
    window.onresize = resizeWindowReset;
    $("#recidivism-link").on("click", () => {
    })

    // Animation upon scrolling learned from:
    // https://scotch.io/tutorials/level-up-your-websites-with-animatecss
    $(window).scroll(function () {
        // Resets so that animation is played again when seen again
        $('.animate__animated').each(function() {
            if (!this.classList.contains('await-animation') && !elementWithinViewport(this)) {
                $(this).addClass('await-animation');
                $(this).removeClass('animate__animated');
                $(this).removeClass('animate__fadeInDown');
            }
        })
        
        $('.await-animation').each(function() {
            if (elementWithinViewport(this)) {
                $(this).addClass('animate__animated');
                $(this).addClass('animate__fadeInDown');
                $(this).removeClass('await-animation');
            }
        })
    })
});