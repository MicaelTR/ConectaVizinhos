const menuToggle = document.getElementById('menu-toggle');


menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
});