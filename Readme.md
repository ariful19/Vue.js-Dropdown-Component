# Vue.js Dropdown Component

A self-contained, customizable dropdown component built with Vue.js, featuring dynamic data fetching, keyboard navigation, and customizable display templates.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Component API](#component-api)
- [Server Setup](#server-setup)
- [Example](#example)
- [License](#license)

## Features

- **Dynamic Data Fetching**: Fetch items from a provided API endpoint with search capability.
- **Customizable Display Template**: Define how items are displayed using a simple template syntax.
- **Keyboard Navigation**: Navigate through items using arrow keys, and select with Enter or Space.
- **Self-Contained**: Includes styles and logic within the component; no external dependencies except Vue.js.
- **Modern Aesthetics**: Subtle animations and clean design.


## Installation

### Prerequisites

- **Node.js** and **npm** installed on your machine.
- Basic knowledge of HTML, CSS, and JavaScript.
- Familiarity with Vue.js.

### Files

Download or clone the following files into your project directory:

- `index.html`: The main HTML file.
- `vueDdl.js`: The Vue.js dropdown component.
- `app.js`: A simple Node.js API server for testing.

## Usage

### 1. Setting Up the API Server

The component requires an API to fetch data. We'll use a simple Node.js server with Express.js.

#### a. Install Dependencies

```bash
npm install express cors
```

#### b. Create `app.js`

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS so your Vue.js app can access the API
app.use(cors());

// Array of words to generate random text
const words = ['apple', 'banana', 'cherry', 'date', 'fig', 'grape', 'lemon'];

app.get('/items', (req, res) => {
    // Get the 'q' query parameter for filtering (optional)
    const query = req.query.q ? req.query.q.toLowerCase() : '';

    // Generate an array of items
    const items = [];
    for (let i = 1; i <= 50; i++) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const text = `${randomWord}`;
        if (text.toLowerCase().includes(query)) {
            items.push({ id: i, text: text });
        }
    }

    res.json(items);
});

app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
```

#### c. Run the Server

```bash
node app.js
```

### 2. Setting Up the Vue.js Application

#### a. Include Vue.js and the Component in `index.html`

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Vue Dropdown Component Demo</title>
    <!-- Include the Dropdown Component -->
    <script src="/vueDdl.js"></script>
    <!-- Include Vue.js -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
</head>

<body>
    <div id="app">
        <dropdown-component
            :max-item-count="10"
            url="http://localhost:3000/items"
            key-property="id"
            item-display-template="<b>id</b>) text"
            @item-selected="onItemSelected">
        </dropdown-component>
    </div>

    <script>
        const app = Vue.createApp({
            data() {
                return {};
            },
            components: {
                'dropdown-component': DropdownComponent
            },
            methods: {
                onItemSelected(item) {
                    console.log('Selected item:', item);
                }
            }
        });

        app.mount('#app');
    </script>
</body>

</html>
```

#### b. Create the Component Logic in `vueDdl.js`

```javascript
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
            <span v-if="displayText" v-html="displayText"></span>
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
```

### 3. Running the Application

- Ensure your API server (`app.js`) is running.
- Open `index.html` in a web browser (use a local server if necessary).

## Component API

### Props

- **`maxItemCount`** (`Number`, default: `10`): Maximum number of items visible in the dropdown before scrolling.
- **`url`** (`String`, required): The API endpoint to fetch items.
- **`keyProperty`** (`String`, required): The property name used as a unique key for each item.
- **`itemDisplayTemplate`** (`String`, required): Template string to define how each item is displayed.
- **`selectedItem`** (`Object`, optional): An object representing the initially selected item.

### Events

- **`item-selected`**: Emitted when an item is selected, passing the selected item as a parameter.

### Methods

- The component automatically handles fetching, rendering, and selecting items.

## Server Setup

For the component to function, it requires an API endpoint that returns data in JSON format. The provided `app.js` serves as a simple example using Express.js.

### Steps

1. **Install Node.js and npm** if not already installed.
2. **Install dependencies**:

   ```bash
   npm install express cors
   ```

3. **Run the server**:

   ```bash
   node app.js
   ```

The server listens on `http://localhost:3000/items` and supports a `q` query parameter for filtering items based on the search input.

## Example

### Customizing the Display Template

You can customize how items are displayed using the `itemDisplayTemplate` prop. Use property names from your data items within the template.

#### Example

```html
<dropdown-component
    :max-item-count="10"
    url="http://localhost:3000/items"
    key-property="id"
    item-display-template="<strong>{{id}}</strong>: {{text}}"
    @item-selected="onItemSelected">
</dropdown-component>
```

### Handling the `item-selected` Event

Implement a method in your Vue.js application to handle the `item-selected` event emitted by the component.

```javascript
methods: {
    onItemSelected(item) {
        alert(`You selected: ${item.text}`);
    }
}
```

### Pre-selecting an Item

Pass a `selectedItem` prop to the component to display an item as selected on initial load.

```html
<dropdown-component
    :max-item-count="10"
    url="http://localhost:3000/items"
    key-property="id"
    item-display-template="{{text}}"
    :selected-item="{ id: 1, text: 'apple' }"
    @item-selected="onItemSelected">
</dropdown-component>
```

## License

This project is open-source and available under the MIT License.

---

Feel free to customize and enhance the component to suit your specific needs. Contributions and feedback are welcome!