
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        fetch('/partials/delayed-content.ejs')
            .then(response => response.text())
            .then(html => {
                document.getElementById('delayed-content-placeholder').innerHTML = html;
            })
            .catch(error => console.error('Error loading delayed content:', error));
    }, 1000); // 1-second delay
});
