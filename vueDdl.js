const DropdownComponent = {
    props: {
        maxItemCount: {
            type: Number,
            default: 10
        },
        url: {
            type: String,
            required: true
        },
        keyProperty: {
            type: String,
            required: true
        },
        itemDisplayTemplate: {
            type: String,
            required: true
        },
        selectedItem: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            isOpen: false,
            searchText: '',
            items: [],
            highlightedIndex: -1,
            fetchTimeout: null,
            internalSelectedItem: this.selectedItem
        };
    },
    watch: {
        selectedItem(newVal) {
            this.internalSelectedItem = newVal;
        }
    },
    computed: {
        displayText() {
            if (this.internalSelectedItem) {
                return this.renderTemplate(this.itemDisplayTemplate, this.internalSelectedItem);
            }
            return '';
        }
    },
    methods: {
        toggleDropdown() {
            this.isOpen = !this.isOpen;
            if (this.isOpen && !this.items.length) {
                this.fetchItems();
            }
        },
        fetchItems() {
            clearTimeout(this.fetchTimeout);
            this.fetchTimeout = setTimeout(() => {
                const queryUrl = `${this.url}${this.url.includes('?') ? '&' : '?'}q=${encodeURIComponent(this.searchText)}`;
                fetch(queryUrl)
                    .then(response => response.json())
                    .then(data => {
                        this.items = data;
                        this.highlightedIndex = -1;
                    })
                    .catch(error => {
                        console.error('Error fetching items:', error);
                    });
            }, 300);
        },
        onInputChange() {
            clearTimeout(this.fetchTimeout);
            this.fetchTimeout = setTimeout(() => {
                this.fetchItems();
            }, 300);
        },
        selectItem(item) {
            this.internalSelectedItem = item;
            this.$emit('item-selected', item);
            this.isOpen = false;
            this.searchText = '';
        },
        renderTemplate(template, item) {
            let rendered = template;
            // Replace properties in the template with actual values
            rendered = rendered.replace(/\b(\w+)\b/g, (match) => {
                return item[match] !== undefined ? item[match] : match;
            });
            return rendered;
        },
        onKeyDown(event) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (this.highlightedIndex < this.items.length - 1) {
                    this.highlightedIndex++;
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (this.highlightedIndex > 0) {
                    this.highlightedIndex--;
                }
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (this.highlightedIndex >= 0) {
                    this.selectItem(this.items[this.highlightedIndex]);
                }
            } else if (event.key === 'Escape') {
                this.isOpen = false;
            }
        },
        onMouseOver(index) {
            this.highlightedIndex = index;
        },
        closeDropdown(event) {
            if (!this.$el.contains(event.target)) {
                this.isOpen = false;
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.closeDropdown);

        // Inject styles into the document head
        if (!document.getElementById('dropdown-component-styles')) {
            const style = document.createElement('style');
            style.id = 'dropdown-component-styles';
            style.type = 'text/css';
            style.innerHTML = `
                /* Scoped styles for DropdownComponent */
                .dropdown-component {
                    position: relative;
                    width: 200px;
                    font-family: Arial, sans-serif;
                }
                .dropdown-component .selected-item {
                    border: 1px solid #ccc;
                    padding: 8px;
                    cursor: pointer;
                    position: relative;
                }
                .dropdown-component .selected-item .placeholder {
                    color: #aaa;
                }
                .dropdown-component .selected-item .arrow {
                    position: absolute;
                    right: 10px;
                    top: 8px;
                    transition: transform 0.2s;
                }
                .dropdown-component .selected-item .arrow.open {
                    transform: rotate(180deg);
                }
                .dropdown-component .dropdown-menu {
                    position: absolute;
                    width: 100%;
                    border: 1px solid #ccc;
                    background: #fff;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    margin-top: 2px;
                }
                .dropdown-component .search-box {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                    border-bottom: 1px solid #ccc;
                    outline: none;
                }
                .dropdown-component .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    overflow-y: auto;
                    max-height: ${this.maxItemCount * 2}em;
                }
                .dropdown-component .item-list li {
                    padding: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .dropdown-component .item-list li:hover,
                .dropdown-component .item-list li.highlighted {
                    background: #f0f0f0;
                }
                /* Fade transition */
                .fade-enter-active,
                .fade-leave-active {
                    transition: opacity 0.2s;
                }
                .fade-enter,
                .fade-leave-to {
                    opacity: 0;
                }
            `;
            document.head.appendChild(style);
        }
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeDropdown);
        // Optionally, remove the styles when the component is unmounted
        // const style = document.getElementById('dropdown-component-styles');
        // if (style) {
        //     document.head.removeChild(style);
        // }
    },
    template: `
    <div class="dropdown-component" @keydown="onKeyDown" tabindex="0">
        <div class="selected-item" @click="toggleDropdown">
            <span v-if="displayText" v-html="displayText">{{  }}</span>
            <span v-else class="placeholder">Select an item...</span>
            <span class="arrow" :class="{ open: isOpen }">&#9662;</span>
        </div>
        <transition name="fade">
            <div v-if="isOpen" class="dropdown-menu">
                <input type="text" class="search-box" v-model="searchText" @input="onInputChange" placeholder="Search..." />
                <ul class="item-list">
                    <li v-for="(item, index) in items"
                        :key="item[keyProperty]"
                        :class="{ highlighted: index === highlightedIndex }"
                        @click="selectItem(item)"
                        @mouseover="onMouseOver(index)">
                        <span v-html="renderTemplate(itemDisplayTemplate, item)"></span>
                    </li>
                </ul>
            </div>
        </transition>
    </div>
    `
};
