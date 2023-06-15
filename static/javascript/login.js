////////////////////
// Scroll Paralax //
////////////////////
// Paralax scrolling method adapted from https://stackoverflow.com/questions/29240028/css-make-a-background-image-scroll-slower-than-everything-else
window.addEventListener('scroll', () => {
    const scrolltotop = window.pageYOffset;
    var factor = -0.5;
    var yvalue = scrolltotop * factor;
    document.body.style.backgroundPosition = "left " + yvalue + "px";
});