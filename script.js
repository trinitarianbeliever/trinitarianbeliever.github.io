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



// Function to fetch post data from the JSON files
async function fetchPostsData() {
    try {
        // Use Promise.all to fetch all three JSON files concurrently
        const [postsResponse, secondaryResponse, standbyResponse] = await Promise.all([
            fetch('./handle/posts.json'),
            fetch('./handle/secondary.json'),
            fetch('./handle/standby.json')
        ]);

        if (!postsResponse.ok || !secondaryResponse.ok || !standbyResponse.ok) {
            // Check for HTTP errors from any of the responses
            throw new Error(`One or more HTTP errors occurred! Status: ${postsResponse.status}, ${secondaryResponse.status}, and ${standbyResponse.status}`);
        }

        const postsData = await postsResponse.json();
        const secondaryData = await secondaryResponse.json();
        const standbyData = await standbyResponse.json();

        // Combine the posts from all three files into a single array
        allPosts = [...postsData, ...secondaryData, ...standbyData];

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

// Pure JavaScript Levenshtein distance function (keep this the same)
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}


// Function to render search results
function renderSearchResults(query) {
    // Escape the user query for safe display in the title
    const escapedQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Convert the query to lowercase and remove punctuation for search logic
    const lowerCaseQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
    const queryWords = lowerCaseQuery.split(' ').filter(word => word.length > 0);

    const stopWords = ['a', 'an', 'the', 'and', 'but', 'or', 'in', 'on', 'at', 'is', 'it', 'for', 'of', 'how', 'to', 'be', 'more'];

    const filteredPosts = allPosts.filter(post => {
        const lowerCaseTitle = post.title.toLowerCase().replace(/[^\w\s]/g, '');
        const titleWords = lowerCaseTitle.split(' ');
        
        return queryWords.every(queryWord => {
            if (stopWords.includes(queryWord)) {
                return true; // Ignore stop words in the search logic
            }
            return titleWords.some(titleWord => {
                if (Math.abs(queryWord.length - titleWord.length) > 2) {
                    return false;
                }
                return levenshteinDistance(queryWord, titleWord) <= 2;
            });
        });
    });

    // Clear the content container
    contentContainer.innerHTML = '';
    
    const searchResultsDiv = document.createElement('div');
    searchResultsDiv.classList.add('post-list', 'search-results');
    
    // Create and append the heading
    const heading = document.createElement('h2');
    heading.textContent = `Search Results for "${query}"`;
    searchResultsDiv.appendChild(heading);

    if (filteredPosts.length > 0) {
        filteredPosts.forEach(post => {
            const p = document.createElement('p');
            p.classList.add('post-title');
            p.dataset.postId = post.id;
            
            // This is how you re-implement highlighting safely
            const regex = new RegExp(`(${queryWords.join('|')})`, 'gi');
            const highlightedTitle = post.title.replace(regex, `<span class="highlight">$1</span>`);
            
            p.innerHTML = highlightedTitle;
            searchResultsDiv.appendChild(p);
        });
    } else {
        const noResultsP = document.createElement('p');
        noResultsP.style.textAlign = 'center';
        noResultsP.textContent = 'No results found.';
        searchResultsDiv.appendChild(noResultsP);
    }
    
    const backButton = document.createElement('a');
    backButton.href = '#';
    backButton.classList.add('back-button');
    backButton.textContent = '← Back to Home';
    backButton.onclick = () => {
        renderRoute('home');
        return false;
    };
    searchResultsDiv.appendChild(backButton);
    
    contentContainer.appendChild(searchResultsDiv);
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
