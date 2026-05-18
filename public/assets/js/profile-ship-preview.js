const previews = [...document.querySelectorAll('[data-css-ship-preview]')];

for (const preview of previews) {
    const body = preview.querySelector('.css-ship-preview__body');
    if (!body) continue;

    preview.addEventListener('pointermove', (event) => {
        const rect = preview.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 90;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -70;
        body.style.animation = 'none';
        body.style.transform = `rotateX(${58 + y}deg) rotateZ(${x}deg) rotateY(${x * 1.8}deg)`;
    });

    preview.addEventListener('pointerleave', () => {
        body.style.animation = '';
        body.style.transform = '';
    });
}
