// <chary-nav> navbar component
class CharyNav extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Hello, World!';
    }
}

customElements.define('chary-nav', CharyNav);