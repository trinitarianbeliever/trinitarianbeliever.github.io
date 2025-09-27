// Use a self-invoking function for encapsulation
(function() {
    // --- ASYNCHRONOUS DATA FETCH FUNCTION ---
    
    // Function to fetch articles from the external JSON file
    async function fetchArticles() {
        try {
            // Use the provided relative path
            const response = await fetch('../data/data.json'); 
            
            // Check if the response was successful (status 200-299)
            if (!response.ok) {
                // Throw an error if the file is not found or inaccessible
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse the JSON data and return it
            return await response.json();
        } catch (error) {
            console.error("Error loading articles data:", error);
            // Show a user-friendly message for critical errors
            showMessage(`Failed to load articles index. Please check the path "../data/data.json". Details: ${error.message}`);
            // Return an empty array so the rest of the app can still initialize without articles
            return []; 
        }
    }
    
    // --- DATA (Books is unchanged) ---
    const booksData = [
        { id: 1, title: "The Trinity and the Christian Life", pdfLink: "#" },
        { id: 2, title: "Commentary on Romans", pdfLink: "#" },
        { id: 3, title: "The Logic of the Creed", pdfLink: "#" },
    ];

    // Global variable to hold the loaded articles data
    let articlesData = [];

    // --- STATE & CONSTANTS ---
    let currentPage = 1;
    const articlesPerPage = 9;
    let currentFilter = { type: 'home', value: null };

    // Elements
    const contentArea = document.getElementById('content-area');
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    const searchContainer = document.getElementById('search-container-desktop');
    const mobileSearchPlaceholder = document.getElementById('mobile-search-placeholder');
    const headerContent = document.querySelector('.header-content');
    
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const footerArticleCount = document.getElementById('article-count-footer');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');


    // --- UTILITY FUNCTIONS ---

    // STEP 1.1: XSS Safety (Sanitizes input by treating it as plain text)
    function sanitize(html) {
        const element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    }

    // Custom Alert/Message Box
    function showMessage(message) {
        messageText.textContent = message;
        messageBox.style.display = 'flex';
    }
    
    messageOkButton.addEventListener('click', () => {
        messageBox.style.display = 'none';
    });
    
    // ----------------------------------------------------------------------
    // NEW: Search-specific utilities for improved relevance and scoring
    // ----------------------------------------------------------------------
    const stopWords = [
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
        'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 
        'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 
        'with', 
        // Added common question/interrogative words and other high-frequency terms
        'how', 'what', 'who', 'why', 'when', 'where', 'which', 'whom', 'can', 'do', 
        'does', 'did', 'have', 'has', 'had', 'just', 'some', 'many', 'very', 'only' 
    ];
    /**
     * Processes a string for search by lowercasing, removing punctuation, 
     * and filtering out common stop words.
     * @param {string} text 
     * @returns {string[]} An array of meaningful, clean words.
     */
    function processTextForSearch(text) {
        const lowercasedText = text.toLowerCase();
        // Remove all non-alphanumeric characters (keep spaces)
        const alphanumericText = lowercasedText.replace(/[^\w\s]/g, ''); 
        // Split by one or more spaces
        const words = alphanumericText.split(/\s+/);
        // Filter out empty strings and stop words
        return words.filter(word => word.length > 0 && !stopWords.includes(word));
    }
    
    /**
     * Finds articles matching the search term, calculates a relevance score, and sorts them.
     * @param {string} searchTerm 
     * @returns {object[]} An array of article objects, sorted by relevance.
     */
    function getScoredSearchResults(searchTerm) {
        const processedQueryWords = processTextForSearch(searchTerm);
        
        // If the query is empty after processing (e.g., user searched 'the and a'), return empty array
        if (processedQueryWords.length === 0) {
            return [];
        }

        const results = [];

        // Score each article based on keyword matches in the title
        articlesData.forEach(article => {
            const processedTitleWords = processTextForSearch(article.title);
            let score = 0;

            // Give a point for every query word found in the article title
            processedQueryWords.forEach(queryWord => {
                // Check if the title words includes the query word (improves word boundary matching)
                if (processedTitleWords.includes(queryWord)) {
                    score += 1;
                }
            });
            
            // Optional: Bonus point for a perfect match of the full search phrase in the title
            if (article.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                 score += 0.5;
            }

            // Only include articles with a positive score
            if (score > 0) {
                // Store the original article object and its calculated score
                results.push({ article, score });
            }
        });

        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);

        // Return just the article objects in the sorted order
        return results.map(r => r.article);
    }
    // ----------------------------------------------------------------------
    

    // --- PAGE RENDERING FUNCTIONS ---
    
    // Filters and returns articles based on the current filter state
    // MODIFIED to use getScoredSearchResults for 'search' type
    function getFilteredArticles() {
        if (currentFilter.type === 'search') {
            // Use the new scored, ranked search function
            return getScoredSearchResults(currentFilter.value);
        } else if (currentFilter.type === 'year') {
            return articlesData.filter(article => article.year === currentFilter.value);
        } else if (currentFilter.type === 'category') {
            return articlesData.filter(article => article.category === currentFilter.value);
        }
        
        // Default for 'home' or any initial state: return all data
        return articlesData;
    }

    // STEP 1.2: Renders the 9 blog cards and pagination
    function renderHomePage() {
        document.title = "Trinitarian Believer - Home";
        const filteredArticles = getFilteredArticles();
        const totalArticles = filteredArticles.length;
        const totalPages = Math.ceil(totalArticles / articlesPerPage);
        
        // Clamp currentPage
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 0;
        } else if (currentPage === 0 && totalPages > 0) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * articlesPerPage;
        const endIndex = startIndex + articlesPerPage;
        const articlesToShow = filteredArticles.slice(startIndex, endIndex);

        let html = `<h1 class="page-title">${currentFilter.type === 'search' ? `Search Results for: "${sanitize(currentFilter.value)}"` : 'Latest Articles'}</h1>`;
        
        if (articlesToShow.length === 0) {
            html += `<p style="text-align: center; font-size: 1.2rem;">No articles found ${currentFilter.type === 'search' ? `matching "${sanitize(currentFilter.value)}"` : 'for this filter/page'}.</p>`;
            contentArea.innerHTML = html;
            
            // Clear pagination area if no articles
            if (document.querySelector('.pagination-controls')) {
                document.querySelector('.pagination-controls').remove();
            }
            return;
        }

        // Render Articles Grid
        html += '<div class="article-grid">';
        articlesToShow.forEach(article => {
            html += `
                <div class="blog-card" data-id="${article.id}">
                    <div>
                        <h3>${sanitize(article.title)}</h3>
                        <p class="date">${sanitize(new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}</p>
                    </div>
                    <a href="#" class="read-link" data-id="${article.id}">Continue Reading &rarr;</a>
                </div>
            `;
        });
        html += '</div>';

        // Render Pagination Controls
        if (totalPages > 1) {
            html += `
                <div class="pagination-controls">
                    <button id="prev-button" class="control-button" ${currentPage === 1 ? 'disabled' : ''}>&larr; Previous</button>
                    <span>Page ${currentPage} of ${totalPages}</span>
                    <button id="next-button" class="control-button" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>Next &rarr;</button>
                </div>
            `;
        }
        
        contentArea.innerHTML = html;

        // Add event listeners for pagination
        if (totalPages > 1) {
            document.getElementById('prev-button').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderHomePage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });

            document.getElementById('next-button').addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderHomePage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
        
        // Add event listeners for full article view
        document.querySelectorAll('.blog-card, .read-link').forEach(element => {
            element.addEventListener('click', (e) => {
                // Prevent link from jumping or full card click from acting like a link
                e.preventDefault(); 
                e.stopPropagation();
                // Find the article ID, whether clicked on the card or the link
                const articleId = parseInt(e.currentTarget.dataset.id);
                if (articleId) {
                    // Call the async function
                    renderArticle(articleId); 
                }
            });
        });
    }

    // STEP 3.3: Renders the full article view (MODIFIED TO ASYNC FETCH)
    async function renderArticle(id) {
        const article = articlesData.find(a => a.id === id);
        if (!article) {
            showMessage('Error: Article not found in index.');
            return;
        }
        
        document.title = `Trinitarian Believer - ${article.title}`;

        // 1. Initial render with metadata and loading state
        contentArea.innerHTML = `
            <div class="full-article">
                <h1>${sanitize(article.title)}</h1>
                <p class="meta">
                    Published on: ${sanitize(new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}
                </p>
                <div id="article-content-loader">
                    <p>Loading article content...</p>
                </div>
                <a href="#" class="back-link" data-route="back">&larr; Back to Articles</a>
            </div>
        `;

        // Update route to enable back functionality right away
        document.querySelector('.back-link').addEventListener('click', handleNavigation);
        
        const contentLoader = document.getElementById('article-content-loader');

        try {
            // 2. Fetch the content from the file path stored in the 'content' field
            const response = await fetch(article.content);
            
            if (!response.ok) {
                throw new Error(`Failed to load article file: ${response.status} ${response.statusText}`);
            }
            
            // 3. Get the file content as raw text (assuming it's HTML or plain text)
            const fileContent = await response.text();
            
            // 4. Render the final content (using innerHTML to allow HTML formatting in the external file)
            contentLoader.innerHTML = `<div class="content-text">${fileContent}</div>`;
            
        } catch (error) {
            console.error(`Error fetching article content for ID ${id}:`, error);
            contentLoader.innerHTML = `<p class="content-text" style="color: red;">Error loading content from <strong>${sanitize(article.content)}</strong>. Please ensure the file path is correct and the file exists. (${error.message})</p>`;
        }
    }

    // STEP 2.1: Renders the Archives page (filter by year)
    function renderArchivesPage() {
        document.title = "Trinitarian Believer - Archives";
        // Create an array of unique years, then sort them in descending order
        const years = [...new Set(articlesData.map(a => a.year))].sort((a, b) => b - a);
        
        let html = '<h1 class="page-title">Archives by Year</h1>';
        html += '<div class="filter-controls">';
        
        years.forEach(year => {
            const isActive = currentFilter.type === 'year' && currentFilter.value === year;
            html += `<button class="control-button year-filter ${isActive ? 'active' : ''}" data-year="${year}">${year}</button>`;
        });
        html += '</div>';
        
        // Show filtered results below controls if a filter is active
        if (currentFilter.type === 'year') {
            html += '<h2 style="text-align: center; margin-top: 40px; font-size: 2rem; color: var(--color-dark);">Articles from ' + sanitize(currentFilter.value) + '</h2>';
            
            const filteredArticles = getFilteredArticles();
            html += '<div class="article-grid" style="margin-top: 20px;">';
            if (filteredArticles.length === 0) {
                html += `<p style="text-align: center; grid-column: 1 / -1;">No articles found for ${sanitize(currentFilter.value)}.</p>`;
            } else {
                filteredArticles.forEach(article => {
                    html += `
                        <div class="blog-card" data-id="${article.id}">
                            <div>
                                <h3>${sanitize(article.title)}</h3>
                                <p class="date">${sanitize(new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}</p>
                            </div>
                            <a href="#" class="read-link" data-id="${article.id}">Continue Reading &rarr;</a>
                        </div>
                    `;
                });
            }
            html += '</div>';
        } else {
            html += '<p style="text-align: center; margin-top: 20px;">Click a year above to view all articles published in that period.</p>';
        }

        contentArea.innerHTML = html;
        
        // Attach listeners for the year filter buttons
        document.querySelectorAll('.year-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                currentFilter = { type: 'year', value: e.target.dataset.year };
                // Simply re-render the page with the new filter
                renderArchivesPage();
            });
        });

        // Attach listeners for full article view for filtered articles.
        if (currentFilter.type === 'year') {
            document.querySelectorAll('.blog-card, .read-link').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    const articleId = parseInt(e.currentTarget.dataset.id);
                    if (articleId) {
                        renderArticle(articleId);
                    }
                });
            });
        }
    }

    // STEP 2.2: Renders the Categories page (filter by category)
    function renderCategoriesPage() {
        document.title = "Trinitarian Believer - Categories";
        // Create an array of unique categories, then sort them alphabetically
        const categories = [...new Set(articlesData.map(a => a.category))].sort();
        
        let html = '<h1 class="page-title">Articles by Category</h1>';
        html += '<div class="filter-controls">';
        
        categories.forEach(category => {
            const isActive = currentFilter.type === 'category' && currentFilter.value === category;
            html += `<button class="control-button category-filter ${isActive ? 'active' : ''}" data-category="${sanitize(category)}">${sanitize(category)}</button>`;
        });
        html += '</div>';
        
        // Show filtered results below controls if a filter is active
        if (currentFilter.type === 'category') {
            html += '<h2 style="text-align: center; margin-top: 40px; font-size: 2rem; color: var(--color-dark);">Articles in: ' + sanitize(currentFilter.value) + '</h2>';
            
            const filteredArticles = getFilteredArticles();
            html += '<div class="article-grid" style="margin-top: 20px;">';
            if (filteredArticles.length === 0) {
                html += `<p style="text-align: center; grid-column: 1 / -1;">No articles found for ${sanitize(currentFilter.value)}.</p>`;
            } else {
                filteredArticles.forEach(article => {
                    html += `
                        <div class="blog-card" data-id="${article.id}">
                            <div>
                                <h3>${sanitize(article.title)}</h3>
                                <p class="date">${sanitize(new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}</p>
                            </div>
                            <a href="#" class="read-link" data-id="${article.id}">Continue Reading &rarr;</a>
                        </div>
                    `;
                });
            }
            html += '</div>';
        } else {
            html += '<p style="text-align: center; margin-top: 20px;">Click a category above to view related articles.</p>';
        }

        contentArea.innerHTML = html;
        
        // Attach listeners for the category filter buttons
        document.querySelectorAll('.category-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                currentFilter = { type: 'category', value: e.target.dataset.category };
                // Simply re-render the page with the new filter
                renderCategoriesPage();
            });
        });

        // Attach listeners for full article view for filtered articles.
        if (currentFilter.type === 'category') {
            document.querySelectorAll('.blog-card, .read-link').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    const articleId = parseInt(e.currentTarget.dataset.id);
                    if (articleId) {
                        renderArticle(articleId);
                    }
                });
            });
        }
    }

    // STEP 2.3: Renders the Books page
    function renderBooksPage() {
        document.title = "Trinitarian Believer - Books";
        let html = '<h1 class="page-title">Recommended Books</h1>';
        html += '<div class="book-grid">';
        
        booksData.forEach(book => {
            html += `
                <div class="book-card">
                    <div class="image-placeholder">Cover Art Placeholder</div>
                    <h4>${sanitize(book.title)}</h4>
                    <a href="${sanitize(book.pdfLink)}" target="_blank" class="download-btn">Download PDF</a>
                </div>
            `;
        });

        html += '</div>';
        contentArea.innerHTML = html;
    }

    // STEP 3.1: Renders the About page
    function renderAboutPage() {
        document.title = "Trinitarian Believer - About";
        const html = `
            <h1 class="page-title">About Trinitarian Believer</h1>
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; background-color: var(--color-white); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <p style="font-size: 1.1rem; text-align: justify;">
                    Trinitarian Believer is a platform dedicated to exploring, defending, and celebrating the historic Christian doctrine of the Trinity. Our mission is to provide accessible, deeply theological content that encourages believers to better understand the Father, the Son, and the Holy Spirit as one God in three persons. We seek to honor the rich tradition of the Church while applying these timeless truths to contemporary spiritual life, promoting serious engagement with Scripture, church history, and systematic theology.
                </p>
            </div>
        `;
        contentArea.innerHTML = html;
    }


    // --- CORE LOGIC & EVENT HANDLERS ---
    
    // Handles setting the filter and rendering the correct page
    function handleRoute(route, value = null) {
        // Close mobile menu on navigation
        navMenu.classList.remove('open');
        
        // Reset to default home filter
        if (route === 'home' || route === 'back' || route === 'search') {
            currentFilter = { type: route, value: value };
            currentPage = 1; // Reset pagination for new route/filter
            renderHomePage();
            return;
        }

        // If navigating to a filtered page (Archives/Categories) without an active filter, set the filter type to null
        if (route === 'archives') {
            // Note: If the filter is already set to 'year', we preserve it, otherwise we set to initial state.
            if (currentFilter.type !== 'year') {
                 currentFilter = { type: 'archives-initial', value: null };
            }
            renderArchivesPage();
        } else if (route === 'categories') {
            // Note: If the filter is already set to 'category', we preserve it, otherwise we set to initial state.
            if (currentFilter.type !== 'category') {
                 currentFilter = { type: 'categories-initial', value: null };
            }
            renderCategoriesPage();
        } else if (route === 'books') {
            currentFilter = { type: 'books', value: null };
            renderBooksPage();
        } else if (route === 'about') {
            currentFilter = { type: 'about', value: null };
            renderAboutPage();
        }
    }

    // Centralized navigation handler
    function handleNavigation(e) {
        e.preventDefault();
        const route = e.currentTarget.dataset.route;
        if (route) {
            handleRoute(route);
        }
    }

    // STEP 3.2: Search Logic
    function handleSearch(e) {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm.length > 0) {
            // Pass the raw search term to handleRoute, which sets the filter and calls renderHomePage.
            // The actual scoring and filtering logic happens inside getFilteredArticles/getScoredSearchResults
            handleRoute('search', searchTerm);
        } else {
            showMessage("Please enter a search term.");
        }
    }

    // NEW: Function to handle search box relocation for mobile responsiveness
    function toggleSearchRelocation(isOpen) {
        // Check if we are on a mobile screen size (matches CSS media query: 900px)
        const isMobile = window.innerWidth <= 900;

        if (isMobile) {
            if (isOpen) {
                // Menu is opening: Move search box into the mobile placeholder in the menu
                mobileSearchPlaceholder.appendChild(searchContainer);
            } else {
                // Menu is closing: Move search box back to its original parent (header-content)
                headerContent.appendChild(searchContainer); 
            }
        }
    }
    
    // --- INITIALIZATION ---
    
    // NEW: Function to load data and then start the main application logic
    async function loadDataAndStartApp() {
        // Await the fetch and error handling from fetchArticles
        articlesData = await fetchArticles();
        
        // Now that data is loaded, update the footer and render the initial page
        footerArticleCount.textContent = `Currently hosting ${articlesData.length} articles.`;
        handleRoute('home');
    }


    // Main initialization function
    function init() {
        // STEP 1.1: Mobile menu toggle
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const isOpen = navMenu.classList.contains('open');
            toggleSearchRelocation(isOpen);
        });
        
        // Handle window resize to correct search box position if screen size changes while menu is open
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900 && !headerContent.contains(searchContainer)) {
                // If desktop size, but search box is still inside the mobile placeholder, move it back.
                headerContent.appendChild(searchContainer); 
            } else if (window.innerWidth <= 900 && navMenu.classList.contains('open') && !mobileSearchPlaceholder.contains(searchContainer)) {
                // If mobile size, menu is open, but search box is in the wrong place, move it.
                mobileSearchPlaceholder.appendChild(searchContainer);
            }
        });

        // Attach navigation handlers to all header links
        document.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
        
        // Attach search handler
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
        
        // Initial page load, which includes data loading
        loadDataAndStartApp();
    }

    // Run initialization once DOM is ready
    window.addEventListener('load', init);

})(); // End of self-invoking function
