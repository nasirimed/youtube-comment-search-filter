document.addEventListener('DOMContentLoaded', function() {
    // Chrome Web Store URL
    const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/bmmgpdofikmglfgcgnhpmpbekankhfim';
    // GitHub Repository URL - replace with your actual GitHub repo
    const GITHUB_URL = 'https://github.com/nasirimed/youtube-comment-search-filter';
    
    // Get DOM elements
    const rateBtn = document.getElementById('rateBtn');
    const githubBtn = document.getElementById('githubBtn');
    const helpBtn = document.getElementById('helpBtn');
    const status = document.getElementById('status');

    // Rate button click handler
    rateBtn.addEventListener('click', function() {
        chrome.tabs.create({ 
            url: CHROME_STORE_URL,
            active: true 
        });
        
        // Update status
        status.textContent = 'Thank you for rating! 🎉';
        status.style.color = '#059669';
        
        // Close popup after a short delay
        setTimeout(() => {
            window.close();
        }, 1000);
    });

    // GitHub button click handler
    githubBtn.addEventListener('click', function() {
        chrome.tabs.create({ 
            url: GITHUB_URL,
            active: true 
        });
        
        // Update status
        status.textContent = 'Opening source code... 💻';
        status.style.color = '#3b82f6';
        
        // Close popup after a short delay
        setTimeout(() => {
            window.close();
        }, 1000);
    });

    // Help button click handler
    helpBtn.addEventListener('click', function() {
        chrome.tabs.create({ 
            url: GITHUB_URL + '#readme',
            active: true 
        });
        
        // Update status
        status.textContent = 'Opening help documentation... 📖';
        status.style.color = '#3b82f6';
        
        // Close popup after a short delay
        setTimeout(() => {
            window.close();
        }, 1000);
    });

    // Check if extension is active on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        
        if (currentTab.url.includes('youtube.com/watch')) {
            status.textContent = 'Active on this YouTube video! 🚀';
            status.style.color = '#059669';
        } else if (currentTab.url.includes('youtube.com')) {
            status.textContent = 'Navigate to a video to use search';
            status.style.color = '#f59e0b';
        } else {
            status.textContent = 'Only works on YouTube videos';
            status.style.color = '#ef4444';
        }
    });

    // Add click tracking for analytics (optional)
    function trackClick(action) {
        // You can add analytics tracking here
        console.log('User clicked:', action);
    }

    // Add event listeners with tracking
    rateBtn.addEventListener('click', () => trackClick('rate'));
    githubBtn.addEventListener('click', () => trackClick('github'));
    helpBtn.addEventListener('click', () => trackClick('help'));
}); 