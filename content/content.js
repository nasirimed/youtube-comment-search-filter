// Main class to handle the comment search functionality
class YouTubeCommentSearch {
    constructor() {
        console.log('YouTube Comment Search & Filter: Extension initialized');
        this.searchContainer = null;
        this.searchInput = null;
        this.commentSection = null;
        this.noResultsMessage = null;
        this.currentQuery = '';
        this.originalComments = new Map(); // Store original comment states
        this.observeComments();
        this.init();
    }

    init() {
        console.log('YouTube Comment Search & Filter: Waiting for comments section...');
        // Wait for comments section to load
        this.waitForComments().then(() => {
            console.log('YouTube Comment Search & Filter: Comments section found, injecting UI...');
            this.injectSearchUI();
            this.setupEventListeners();
        });
    }

    waitForComments() {
        return new Promise(resolve => {
            const checkComments = () => {
                console.log('Attempting to find comments section...');
                // Updated selector to match YouTube's structure
                const commentsSection = document.querySelector('ytd-comments#comments');
                const commentsList = commentsSection?.querySelector('ytd-item-section-renderer');
                
                if (commentsSection && commentsList) {
                    console.log('Comments section found:', commentsSection);
                    this.commentSection = commentsSection;
                    resolve();
                } else {
                    console.log('Comments section not found, retrying in 1s...');
                    setTimeout(checkComments, 1000);
                }
            };
            checkComments();
        });
    }

    injectSearchUI() {
        console.log('YouTube Comment Search & Filter: Attempting to inject search UI');
        
        if (!this.commentSection) {
            console.error('Cannot inject UI: Comments section not found');
            this.showErrorMessage('Could not initialize comment search (Comments section not found)');
            return;
        }
        
        // Create search container
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'yt-comment-search-container';
        
        // Create search input wrapper for input and button
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'yt-comment-search-wrapper';
        
        // Create search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search comments...';
        this.searchInput.className = 'yt-comment-search-input';

        // Create search button
        const searchButton = document.createElement('button');
        searchButton.className = 'yt-comment-search-button';
        searchButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false">
                <path d="M20.87 20.17l-5.59-5.59C16.35 13.35 17 11.75 17 10c0-3.87-3.13-7-7-7s-7 3.13-7 7 3.13 7 7 7c1.75 0 3.35-.65 4.58-1.71l5.59 5.59.7-.71zM10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"></path>
            </svg>
        `;
        
        // Create results counter
        this.resultsCounter = document.createElement('div');
        this.resultsCounter.className = 'yt-comment-results-counter';
        this.resultsCounter.style.display = 'none';
        
        // Add input and button to wrapper
        searchWrapper.appendChild(this.searchInput);
        searchWrapper.appendChild(searchButton);

        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'yt-comment-filter-container';
        
        // Create "No results" message
        this.noResultsMessage = document.createElement('div');
        this.noResultsMessage.className = 'yt-comment-no-results';
        this.noResultsMessage.textContent = 'No comments found matching your search.';
        this.noResultsMessage.style.display = 'none';

        // Create error message container
        this.errorMessage = document.createElement('div');
        this.errorMessage.className = 'yt-comment-error';
        this.errorMessage.style.display = 'none';
        
        // Add elements to the page
        this.searchContainer.appendChild(searchWrapper);
        this.searchContainer.appendChild(this.resultsCounter);  // Add counter after search wrapper
        this.searchContainer.appendChild(filterContainer);
        this.searchContainer.appendChild(this.noResultsMessage);
        this.searchContainer.appendChild(this.errorMessage);
        
        // Find the comments section header
        const header = this.commentSection.querySelector('ytd-comments-header-renderer');
        if (header) {
            console.log('YouTube Comment Search & Filter: Found comments header, injecting UI');
            header.parentNode.insertBefore(this.searchContainer, header.nextSibling);
            console.log('YouTube Comment Search & Filter: Search UI successfully injected');
        } else {
            console.log('YouTube Comment Search & Filter: No header found, using fallback injection');
            this.commentSection.insertBefore(this.searchContainer, this.commentSection.firstChild);
            console.log('YouTube Comment Search & Filter: Search UI injected using fallback method');
        }
    }

    setupEventListeners() {
        // Search on button click
        const searchButton = this.searchContainer.querySelector('.yt-comment-search-button');
        searchButton.addEventListener('click', () => {
            this.filterComments(this.searchInput.value);
        });

        // Search on Enter key press
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterComments(this.searchInput.value);
            }
        });

        // Clear results when input is empty
        this.searchInput.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                this.resetHighlighting();
            }
        });
    }

    observeComments() {
        // Create observer to watch for new comments being added
        const observer = new MutationObserver((mutations) => {
            // Only process mutations that add new comments
            const hasNewComments = mutations.some(mutation => 
                Array.from(mutation.addedNodes).some(node => 
                    node.tagName === 'YTD-COMMENT-THREAD-RENDERER'
                )
            );

            if (hasNewComments && this.currentQuery) {
                console.log('New comments detected, updating filter');
                this.filterComments(this.currentQuery);
            }
            insertSearchForm();
        });

        // Start observing once comments section is found
        const startObserving = () => {
            const commentsSection = document.querySelector('ytd-comments#comments ytd-item-section-renderer #contents');
            if (commentsSection) {
                console.log('Setting up comment section observer');
                observer.observe(commentsSection, {
                    childList: true,
                    subtree: false // Only watch for direct children
                });
            } else {
                setTimeout(startObserving, 1000);
            }
        };

        startObserving();
    }

    async filterComments(query) {
        if (!query.trim()) {
            this.resetHighlighting();
            return;
        }

        console.log('Starting comment filtering with query:', query);
        this.currentQuery = query.trim().toLowerCase();
        
        if (!this.commentSection) {
            console.error('Comment section not found during filtering!');
            this.showErrorMessage('Comments section not found. Try refreshing the page.');
            return;
        }

        // Clear any previous error messages
        this.hideErrorMessage();

        let matchFound = false;
        let totalComments = 0;
        let matchedComments = 0;
        let hiddenRepliesCount = 0;

        // Get all top-level comments and their replies
        const commentThreads = this.commentSection.querySelectorAll('ytd-comment-thread-renderer');
        
        if (commentThreads.length === 0) {
            this.showErrorMessage('No comments found. Try scrolling down to load comments.');
            return;
        }

        commentThreads.forEach((thread) => {
            const mainComment = thread.querySelector('ytd-comment-view-model');
            const repliesContainer = thread.querySelector('#replies');
            const replyCount = thread.querySelector('#more-replies #text')?.textContent;
            
            thread.style.setProperty('display', 'none', 'important');
            totalComments++;
            
            const mainCommentMatches = this.doesCommentMatch(mainComment, this.currentQuery);
            
            let repliesMatch = false;
            // Only check expanded replies
            if (repliesContainer && repliesContainer.children.length > 0) {
                const replies = repliesContainer.querySelectorAll('ytd-comment-view-model');
                
                replies.forEach(reply => {
                    totalComments++;
                    const replyMatches = this.doesCommentMatch(reply, this.currentQuery);
                    if (replyMatches) {
                        matchedComments++;
                        reply.style.removeProperty('display');
                    } else {
                        reply.style.setProperty('display', 'none', 'important');
                    }
                    repliesMatch = repliesMatch || replyMatches;
                });
            } else if (replyCount && !replyCount.includes('0')) {
                // Count hidden replies
                const count = parseInt(replyCount) || 0;
                hiddenRepliesCount += count;
            }

            const shouldShowThread = mainCommentMatches || repliesMatch;
            if (shouldShowThread) {
                thread.style.removeProperty('display');
                if (mainCommentMatches) {
                    matchedComments++;
                }
            }
            
            matchFound = matchFound || shouldShowThread;
        });

        // Show/hide no results message with hidden replies info
        if (!matchFound) {
            const message = hiddenRepliesCount > 0 
                ? `No visible comments found matching your search. There are ${hiddenRepliesCount} hidden replies that might contain matches.`
                : 'No comments found matching your search.';
            this.noResultsMessage.textContent = message;
            this.noResultsMessage.style.display = 'block';
        } else {
            this.noResultsMessage.style.display = 'none';
        }
        
        // Update results counter
        if (matchFound) {
            this.resultsCounter.textContent = `Found ${matchedComments} matching comment${matchedComments !== 1 ? 's' : ''}${
                hiddenRepliesCount > 0 ? ` (${hiddenRepliesCount} hidden replies not searched)` : ''
            }`;
            this.resultsCounter.style.display = 'block';
        } else {
            this.resultsCounter.style.display = 'none';
        }
        
        console.log('Filter complete:', {
            totalThreads: commentThreads.length,
            totalComments,
            matchedComments,
            matchFound,
            hiddenRepliesCount
        });
    }

    doesCommentMatch(commentElement, query) {
        if (!commentElement || !query) return true;

        // Updated selectors based on YouTube's actual DOM structure
        const commentText = commentElement.querySelector('yt-attributed-string#content-text');
        const authorElement = commentElement.querySelector('#author-text');
        
        if (!commentText) {
            console.log('Comment text element not found');
            return false;
        }

        // Get the actual text content
        const text = commentText.textContent.toLowerCase();
        // Get author name from the span inside author-text
        const authorName = authorElement ? 
            authorElement.querySelector('span.style-scope.ytd-comment-view-model').textContent.trim().toLowerCase() : '';

         
        const matches = text.includes(query) || authorName.includes(query);
        
        if (matches) {
            // Highlight the text while preserving YouTube's formatting
            const highlightedHTML = this.highlightText(commentText.textContent, query);
            commentText.innerHTML = highlightedHTML;
        }

        return matches;
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="yt-comment-highlight">$1</span>');
    }

    resetHighlighting() {
        console.log('Resetting comment visibility and highlighting');
        // Updated selector to use ytd-comment-view-model
        const comments = this.commentSection.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-view-model');
        
        comments.forEach(comment => {
            comment.style.removeProperty('display');
            const commentText = comment.querySelector('yt-attributed-string#content-text');
            if (commentText) {
                commentText.textContent = commentText.textContent;
            }
        });
        
        this.currentQuery = '';
        this.noResultsMessage.style.display = 'none';
        this.resultsCounter.style.display = 'none';  // Hide counter on reset
    }

    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            this.noResultsMessage.style.display = 'none';
        }
    }

    hideErrorMessage() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }
}

function createSearchForm() {
    const container = document.createElement('div');
    container.className = 'yt-comment-search-container';

    const form = document.createElement('form');
    form.className = 'yt-comment-search-form';

    const wrapper = document.createElement('div');
    wrapper.className = 'yt-comment-search-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'yt-comment-search-input';
    input.placeholder = 'Search comments...';

    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.className = 'yt-comment-search-button';
    searchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false">
            <path d="M20.87 20.17l-5.59-5.59C16.35 13.35 17 11.75 17 10c0-3.87-3.13-7-7-7s-7 3.13-7 7 3.13 7 7 7c1.75 0 3.35-.65 4.58-1.71l5.59 5.59.7-.71zM10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"></path>
        </svg>
    `;

    wrapper.appendChild(input);
    wrapper.appendChild(searchButton);
    form.appendChild(wrapper);
    container.appendChild(form);

    // Add event listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        searchComments(input.value);
    });

    searchButton.addEventListener('click', () => {
        searchComments(input.value);
    });

    input.addEventListener('input', () => {
        if (!input.value.trim()) {
            searchComments('');
        }
    });

    return container;
}

function insertSearchForm() {
    const commentsSection = document.querySelector('#comments');
    if (!commentsSection) return;

    const existingForm = document.querySelector('.yt-comment-search-container');
    if (existingForm) return;

    // Find the comments header
    const header = commentsSection.querySelector('ytd-comments-header-renderer');
    if (!header) return;

    const searchForm = createSearchForm();
    
    // Insert after the header instead of at the top
    header.parentNode.insertBefore(searchForm, header.nextSibling);
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new YouTubeCommentSearch());
} else {
    new YouTubeCommentSearch();
} 