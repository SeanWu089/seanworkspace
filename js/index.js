// About Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const aboutClose = document.querySelector('.about-close');

    // Open modal
    aboutLink.addEventListener('click', function(e) {
        e.preventDefault();
        aboutModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    });

    // Close modal
    function closeAboutModal() {
        aboutModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    aboutClose.addEventListener('click', closeAboutModal);

    // Close modal when clicking outside
    aboutModal.addEventListener('click', function(e) {
        if (e.target === aboutModal || e.target.classList.contains('auth-overlay')) {
            closeAboutModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
            closeAboutModal();
        }
    });
}); 