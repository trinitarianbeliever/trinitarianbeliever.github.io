const POSTS_PER_PAGE = 9; //how many posts in home page
const CATEGORIES_PER_PAGE = 40; // how many categories in categories page
let currentPagePosts = 1;
let currentPageCategories = 1;

let allPosts = [];
let allCategories = [];

const contentContainer = document.getElementById('content-container');
const homeLink = document.getElementById('home-link');
const categoriesLink = document.getElementById('categories-link');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const hamburgerBtn = document.getElementById('hamburger-menu');
const headerNav = document.getElementById('header-nav');

// Function to fetch post data from the JSON file
async function fetchPostsData() {
    try {
        const response = await fetch('./posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allPosts = await response.json();
        // Sort posts by date in descending order to show the latest first
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        allCategories = [...new Set(allPosts.map(post => post.category))];
        renderRoute('home');
    } catch (error) {
        console.error("Could not fetch posts data:", error);
        contentContainer.innerHTML = `<p class="error-message">Failed to load posts. Please try again later.</p>`;
    }
}

// Function to fetch and render the full post content from a Markdown file
async function fetchAndRenderFullPost(post) {
    // Show a loading state
    contentContainer.innerHTML = `
        <h1 class="post-title-header">${post.title}</h1>
        <p class="loading-message">Loading article...</p>
    `;
    try {
        const response = await fetch(post.filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const markdownContent = await response.text();
        // Simple Markdown to HTML conversion (for headings and paragraphs)
        const htmlContent = markdownContent
            .replace(/^# (.*$)/gim, '<h2>$1</h2>')
            .replace(/\n\n/g, '<p>')
            .replace(/\n/g, '<br/>');

        contentContainer.innerHTML = `
            <div class="full-post">
                <h1 class="post-title-header">${post.title}</h1>
                ${htmlContent}
                <a href="#" class="back-button" onclick="renderRoute('home'); return false;">&larr; Back to Home</a>
            </div>
        `;
    } catch (error) {
        console.error("Could not fetch post content:", error);
        contentContainer.innerHTML = `<p class="error-message">Failed to load post content. Please try again later.</p>`;
    }
}

// Function to render the home page with paginated post cards
function renderHomePage(page) {
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsToShow = allPosts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

    contentContainer.innerHTML = `
        <div class="post-grid">
            ${postsToShow.map(post => `
                <div class="post-card" data-post-id="${post.id}">
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-category">${post.category}</p>
                    <p class="post-card-date">${post.date}</p>
                </div>
            `).join('')}
        </div>
        <div class="pagination">
            <button id="prev-posts" ${page === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${page} of ${totalPages}</span>
            <button id="next-posts" ${page === totalPages ? 'disabled' : ''}>Next</button>
        </div>
    `;

    document.getElementById('prev-posts').addEventListener('click', () => {
        if (currentPagePosts > 1) {
            currentPagePosts--;
            renderRoute('home');
        }
    });

    document.getElementById('next-posts').addEventListener('click', () => {
        if (currentPagePosts < totalPages) {
            currentPagePosts++;
            renderRoute('home');
        }
    });
}

// Function to render the categories page
function renderCategoriesPage(page) {
    const startIndex = (page - 1) * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    const categoriesToShow = allCategories.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allCategories.length / CATEGORIES_PER_PAGE);

    contentContainer.innerHTML = `
        <div class="category-list">
            <ul>
                ${categoriesToShow.map(category => `
                    <li><a href="#" data-category="${category}">${category}</a></li>
                `).join('')}
            </ul>
            <div class="pagination">
                <button id="prev-categories" ${page === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${page} of ${totalPages}</span>
                <button id="next-categories" ${page === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;

    document.getElementById('prev-categories').addEventListener('click', () => {
        if (currentPageCategories > 1) {
            currentPageCategories--;
            renderRoute('categories');
        }
    });

    document.getElementById('next-categories').addEventListener('click', () => {
        if (currentPageCategories < totalPages) {
            currentPageCategories++;
            renderRoute('categories');
        }
    });
}

// Function to render a list of posts filtered by a category
function renderPostsByCategory(category) {
    const filteredPosts = allPosts.filter(post => post.category === category);
    contentContainer.innerHTML = `
        <div class="post-list category-posts">
            <h2>Articles in ${category}</h2>
            ${filteredPosts.map(post => `
                <p class="post-title" data-post-id="${post.id}">
                    ${post.title}
                </p>
            `).join('')}
            <a href="#" class="back-button" onclick="renderRoute('categories'); return false;">&larr; Back to Categories</a>
        </div>
    `;
}

// Function to render search results
function renderSearchResults(query) {
    const lowerCaseQuery = query.toLowerCase();
    
    // Remove all non-alphanumeric characters and then split into words
    const queryWords = lowerCaseQuery
        .replace(/[^\w\s]/g, '') // Removes punctuation
        .split(' ')
        .filter(word => word.length > 0); // Filters out any empty strings from multiple spaces

    const filteredPosts = allPosts.filter(post => {
        const lowerCaseTitle = post.title.toLowerCase();
        
        // Check if every word from the query exists in the post title
        return queryWords.every(word => lowerCaseTitle.includes(word));
    });

    let html = `
        <div class="post-list search-results">
            <h2>Search Results for "${query}"</h2>
    `;

    if (filteredPosts.length > 0) {
        html += filteredPosts.map(post => `
            <p class="post-title" data-post-id="${post.id}">
                ${post.title}
            </p>
        `).join('');
    } else {
        html += `<p style="text-align: center;">No results found.</p>`;
    }
    
    html += `<a href="#" class="back-button" onclick="renderRoute('home'); return false;">&larr; Back to Home</a></div>`;
    contentContainer.innerHTML = html;
}

// Main rendering function based on a route/state
function renderRoute(route, param = null) {
    if (route === 'home') {
        renderHomePage(currentPagePosts);
    } else if (route === 'categories') {
        renderCategoriesPage(currentPageCategories);
    } else if (route === 'category-posts') {
        renderPostsByCategory(param);
    } else if (route === 'full-post') {
        fetchAndRenderFullPost(param);
    } else {
        // Default to home page
        renderHomePage(currentPagePosts);
    }
    // Close the mobile menu on navigation
    if (window.innerWidth <= 992) {
        headerNav.classList.remove('is-open');
    }
}

// Event listeners for navigation
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentPagePosts = 1; // Reset to the first page
    renderRoute('home');
});

categoriesLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentPageCategories = 1; // Reset to the first page
    renderRoute('categories');
});

// Event listener for dynamic content clicks (post titles and categories)
contentContainer.addEventListener('click', (e) => {
    const postCard = e.target.closest('.post-card');
    if (postCard) {
        const postId = parseInt(postCard.dataset.postId);
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            renderRoute('full-post', post);
        }
    } else if (e.target.matches('.post-title')) {
        const postId = parseInt(e.target.dataset.postId);
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            renderRoute('full-post', post);
        }
    } else if (e.target.matches('[data-category]')) {
        e.preventDefault();
        const category = e.target.dataset.category;
        renderRoute('category-posts', category);
    }
});

// Event listener for hamburger menu
hamburgerBtn.addEventListener('click', () => {
    headerNav.classList.toggle('is-open');
});

// Event listeners for search
searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        renderSearchResults(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchButton.click();
    }
});

// Initial render: fetch data and then render the page
document.addEventListener('DOMContentLoaded', () => {
    fetchPostsData();
});
