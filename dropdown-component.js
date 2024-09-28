// dropdown-component.js

class DropdownComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initialize properties
        this.isOpen = false;
        this.searchText = '';
        this.items = [];
        this.highlightedIndex = -1;
        this.fetchTimeout = null;
        this.internalSelectedItem = null;

        // Create the template
        this.shadowRoot.innerHTML = `
            <style>
                /* Scoped styles */
                :host {
                    position: relative;
                    display: inline-block;
                    width: 200px;
                    font-family: Arial, sans-serif;
                }
                .selected-item {
                    border: 1px solid #ccc;
                    padding: 8px;
                    cursor: pointer;
                    position: relative;
                }
                .selected-item .placeholder {
                    color: #aaa;
                }
                .selected-item .arrow {
                    position: absolute;
                    right: 10px;
                    top: 8px;
                    transition: transform 0.2s;
                }
                .selected-item .arrow.open {
                    transform: rotate(180deg);
                }
                .dropdown-menu {
                    position: absolute;
                    width: 100%;
                    border: 1px solid #ccc;
                    background: #fff;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    margin-top: 2px;
                }
                .search-box {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                    border-bottom: 1px solid #ccc;
                    outline: none;
                }
                .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    overflow-y: auto;
                    max-height: ${this.getAttribute('max-item-count') ? this.getAttribute('max-item-count') * 2 : 20}em;
                }
                .item-list li {
                    padding: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .item-list li:hover,
                .item-list li.highlighted {
                    background: #f0f0f0;
                }
            </style>
            <div class="dropdown-component" tabindex="0">
                <div class="selected-item">
                    <span class="display-text"></span>
                    <span class="placeholder">Select an item...</span>
                    <span class="arrow">&#9662;</span>
                </div>
                <div class="dropdown-menu" hidden>
                    <input type="text" class="search-box" placeholder="Search..." />
                    <ul class="item-list"></ul>
                </div>
            </div>
        `;

        // Bind methods
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.fetchItems = this.fetchItems.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    connectedCallback() {
        // Initialize properties from attributes
        this.maxItemCount = this.getAttribute('max-item-count') || 10;
        this.url = this.getAttribute('url');
        this.keyProperty = this.getAttribute('key-property');
        this.itemDisplayTemplate = this.getAttribute('item-display-template');
        this.selectedItem = this.getAttribute('selected-item');

        if (!this.url || !this.keyProperty || !this.itemDisplayTemplate) {
            console.error('DropdownComponent: Missing required attributes.');
            return;
        }

        // Get DOM elements
        this.dropdownComponent = this.shadowRoot.querySelector('.dropdown-component');
        this.selectedItemElement = this.shadowRoot.querySelector('.selected-item');
        this.displayTextElement = this.shadowRoot.querySelector('.display-text');
        this.placeholderElement = this.shadowRoot.querySelector('.placeholder');
        this.arrowElement = this.shadowRoot.querySelector('.arrow');
        this.dropdownMenuElement = this.shadowRoot.querySelector('.dropdown-menu');
        this.searchBoxElement = this.shadowRoot.querySelector('.search-box');
        this.itemListElement = this.shadowRoot.querySelector('.item-list');

        // Event listeners
        this.selectedItemElement.addEventListener('click', this.toggleDropdown);
        this.searchBoxElement.addEventListener('input', this.onInputChange);
        this.dropdownComponent.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('click', this.onDocumentClick);

        // Set initial selected item if provided
        if (this.selectedItem) {
            try {
                this.internalSelectedItem = JSON.parse(this.selectedItem);
                this.updateDisplayText();
            } catch (e) {
                console.error('DropdownComponent: Invalid selected-item JSON.');
            }
        }
    }

    disconnectedCallback() {
        // Cleanup
        this.selectedItemElement.removeEventListener('click', this.toggleDropdown);
        this.searchBoxElement.removeEventListener('input', this.onInputChange);
        this.dropdownComponent.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('click', this.onDocumentClick);
    }

    toggleDropdown(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        this.dropdownMenuElement.hidden = !this.isOpen;
        this.arrowElement.classList.toggle('open', this.isOpen);
        if (this.isOpen) {
            this.searchBoxElement.focus();
            if (!this.items.length) {
                this.fetchItems();
            }
        }
    }

    onInputChange(event) {
        clearTimeout(this.fetchTimeout);
        this.searchText = event.target.value;
        this.fetchTimeout = setTimeout(() => {
            this.fetchItems();
        }, 300);
    }

    fetchItems() {
        clearTimeout(this.fetchTimeout);
        const queryUrl = `${this.url}${this.url.includes('?') ? '&' : '?'}q=${encodeURIComponent(this.searchText)}`;
        fetch(queryUrl)
            .then(response => response.json())
            .then(data => {
                this.items = data;
                this.highlightedIndex = -1;
                this.renderItems();
            })
            .catch(error => {
                console.error('Error fetching items:', error);
            });
    }

    renderItems() {
        // Clear existing items
        this.itemListElement.innerHTML = '';
        // Render new items
        this.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = this.renderTemplate(this.itemDisplayTemplate, item);
            li.dataset.index = index;
            li.addEventListener('click', () => this.selectItem(item));
            li.addEventListener('mouseover', () => this.highlightItem(index));
            if (index === this.highlightedIndex) {
                li.classList.add('highlighted');
            }
            this.itemListElement.appendChild(li);
        });
    }

    renderTemplate(template, item) {
        let rendered = template;
        // Replace properties in the template with actual values
        rendered = rendered.replace(/\b(\w+)\b/g, (match) => {
            return item[match] !== undefined ? item[match] : match;
        });
        return rendered;
    }

    updateDisplayText() {
        if (this.internalSelectedItem) {
            const text = this.renderTemplate(this.itemDisplayTemplate, this.internalSelectedItem);
            this.displayTextElement.innerHTML = text;
            this.placeholderElement.style.display = 'none';
        } else {
            this.displayTextElement.innerHTML = '';
            this.placeholderElement.style.display = 'inline';
        }
    }

    selectItem(item) {
        this.internalSelectedItem = item;
        this.updateDisplayText();
        this.dispatchEvent(new CustomEvent('item-selected', { detail: item }));
        this.isOpen = false;
        this.dropdownMenuElement.hidden = true;
        this.arrowElement.classList.remove('open');
        this.searchText = '';
        this.searchBoxElement.value = '';
        this.items = [];
    }

    highlightItem(index) {
        this.highlightedIndex = index;
        const lis = this.itemListElement.querySelectorAll('li');
        lis.forEach(li => li.classList.remove('highlighted'));
        if (lis[index]) {
            lis[index].classList.add('highlighted');
        }
    }

    onKeyDown(event) {
        if (this.isOpen) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (this.highlightedIndex < this.items.length - 1) {
                    this.highlightedIndex++;
                    this.highlightItem(this.highlightedIndex);
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (this.highlightedIndex > 0) {
                    this.highlightedIndex--;
                    this.highlightItem(this.highlightedIndex);
                }
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (this.highlightedIndex >= 0 && this.items[this.highlightedIndex]) {
                    this.selectItem(this.items[this.highlightedIndex]);
                }
            } else if (event.key === 'Escape') {
                this.isOpen = false;
                this.dropdownMenuElement.hidden = true;
                this.arrowElement.classList.remove('open');
            }
        }
    }

    onDocumentClick(event) {
        if (!this.contains(event.target)) {
            this.isOpen = false;
            this.dropdownMenuElement.hidden = true;
            this.arrowElement.classList.remove('open');
        }
    }
}

customElements.define('dropdown-component', DropdownComponent);
