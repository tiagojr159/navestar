export class CelestialMenu {
    constructor({ root, openButton, closeButton }) {
        this.root = root;
        this.openButton = openButton;
        this.closeButton = closeButton;

        this.tabButtons = Array.from(root.querySelectorAll('[data-celestial-tab]'));
        this.panels = {
            planets: root.querySelector('[data-celestial-panel="planets"]'),
            moons: root.querySelector('[data-celestial-panel="moons"]'),
        };

        this.onSelect = null;

        this.openButton.addEventListener('click', () => this.open());
        this.closeButton.addEventListener('click', () => this.close());
        this.root.addEventListener('click', (event) => {
            if (event.target === this.root) this.close();
        });

        for (const button of this.tabButtons) {
            button.addEventListener('click', () => this.setTab(button.dataset.celestialTab));
        }
    }

    open() {
        this.root.hidden = false;
    }

    close() {
        this.root.hidden = true;
    }

    setTab(tab) {
        for (const button of this.tabButtons) {
            const active = button.dataset.celestialTab === tab;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        }

        for (const [key, panel] of Object.entries(this.panels)) {
            panel.classList.toggle('is-active', key === tab);
        }
    }

    render({ planets, moons }) {
        this.renderList(this.panels.planets, planets);
        this.renderList(this.panels.moons, moons);
    }

    renderList(container, items) {
        container.innerHTML = '';
        for (const item of items) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'celestial__item';
            button.dataset.bodyId = item.id;

            const left = document.createElement('div');
            left.textContent = item.name;

            const meta = document.createElement('div');
            meta.className = 'celestial__meta';
            meta.textContent = item.meta;

            button.appendChild(left);
            button.appendChild(meta);

            button.addEventListener('click', () => {
                if (this.onSelect) this.onSelect(item.id);
                this.close();
            });

            container.appendChild(button);
        }
    }
}

