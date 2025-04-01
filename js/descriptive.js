document.addEventListener('DOMContentLoaded', function() {
    // Get the method from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const method = urlParams.get('method');

    // Method mapping to determine which tab and method to select
    const methodMapping = {
        'zscore': { tab: 'descriptive', method: 'zscore' },
        'ttest': { tab: 'hypothesis', method: 'ttest' },
        'chisquare': { tab: 'hypothesis', method: 'chisquare' },
        'anova': { tab: 'hypothesis', method: 'anova' },
        'pearson': { tab: 'descriptive', method: 'pearson' },
        'spearman': { tab: 'descriptive', method: 'spearman' },
        'kendall': { tab: 'descriptive', method: 'kendall' }
    };

    // Hide group selection by default
    const groupSelect = document.querySelector('.settings-group[data-for="group"]');
    if (groupSelect) {
        groupSelect.style.display = 'none';
    }

    // Initialize tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const methodLists = document.querySelectorAll('.method-list');
    const analysisSections = document.querySelectorAll('.analysis-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.getAttribute('data-section');
            
            // Update active states for tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active states for method lists
            methodLists.forEach(list => list.classList.remove('active'));
            const activeMethodList = document.getElementById(`${section.split('-')[0]}-methods`);
            if (activeMethodList) {
                activeMethodList.classList.add('active');
            }
            
            // Update active states for analysis sections
            analysisSections.forEach(section => section.classList.remove('active'));
            const activeSection = document.getElementById(section);
            if (activeSection) {
                activeSection.classList.add('active');
            }
        });
    });

    // If a method is specified in the URL, select it
    if (method && methodMapping[method]) {
        const { tab, method: methodName } = methodMapping[method];
        
        // Switch to the correct tab
        const tabButton = document.querySelector(`.tab-btn[data-section="${tab}"]`);
        if (tabButton) {
            tabButton.click();
        }

        // Select the correct method
        const methodItems = document.querySelectorAll('.method-item');
        methodItems.forEach(item => {
            if (item.querySelector('span').textContent.toLowerCase().includes(methodName)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Handle method selection
    const methodItems = document.querySelectorAll('.method-item');
    methodItems.forEach(item => {
        item.addEventListener('click', () => {
            methodItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Get the selected method
            const method = item.getAttribute('data-method');
            
            // Show/hide group selection based on method
            const groupSelect = document.querySelector('.settings-group[data-for="group"]');
            if (method === 'anova') {
                groupSelect.style.display = 'flex';
            } else {
                groupSelect.style.display = 'none';
            }
            
            // Show/hide appropriate results container
            const standardResults = document.getElementById('standard-results');
            const anovaResults = document.getElementById('anova-results');
            
            if (method === 'anova') {
                standardResults.style.display = 'none';
                anovaResults.style.display = 'block';
            } else {
                standardResults.style.display = 'block';
                anovaResults.style.display = 'none';
            }
        });
    });

    // Handle ANOVA results tab switching
    const resultsTabs = document.querySelectorAll('.results-tab');
    resultsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            
            // Update active states for tabs
            resultsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active states for views
            const views = document.querySelectorAll('.anova-view');
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`anova-${view}-view`).classList.add('active');
        });
    });

    // Handle file upload
    const uploadBtn = document.querySelector('.upload-btn');
    uploadBtn.addEventListener('click', () => {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.xls';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Handle file upload
                handleFileUpload(file);
            }
        });
        
        fileInput.click();
    });

    // Handle file upload function
    function handleFileUpload(file) {
        // Show loading state
        const previewPlaceholder = document.querySelector('.preview-placeholder');
        previewPlaceholder.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading data...</p>
        `;

        // Here you would typically handle the file upload
        // For now, we'll just simulate a delay
        setTimeout(() => {
            previewPlaceholder.innerHTML = `
                <i class="fas fa-table"></i>
                <p>Data loaded successfully</p>
            `;
            
            // Update variable selectors
            updateVariableSelectors();
        }, 1500);
    }

    // Update variable selectors
    function updateVariableSelectors() {
        // This would typically be populated with actual data
        const variables = ['Variable 1', 'Variable 2', 'Variable 3'];
        
        const variableSelect = document.querySelector('.variable-select');
        const groupSelect = document.querySelector('.group-select');
        
        // Clear existing options
        variableSelect.innerHTML = '<option value="">Select Variables</option>';
        groupSelect.innerHTML = '<option value="">Select Group</option>';
        
        // Add new options
        variables.forEach(variable => {
            variableSelect.add(new Option(variable, variable));
            groupSelect.add(new Option(variable, variable));
        });
    }
}); 