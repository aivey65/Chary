function configureLanding() {
    fillProfilePics();
    configureHeight();
}

function downAction() {
    document.getElementById('landing-info').scrollIntoView();
}

function configureHeight() {
    adjustHeroHeight();

    window.addEventListener('resize', () => {
        adjustHeroHeight();
    });
}

function adjustHeroHeight() {
    vh = window.innerHeight;
    hero = document.getElementById('landing-hero');
    header = document.getElementById('header-container');

    hero.style.height = vh - header.offsetHeight + 'px'
}