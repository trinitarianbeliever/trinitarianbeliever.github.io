// Get references to our elements
const postsContainer = document.getElementById('posts-container');
const paginationContainer = document.getElementById('pagination-container');
const categoryListContainer = document.getElementById('category-list-container');
const aboutContainer = document.getElementById('about-container');
const postDetailContainer = document.getElementById('post-detail-container');
const categoriesGrid = document.getElementById('categories-grid');
const loadingSpinner = document.getElementById('loading-spinner');

// Navigation links
const homeLink = document.getElementById('home-link');
const categoriesLink = document.getElementById('categories-link');
const aboutLink = document.getElementById('about-link');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const siteNameLink = document.getElementById('site-name-link');

// Pagination buttons and info for posts
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const searchInput = document.getElementById('search-input');

// Pagination buttons and info for categories
const categoryPaginationContainer = document.getElementById('category-pagination-container');
const categoryPrevBtn = document.getElementById('category-prev-btn');
const categoryNextBtn = document.getElementById('category-next-btn');
const categoryPageInfo = document.getElementById('category-page-info');

// Pagination variables for posts
const postsPerPage = 5;
let currentPage = 1;

// Pagination variables for categories
const categoriesPerPage = 20;
let currentCategoryPage = 1;
let uniqueCategories = [];

// A variable to hold the currently displayed posts (either all posts or filtered posts)
let currentPosts = [];
let allBlogPosts = []; // All posts metadata fetched from index.json

// Function to calculate read time
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime;
}

// Function to render the blog posts
function renderPosts(posts) {
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="text-center text-gray-600 text-lg">No posts found. Try a different search or category.</p>';
        return;
    }
    
    posts.forEach(post => {
        const readTime = calculateReadTime(post.summary);
        const postElement = document.createElement('div');
        postElement.className = 'bg-gray-50 rounded-lg shadow-lg p-6 flex flex-col justify-between transition-transform duration-200 hover:scale-105 cursor-pointer';
        
        // Use marked.parse to convert Markdown summary to HTML
        const htmlSummary = marked.parse(post.summary);

        postElement.innerHTML = `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mt-2 mb-1">${post.title}</h2>
                <p class="text-gray-600 text-sm mt-1 flex items-center space-x-2">
                    <span>${post.date}</span>
                    <span class="text-gray-400">•</span>
                    <span>${readTime} min read</span>
                </p>
                <div class="text-gray-700 mt-4">${htmlSummary}</div>
            </div>
        `;
        postElement.addEventListener('click', () => {
            renderPostDetail(post);
        });
        postsContainer.appendChild(postElement);
    });
}

// Function to render the full post content by fetching the Markdown file
async function renderPostDetail(post) {
    loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await fetch(post.filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdownContent = await response.text();
        
        postsContainer.classList.add('hidden');
        paginationContainer.classList.add('hidden');
        categoryListContainer.classList.add('hidden');
        aboutContainer.classList.add('hidden');
        postDetailContainer.classList.remove('hidden');

        document.getElementById('post-detail-title').textContent = post.title;
        document.getElementById('post-detail-meta').textContent = `${post.date} • ${calculateReadTime(markdownContent)} min read`;
        
        // Use marked.parse to convert Markdown full content to HTML
        document.getElementById('post-detail-content').innerHTML = marked.parse(markdownContent);
    } catch (error) {
        console.error("Error fetching post content:", error);
        alert('Failed to load the article.');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Function to update post pagination buttons and page info
function updatePostPaginationButtons() {
    const totalPages = Math.ceil(currentPosts.length / postsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Function to render posts for a specific page
function renderPostPage(pageNumber) {
    currentPage = pageNumber;
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = currentPosts.slice(startIndex, endIndex);
    renderPosts(postsToDisplay);
    updatePostPaginationButtons();
}

// Function to handle the search logic
function handleSearch(searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    currentPosts = allBlogPosts.filter(post => 
        post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        post.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        post.summary.toLowerCase().includes(lowerCaseSearchTerm)
    );
    renderPostPage(1);
    showAllContainers();
}

// Function to get unique categories and count posts in each
function getCategories() {
    const categories = {};
    allBlogPosts.forEach(post => {
        if (categories[post.category]) {
            categories[post.category]++;
        } else {
            categories[post.category] = 1;
        }
    });
    return categories;
}

// Function to render the category list for a specific page
function renderCategoryPage(pageNumber) {
    currentCategoryPage = pageNumber;
    const startIndex = (currentCategoryPage - 1) * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    const categoriesToDisplay = uniqueCategories.slice(startIndex, endIndex);

    categoriesGrid.innerHTML = '';

    categoriesToDisplay.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'bg-gray-50 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-100 transition';
        categoryElement.innerHTML = `
            <h3 class="text-xl font-bold text-gray-900">${category.name}</h3>
            <p class="text-gray-600 mt-1">${category.count} article${category.count > 1 ? 's' : ''}</p>
        `;
        categoryElement.addEventListener('click', () => {
            filterByCategory(category.name);
        });
        categoriesGrid.appendChild(categoryElement);
    });

    if (uniqueCategories.length > categoriesPerPage) {
        categoryPaginationContainer.classList.remove('hidden');
        const totalPages = Math.ceil(uniqueCategories.length / categoriesPerPage);
        categoryPageInfo.textContent = `Page ${currentCategoryPage} of ${totalPages}`;
        categoryPrevBtn.disabled = currentCategoryPage === 1;
        categoryNextBtn.disabled = currentCategoryPage === totalPages;
    } else {
        categoryPaginationContainer.classList.add('hidden');
    }
}

// Function to filter and show posts by a specific category
function filterByCategory(category) {
    currentPosts = allBlogPosts.filter(post => post.category === category);
    showAllContainers();
    renderPostPage(1);
}

// Function to show all containers
function showAllContainers() {
    postsContainer.classList.remove('hidden');
    paginationContainer.classList.remove('hidden');
    categoryListContainer.classList.add('hidden');
    aboutContainer.classList.add('hidden');
    postDetailContainer.classList.add('hidden');
}

// Function to show only the category list container
function showCategoryContainer() {
    postsContainer.classList.add('hidden');
    paginationContainer.classList.add('hidden');
    categoryListContainer.classList.remove('hidden');
    aboutContainer.classList.add('hidden');
    postDetailContainer.classList.add('hidden');
    renderCategoryPage(1);
}

// Function to show only the about container
function showAboutContainer() {
    postsContainer.classList.add('hidden');
    paginationContainer.classList.add('hidden');
    categoryListContainer.classList.add('hidden');
    aboutContainer.classList.remove('hidden');
    postDetailContainer.classList.add('hidden');
}

// Central function to navigate to the home page
function goToHome(e) {
    e.preventDefault();
    searchInput.value = '';
    currentPosts = [...allBlogPosts];
    showAllContainers();
    renderPostPage(1);
}

// Event listeners for navigation
homeLink.addEventListener('click', goToHome);
siteNameLink.addEventListener('click', goToHome);

categoriesLink.addEventListener('click', (e) => {
    e.preventDefault();
    showCategoryContainer();
});

aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutContainer();
});

backToHomeBtn.addEventListener('click', goToHome);

// Event listeners for post pagination
prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        renderPostPage(currentPage - 1);
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(currentPosts.length / postsPerPage);
    if (currentPage < totalPages) {
        renderPostPage(currentPage + 1);
    }
});

// Event listener for search input
searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
});

// Event listeners for category pagination
categoryPrevBtn.addEventListener('click', () => {
    if (currentCategoryPage > 1) {
        renderCategoryPage(currentCategoryPage - 1);
    }
});

categoryNextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(uniqueCategories.length / categoriesPerPage);
    if (currentCategoryPage < totalPages) {
        renderCategoryPage(currentCategoryPage + 1);
    }
});

// Initialization function
async function initializeApp() {
    loadingSpinner.classList.remove('hidden');
    
    try {
        const response = await fetch('posts/index.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allBlogPosts = await response.json();
        
        // Sort posts by date in descending order
        allBlogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        currentPosts = [...allBlogPosts];
        
        const categoryCounts = getCategories();
        uniqueCategories = Object.keys(categoryCounts).map(name => ({ name, count: categoryCounts[name] }));

        renderPostPage(1);
    } catch (error) {
        postsContainer.innerHTML = '<p class="text-center text-red-500 font-semibold text-lg">Failed to load blog posts. Please make sure the posts/index.json file exists and is accessible.</p>';
    } finally {
        loadingSpinner.classList.add('hidden');
        showAllContainers();
    }
}

initializeApp();

