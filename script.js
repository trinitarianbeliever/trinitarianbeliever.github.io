document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const searchInput = document.getElementById('search-input');
    const postsContainer = document.getElementById('posts-container');
    const paginationControls = document.getElementById('pagination-controls');
    const categoriesContainer = document.getElementById('categories-container');
    const categoryPaginationControls = document.getElementById('category-pagination-controls');

    // Get navigation links
    const homeLink = document.getElementById('home-link');
    const categoriesLink = document.getElementById('categories-link');
    const aboutLink = document.getElementById('about-link');
    const homeLinkMobile = document.getElementById('home-link-mobile');
    const categoriesLinkMobile = document.getElementById('categories-link-mobile');
    const aboutLinkMobile = document.getElementById('about-link-mobile');

    // Get content views
    const postsView = document.getElementById('posts-view');
    const categoriesView = document.getElementById('categories-view');
    const aboutView = document.getElementById('about-view');
    const postDetailView = document.getElementById('post-detail-view');
    
    const postsTitle = document.getElementById('posts-title');
    const showAllBtn = document.getElementById('show-all-btn');
    const backToPostsBtn = document.getElementById('back-to-posts-btn');

    // --- Post and Category Data ---
    let allPosts = [];
    let fuse; // Declare Fuse instance
    
    const postsPerPage = 5;
    let currentPostPage = 1;
    let currentFilteredPosts = [];

    const categoriesPerPage = 20;
    let currentCategoryPage = 1;
    let allUniqueCategories = [];
    
    // Function to fetch posts from JSON file
    const fetchPosts = async () => {
        try {
            const response = await fetch('./index.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allPosts = await response.json();
            currentFilteredPosts = [...allPosts];

            // Initialize Fuse.js after fetching the posts
            const options = {
                keys: ['title', 'summary'],
                threshold: 0.4
            };
            fuse = new Fuse(allPosts, options);

            showPostsByCategory('All');
        } catch (error) {
            console.error('There was a problem fetching the posts:', error);
            postsContainer.innerHTML = '<p class="text-red-500 text-center">Failed to load posts. Please try again later.</p>';
        }
    };
    
    // --- Helper Functions ---
    const showView = (viewElement) => {
        postsView.classList.add('hidden');
        categoriesView.classList.add('hidden');
        aboutView.classList.add('hidden');
        postDetailView.classList.add('hidden');
        viewElement.classList.remove('hidden');
    };

    const renderPagination = (container, currentPage, totalItems, itemsPerPage, callback) => {
        container.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.className = 'pagination-btn px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => callback(currentPage - 1));
        container.appendChild(prevBtn);

        // Page number buttons
        if (totalPages <= 3) {
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                pageBtn.className = `pagination-btn px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-200 transition-colors duration-300 ${i === currentPage ? 'active' : ''}`;
                pageBtn.addEventListener('click', () => callback(i));
                container.appendChild(pageBtn);
            }
        } else {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.textContent = 1;
            firstPageBtn.className = `pagination-btn px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-200 transition-colors duration-300 ${1 === currentPage ? 'active' : ''}`;
            firstPageBtn.addEventListener('click', () => callback(1));
            container.appendChild(firstPageBtn);

            const secondPageBtn = document.createElement('button');
            secondPageBtn.textContent = 2;
            secondPageBtn.className = `pagination-btn px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-200 transition-colors duration-300 ${2 === currentPage ? 'active' : ''}`;
            secondPageBtn.addEventListener('click', () => callback(2));
            container.appendChild(secondPageBtn);
            
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2 text-gray-500';
            container.appendChild(ellipsis);

            const lastPageBtn = document.createElement('button');
            lastPageBtn.textContent = totalPages;
            lastPageBtn.className = `pagination-btn px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-200 transition-colors duration-300 ${totalPages === currentPage ? 'active' : ''}`;
            lastPageBtn.addEventListener('click', () => callback(totalPages));
            container.appendChild(lastPageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.className = 'pagination-btn px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => callback(currentPage + 1));
        container.appendChild(nextBtn);
    };

    const renderPosts = (posts) => {
        postsContainer.innerHTML = '';
        const start = (currentPostPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const postsToDisplay = posts.slice(start, end);

        postsToDisplay.forEach((post) => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card cursor-pointer bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300';
            postCard.innerHTML = `
                <h2 class="post-title text-2xl font-semibold text-[#6f777d] mb-2 underline">${post.title}</h2>
                <p class="text-sm text-gray-500 mb-2">Published on ${post.date}</p>
                <p class="post-content text-lg text-gray-700">${post.summary}</p>
            `;
            postCard.addEventListener('click', () => showPostDetail(post));
            postsContainer.appendChild(postCard);
        });

        renderPagination(paginationControls, currentPostPage, posts.length, postsPerPage, (page) => {
            currentPostPage = page;
            renderPosts(currentFilteredPosts);
        });
    };

    const renderCategories = () => {
        categoriesContainer.innerHTML = '';
        
        // Always show the 'All Posts' button first
        const allButton = document.createElement('button');
        allButton.textContent = `All Posts (${allPosts.length})`;
        allButton.className = 'px-6 py-4 bg-white text-[#6f777d] font-semibold rounded-lg shadow-md hover:text-[#4a5054] transition-colors duration-300';
        allButton.addEventListener('click', () => showPostsByCategory('All'));
        categoriesContainer.appendChild(allButton);

        const start = (currentCategoryPage - 1) * categoriesPerPage;
        const end = start + categoriesPerPage;
        const categoriesToDisplay = allUniqueCategories.slice(start, end);

        categoriesToDisplay.forEach(category => {
            const count = allPosts.filter(p => p.category === category).length;
            const button = document.createElement('button');
            button.textContent = `${category} (${count})`;
            button.className = 'px-6 py-4 bg-white text-[#6f777d] font-semibold rounded-lg shadow-md hover:text-[#4a5054] transition-colors duration-300';
            button.addEventListener('click', () => showPostsByCategory(category));
            categoriesContainer.appendChild(button);
        });
        
        renderPagination(categoryPaginationControls, currentCategoryPage, allUniqueCategories.length, categoriesPerPage, (page) => {
            currentCategoryPage = page;
            renderCategories();
        });
    };

    const showPostsByCategory = (category) => {
        currentFilteredPosts = category === 'All' ? allPosts : allPosts.filter(post => post.category === category);
        currentPostPage = 1;
        showView(postsView);
        postsTitle.textContent = category === 'All' ? 'Latest Articles' : `Articles in "${category}"`;
        showAllBtn.classList.add('hidden');
        if (category !== 'All') {
            showAllBtn.classList.remove('hidden');
        }
        renderPosts(currentFilteredPosts);
    };

    const handleSearch = (searchTerm) => {
        // If the search term is empty, show all posts
        if (searchTerm.trim() === '') {
            currentFilteredPosts = allPosts;
        } else {
            // Use Fuse.js to perform the fuzzy search
            const results = fuse.search(searchTerm);
            // Map the results to get the original post objects
            currentFilteredPosts = results.map(result => result.item);
        }
        currentPostPage = 1;
        renderPosts(currentFilteredPosts);
    };

    const showPostDetail = async (post) => {
        try {
            // Clear previous content and show a loading message
            document.getElementById('post-detail-content').innerHTML = '<p class="text-center text-gray-500">Loading...</p>';
            showView(postDetailView);
    
            const response = await fetch(post.filepath);
            if (!response.ok) {
                throw new Error('Failed to load post content.');
            }
    
            const markdownContent = await response.text();
    
            // Convert markdown to HTML using the 'marked' library
            const htmlContent = marked.parse(markdownContent);
            
            document.getElementById('post-detail-title').textContent = post.title;
            document.getElementById('post-detail-date').textContent = `Published on ${post.date}`;
            document.getElementById('post-detail-content').innerHTML = htmlContent;
    
        } catch (error) {
            console.error('Error fetching post detail:', error);
            document.getElementById('post-detail-content').innerHTML = `<p class="text-red-500 text-center">Failed to load post content. ${error.message}</p>`;
            document.getElementById('post-detail-title').textContent = 'Error';
            document.getElementById('post-detail-date').textContent = '';
        }
    };
    
    // Initial render
    fetchPosts();
    
    // --- Event Listeners ---
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        handleSearch(searchTerm);
    });

    homeLink.addEventListener('click', () => showPostsByCategory('All'));
    homeLinkMobile.addEventListener('click', () => showPostsByCategory('All'));

    categoriesLink.addEventListener('click', () => {
        allUniqueCategories = [...new Set(allPosts.map(p => p.category))];
        currentCategoryPage = 1;
        showView(categoriesView);
        renderCategories();
    });
    categoriesLinkMobile.addEventListener('click', () => {
        allUniqueCategories = [...new Set(allPosts.map(p => p.category))];
        currentCategoryPage = 1;
        showView(categoriesView);
        renderCategories();
    });

    aboutLink.addEventListener('click', () => showView(aboutView));
    aboutLinkMobile.addEventListener('click', () => showView(aboutView));

    showAllBtn.addEventListener('click', () => showPostsByCategory('All'));
    backToPostsBtn.addEventListener('click', () => showPostsByCategory('All'));
});
