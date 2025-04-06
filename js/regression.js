// DOM Elements
const fileSelect = document.getElementById('fileSelect');
const variablesList = document.getElementById('variablesList');
const scatterPlotContainer = document.getElementById('scatterPlotContainer');
const dependentVarSelect = document.getElementById('dependentVar');
const groupingVarSelect = document.getElementById('groupingVar');
const fixedEffectsVars = document.getElementById('fixedEffectsVars');
const mainEffects = document.getElementById('mainEffects');
const interactionTerms = document.getElementById('interactionTerms');
const addInteractionBtn = document.getElementById('addInteraction');
const randomIntercepts = document.getElementById('randomIntercepts');
const randomSlopes = document.getElementById('randomSlopes');
const runModelBtn = document.getElementById('runModel');

// State Management
let currentData = null;
let currentVariables = [];
let selectedInteractions = [];
let availableFiles = {
    'file1.csv': { 'age': [25, 30, 35, 40, 45], 'income': [50000, 55000, 60000, 65000, 70000], 'education': [12, 14, 16, 18, 20] },
    'file2.csv': { 'weight': [70, 75, 80, 85, 90], 'height': [170, 175, 180, 185, 190], 'bmi': [24.2, 24.5, 24.7, 24.8, 25.0] },
    'file3.csv': { 'sales': [1200, 1500, 1800, 2100, 2400], 'advertising': [500, 600, 700, 800, 900], 'customers': [120, 150, 180, 210, 240] },
    'file4.csv': { 'satisfaction': [7, 8, 6, 9, 7], 'retention': [0.7, 0.8, 0.6, 0.9, 0.7], 'support_calls': [2, 1, 3, 0, 2] }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeCollapsible();
    initializeTabs();
    setupEventListeners();
});

// Collapsible Panels
function initializeCollapsible() {
    document.querySelectorAll('.collapsible h3').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    });
}

// Tabs
function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabGroup = e.target.closest('div');
            tabGroup.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateTabContent(e.target.dataset.tab);
        });
    });
}

// Event Listeners
function setupEventListeners() {
    fileSelect.addEventListener('change', handleFileSelect);
    addInteractionBtn.addEventListener('click', handleAddInteraction);
    runModelBtn.addEventListener('click', handleRunModel);
    
    // Variable selection events
    dependentVarSelect.addEventListener('change', updateScatterPlot);
    groupingVarSelect.addEventListener('change', updateScatterPlot);
}

// File Handling
function handleFileSelect() {
    const selectedFile = fileSelect.value;
    
    if (selectedFile && availableFiles[selectedFile]) {
        currentData = availableFiles[selectedFile];
        currentVariables = Object.keys(currentData);
        
        updateVariableSelectors();
        updateScatterPlot();
    } else {
        currentData = null;
        currentVariables = [];
        clearVariableSelectors();
    }
}

// Clear UI Elements
function clearVariableSelectors() {
    [dependentVarSelect, groupingVarSelect].forEach(select => {
        select.innerHTML = '<option value="">Select Variable</option>';
    });
    
    [fixedEffectsVars, mainEffects, interactionTerms].forEach(container => {
        container.innerHTML = '';
    });
}

// Update UI Elements
function updateVariableSelectors() {
    // Clear existing options
    [dependentVarSelect, groupingVarSelect].forEach(select => {
        select.innerHTML = '<option value="">Select Variable</option>';
    });
    
    // Add variables to selectors
    currentVariables.forEach(variable => {
        const option = document.createElement('option');
        option.value = variable;
        option.textContent = variable;
        
        dependentVarSelect.appendChild(option.cloneNode(true));
        groupingVarSelect.appendChild(option.cloneNode(true));
    });
    
    // Update multi-select areas
    updateMultiSelect(fixedEffectsVars, currentVariables);
    updateMultiSelect(mainEffects, currentVariables);
    updateMultiSelect(interactionTerms, currentVariables);
}

function updateMultiSelect(container, options) {
    container.innerHTML = '';
    options.forEach(option => {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-item';
        checkbox.innerHTML = `
            <input type="checkbox" id="${option}" value="${option}">
            <label for="${option}">${option}</label>
        `;
        container.appendChild(checkbox);
    });
}

// Scatter Plot
function updateScatterPlot() {
    if (!currentData || !dependentVarSelect.value) return;
    
    const xVar = dependentVarSelect.value;
    const groupVar = groupingVarSelect.value;
    
    const trace = {
        x: currentData[xVar],
        y: currentData[groupVar] || Array(currentData[xVar].length).fill(1),
        mode: 'markers',
        type: 'scatter',
        marker: { 
            size: 10,
            color: 'rgba(108, 92, 231, 0.7)',
            line: {
                color: 'rgba(108, 92, 231, 1)',
                width: 1
            }
        }
    };
    
    const layout = {
        title: {
            text: 'Variable Relationship',
            font: {
                family: 'Raleway, sans-serif'
            }
        },
        xaxis: { 
            title: xVar,
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: groupVar || 'Value',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 50, r: 30, l: 60, b: 50 },
        hovermode: 'closest',
        autosize: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(scatterPlotContainer, [trace], layout, config);
}

// Model Building
function handleAddInteraction() {
    const selectedVars = Array.from(interactionTerms.querySelectorAll('input:checked'))
        .map(input => input.value);
    
    if (selectedVars.length < 2) {
        alert('Please select at least 2 variables for interaction');
        return;
    }
    
    selectedInteractions.push(selectedVars);
    updateInteractionsList();
}

function updateInteractionsList() {
    const container = document.createElement('div');
    container.className = 'selected-interactions';
    
    selectedInteractions.forEach((interaction, index) => {
        const interactionElement = document.createElement('div');
        interactionElement.className = 'interaction-term';
        interactionElement.textContent = interaction.join(' × ');
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            selectedInteractions.splice(index, 1);
            updateInteractionsList();
        };
        
        interactionElement.appendChild(removeBtn);
        container.appendChild(interactionElement);
    });
    
    const existingContainer = document.querySelector('.selected-interactions');
    if (existingContainer) {
        existingContainer.replaceWith(container);
    } else {
        interactionTerms.parentNode.appendChild(container);
    }
}

// Model Execution
async function handleRunModel() {
    try {
        runModelBtn.disabled = true;
        runModelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
        
        // Gather model parameters
        const modelParams = {
            dependent: dependentVarSelect.value,
            grouping: groupingVarSelect.value,
            fixedEffects: getSelectedValues(fixedEffectsVars),
            mainEffects: getSelectedValues(mainEffects),
            interactions: selectedInteractions,
            randomIntercepts: getSelectedValues(randomIntercepts),
            randomSlopes: getSelectedValues(randomSlopes),
            covStructure: document.getElementById('covStructure').value,
            estimationMethod: document.getElementById('estimationMethod').value,
            maxIter: document.getElementById('maxIter').value,
            convTol: document.getElementById('convTol').value
        };
        
        // Validate parameters
        if (!validateModelParams(modelParams)) {
            throw new Error('Invalid model parameters');
        }
        
        // Run model (implementation needed)
        const results = await runRegressionModel(modelParams);
        
        // Update results display
        updateResults(results);
        
    } catch (error) {
        console.error('Error running model:', error);
        alert('Error running model. Please check your parameters and try again.');
    } finally {
        runModelBtn.disabled = false;
        runModelBtn.innerHTML = '<i class="fas fa-play"></i> Run Model';
    }
}

// Utility Functions
function getSelectedValues(container) {
    return Array.from(container.querySelectorAll('input:checked'))
        .map(input => input.value);
}

function validateModelParams(params) {
    if (!params.dependent) {
        alert('Please select a dependent variable');
        return false;
    }
    
    if (params.fixedEffects.length === 0 && params.mainEffects.length === 0) {
        alert('Please select at least one fixed effect or main effect');
        return false;
    }
    
    return true;
}

// Model Running (implementation needed)
async function runRegressionModel(params) {
    // Implementation needed
    // Return results object with coefficients, statistics, etc.
    return {};
}

// Results Display
function updateResults(results) {
    // For demonstration, create mock results
    const mockResults = {
        summary: {
            r2: 0.78,
            adjR2: 0.76,
            rmse: 2.34,
            aic: 187.5
        },
        coefficients: [
            { term: 'Intercept', estimate: 12.45, stdError: 1.23, tValue: 10.12, pValue: 0.0001 },
            { term: 'Age', estimate: 0.34, stdError: 0.05, tValue: 6.8, pValue: 0.0002 },
            { term: 'Income', estimate: 0.0002, stdError: 0.0001, tValue: 2.0, pValue: 0.046 },
            { term: 'Education', estimate: 1.23, stdError: 0.45, tValue: 2.73, pValue: 0.009 },
            { term: 'Age:Income', estimate: -0.00001, stdError: 0.00001, tValue: -1.0, pValue: 0.32 }
        ]
    };
    
    // Clear existing content
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.innerHTML = '';
    
    // Create content divs for each tab
    const summaryContent = document.createElement('div');
    summaryContent.id = 'summary-content';
    
    const coefficientsContent = document.createElement('div');
    coefficientsContent.id = 'coefficients-content';
    coefficientsContent.style.display = 'none';
    
    const diagnosticsContent = document.createElement('div');
    diagnosticsContent.id = 'diagnostics-content';
    diagnosticsContent.style.display = 'none';
    
    // Build summary content
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'results-summary';
    
    const summaryStats = [
        { label: 'R²', value: mockResults.summary.r2.toFixed(3) },
        { label: 'Adjusted R²', value: mockResults.summary.adjR2.toFixed(3) },
        { label: 'RMSE', value: mockResults.summary.rmse.toFixed(3) },
        { label: 'AIC', value: mockResults.summary.aic.toFixed(1) }
    ];
    
    summaryStats.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.className = 'summary-stat';
        statDiv.innerHTML = `
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        `;
        summaryDiv.appendChild(statDiv);
    });
    
    summaryContent.appendChild(summaryDiv);
    
    // Build coefficients content
    const coeffTable = document.createElement('table');
    coeffTable.className = 'coefficient-table';
    
    const tableHead = document.createElement('thead');
    tableHead.innerHTML = `
        <tr>
            <th>Term</th>
            <th>Estimate</th>
            <th>Std. Error</th>
            <th>t-value</th>
            <th>p-value</th>
        </tr>
    `;
    
    const tableBody = document.createElement('tbody');
    mockResults.coefficients.forEach(coef => {
        const isSignificant = coef.pValue < 0.05;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coef.term}</td>
            <td>${coef.estimate.toFixed(4)}</td>
            <td>${coef.stdError.toFixed(4)}</td>
            <td>${coef.tValue.toFixed(2)}</td>
            <td class="${isSignificant ? 'significant' : 'not-significant'}">${coef.pValue.toFixed(4)}</td>
        `;
        tableBody.appendChild(row);
    });
    
    coeffTable.appendChild(tableHead);
    coeffTable.appendChild(tableBody);
    coefficientsContent.appendChild(coeffTable);
    
    // Build diagnostics content
    const diagnosticsPlots = document.createElement('div');
    diagnosticsPlots.className = 'diagnostic-plots';
    
    const plots = [
        'Residuals vs Fitted',
        'QQ Plot',
        'Scale-Location',
        'Residuals vs Leverage'
    ];
    
    plots.forEach(plot => {
        const plotDiv = document.createElement('div');
        plotDiv.className = 'diagnostic-plot';
        plotDiv.id = `diagnostic-${plot.toLowerCase().replace(/\s+/g, '-')}`;
        diagnosticsPlots.appendChild(plotDiv);
        
        // We'll create mock plots in another function
        createDiagnosticPlot(plotDiv.id, plot);
    });
    
    diagnosticsContent.appendChild(diagnosticsPlots);
    
    // Add all content divs to results
    resultsContent.appendChild(summaryContent);
    resultsContent.appendChild(coefficientsContent);
    resultsContent.appendChild(diagnosticsContent);
    
    // Update visualization content
    updateVisualizationContent();
}

// Create diagnostic plots
function createDiagnosticPlot(id, title) {
    // Create mock data for diagnostic plots
    const x = Array.from({length: 50}, (_, i) => i * 0.2 - 5);
    let y;
    
    // Different patterns for different plots
    switch(title) {
        case 'Residuals vs Fitted':
            y = x.map(val => 2 * Math.random() - 1);
            break;
        case 'QQ Plot':
            y = x.map(val => val + (Math.random() - 0.5) * 0.5);
            break;
        case 'Scale-Location':
            y = x.map(val => Math.abs(Math.sin(val) + (Math.random() - 0.5) * 0.3));
            break;
        case 'Residuals vs Leverage':
            y = x.map(val => 0.1 / (Math.abs(val) + 0.1) * (Math.random() + 0.5));
            break;
        default:
            y = x.map(val => Math.random());
    }
    
    const trace = {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 8,
            color: 'rgba(108, 92, 231, 0.7)',
            line: {
                color: 'rgba(108, 92, 231, 1)',
                width: 1
            }
        }
    };
    
    const layout = {
        title: {
            text: title,
            font: {
                family: 'Raleway, sans-serif',
                size: 14
            }
        },
        xaxis: { 
            title: title.includes('Fitted') ? 'Fitted Values' : 
                  title === 'QQ Plot' ? 'Theoretical Quantiles' :
                  title.includes('Leverage') ? 'Leverage' : 'Index',
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: title.includes('Residuals') ? 'Residuals' : 
                  title === 'QQ Plot' ? 'Sample Quantiles' :
                  title === 'Scale-Location' ? 'Sqrt(|Standardized Residuals|)' : 'Value',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 40, r: 10, l: 50, b: 40 },
        autosize: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(id, [trace], layout, config);
}

// Update visualization content
function updateVisualizationContent() {
    // Clear existing content
    const vizContent = document.getElementById('vizContent');
    vizContent.innerHTML = '';
    
    // Create content divs for each tab
    const fittedLineContent = document.createElement('div');
    fittedLineContent.id = 'fittedLine-content';
    
    const residualsContent = document.createElement('div');
    residualsContent.id = 'residuals-content';
    residualsContent.style.display = 'none';
    
    const effectsContent = document.createElement('div');
    effectsContent.id = 'effects-content';
    effectsContent.style.display = 'none';
    
    // Build fitted line plot
    const fittedLineDiv = document.createElement('div');
    fittedLineDiv.id = 'fitted-line-plot';
    fittedLineDiv.style.height = '400px';
    fittedLineContent.appendChild(fittedLineDiv);
    
    // Create mock fitted line plot
    createFittedLinePlot('fitted-line-plot');
    
    // Build residuals plots
    const residualsDiv = document.createElement('div');
    residualsDiv.id = 'residuals-plot';
    residualsDiv.style.height = '400px';
    residualsContent.appendChild(residualsDiv);
    
    // Create mock residuals plot
    createResidualsPlot('residuals-plot');
    
    // Build effects plots
    const effectsPlots = document.createElement('div');
    effectsPlots.className = 'effects-plots';
    
    // Main effects
    const mainEffectsSelected = getSelectedValues(mainEffects);
    mainEffectsSelected.forEach(effect => {
        const plotDiv = document.createElement('div');
        plotDiv.className = 'effect-plot';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'effect-plot-title';
        titleDiv.textContent = `Main Effect: ${effect}`;
        
        const chartDiv = document.createElement('div');
        chartDiv.id = `effect-${effect.toLowerCase()}`;
        chartDiv.style.height = '300px';
        
        plotDiv.appendChild(titleDiv);
        plotDiv.appendChild(chartDiv);
        effectsPlots.appendChild(plotDiv);
        
        // Create mock effect plot
        createEffectPlot(`effect-${effect.toLowerCase()}`, effect);
    });
    
    // Interaction effects
    selectedInteractions.forEach((interaction, idx) => {
        const plotDiv = document.createElement('div');
        plotDiv.className = 'effect-plot';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'effect-plot-title';
        titleDiv.textContent = `Interaction: ${interaction.join(' × ')}`;
        
        const chartDiv = document.createElement('div');
        chartDiv.id = `interaction-${idx}`;
        chartDiv.style.height = '300px';
        
        plotDiv.appendChild(titleDiv);
        plotDiv.appendChild(chartDiv);
        effectsPlots.appendChild(plotDiv);
        
        // Create mock interaction plot
        createInteractionPlot(`interaction-${idx}`, interaction);
    });
    
    effectsContent.appendChild(effectsPlots);
    
    // Add all content divs to visualization
    vizContent.appendChild(fittedLineContent);
    vizContent.appendChild(residualsContent);
    vizContent.appendChild(effectsContent);
}

// Create fitted line plot
function createFittedLinePlot(id) {
    // Mock data
    const xVar = dependentVarSelect.value;
    if (!xVar || !currentData) return;
    
    const x = currentData[xVar];
    
    // Generate mock fitted values
    const yFitted = x.map(val => 5 + 0.5 * val + (Math.random() - 0.5) * 3);
    
    // Data points trace
    const dataTrace = {
        x: x,
        y: yFitted,
        mode: 'markers',
        type: 'scatter',
        name: 'Data',
        marker: {
            size: 10,
            color: 'rgba(108, 92, 231, 0.7)',
            line: {
                color: 'rgba(108, 92, 231, 1)',
                width: 1
            }
        }
    };
    
    // Generate line of best fit
    const xLine = [Math.min(...x), Math.max(...x)];
    const yLine = xLine.map(val => 5 + 0.5 * val);
    
    // Line trace
    const lineTrace = {
        x: xLine,
        y: yLine,
        mode: 'lines',
        type: 'scatter',
        name: 'Fitted Line',
        line: {
            color: 'rgba(0, 206, 201, 1)',
            width: 3
        }
    };
    
    const layout = {
        title: {
            text: 'Fitted Regression Line',
            font: {
                family: 'Raleway, sans-serif'
            }
        },
        xaxis: { 
            title: xVar,
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: 'Fitted Values',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 50, r: 20, l: 60, b: 50 },
        autosize: true,
        legend: {
            x: 0.05,
            y: 0.95,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            bordercolor: 'rgba(255, 255, 255, 0.2)',
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(id, [dataTrace, lineTrace], layout, config);
}

// Create residuals plot
function createResidualsPlot(id) {
    // Mock data for residuals
    const x = Array.from({length: 50}, (_, i) => i);
    const residuals = x.map(_ => (Math.random() - 0.5) * 4);
    
    const trace = {
        x: x,
        y: residuals,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 10,
            color: 'rgba(108, 92, 231, 0.7)',
            line: {
                color: 'rgba(108, 92, 231, 1)',
                width: 1
            }
        }
    };
    
    // Add horizontal zero line
    const zeroLine = {
        x: [0, x.length - 1],
        y: [0, 0],
        mode: 'lines',
        type: 'scatter',
        line: {
            color: 'rgba(253, 121, 168, 0.7)',
            width: 2,
            dash: 'dash'
        }
    };
    
    const layout = {
        title: {
            text: 'Residuals Plot',
            font: {
                family: 'Raleway, sans-serif'
            }
        },
        xaxis: { 
            title: 'Index',
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: 'Residuals',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 50, r: 20, l: 60, b: 50 },
        autosize: true
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(id, [trace, zeroLine], layout, config);
}

// Create effect plot
function createEffectPlot(id, variable) {
    if (!currentData || !currentData[variable]) return;
    
    // Get unique x values or create bins for continuous variables
    const xValues = [...new Set(currentData[variable])].sort((a, b) => a - b);
    
    // Mock y values (effect sizes)
    const yValues = xValues.map(x => 2 + 0.3 * x + (Math.random() - 0.5) * 0.2);
    
    // Confidence intervals (mock)
    const yUpper = yValues.map(y => y + 0.2 + Math.random() * 0.1);
    const yLower = yValues.map(y => y - 0.2 - Math.random() * 0.1);
    
    // Main effect trace
    const effectTrace = {
        x: xValues,
        y: yValues,
        mode: 'lines+markers',
        type: 'scatter',
        name: variable,
        line: {
            color: 'rgba(0, 206, 201, 1)',
            width: 3
        },
        marker: {
            size: 8,
            color: 'rgba(0, 206, 201, 1)'
        }
    };
    
    // Upper CI
    const upperTrace = {
        x: xValues,
        y: yUpper,
        mode: 'lines',
        line: {
            color: 'rgba(0, 206, 201, 0.3)',
            width: 0
        },
        showlegend: false
    };
    
    // Lower CI
    const lowerTrace = {
        x: xValues,
        y: yLower,
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(0, 206, 201, 0.2)',
        line: {
            color: 'rgba(0, 206, 201, 0.3)',
            width: 0
        },
        showlegend: false
    };
    
    const layout = {
        title: {
            text: `Effect of ${variable}`,
            font: {
                family: 'Raleway, sans-serif',
                size: 14
            }
        },
        xaxis: { 
            title: variable,
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: 'Effect',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 30, r: 10, l: 40, b: 40 },
        autosize: true,
        showlegend: false
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(id, [lowerTrace, upperTrace, effectTrace], layout, config);
}

// Create interaction plot
function createInteractionPlot(id, variables) {
    if (!currentData || variables.length < 2) return;
    
    // For simplicity, we'll only consider the first two variables in the interaction
    const xVar = variables[0];
    const groupVar = variables[1];
    
    if (!currentData[xVar] || !currentData[groupVar]) return;
    
    // Get unique values for grouping variable
    const groups = [...new Set(currentData[groupVar])].sort((a, b) => a - b);
    
    // Mock data generation
    const traces = groups.map((group, index) => {
        // For each group, generate a trend line
        const x = Array.from({length: 10}, (_, i) => i + (Math.random() - 0.5) * 0.2);
        const slope = 0.5 + index * 0.2; // Different slope for each group
        const y = x.map(val => 2 + slope * val + (Math.random() - 0.5) * 0.3);
        
        return {
            x: x,
            y: y,
            mode: 'lines+markers',
            type: 'scatter',
            name: `${groupVar} = ${group}`,
            line: {
                width: 2
            },
            marker: {
                size: 6
            }
        };
    });
    
    const layout = {
        title: {
            text: `Interaction: ${variables.join(' × ')}`,
            font: {
                family: 'Raleway, sans-serif',
                size: 14
            }
        },
        xaxis: { 
            title: xVar,
            gridcolor: 'transparent'
        },
        yaxis: { 
            title: 'Effect',
            gridcolor: 'transparent'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 30, r: 10, l: 40, b: 40 },
        autosize: true,
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            bordercolor: 'rgba(255, 255, 255, 0.2)',
            borderwidth: 1,
            font: {
                size: 10
            }
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(id, traces, layout, config);
}

// Update tab content
function updateTabContent(tab) {
    // Results tabs
    if (document.querySelector('.results-tabs .tab-btn.active')) {
        const activeTab = document.querySelector('.results-tabs .tab-btn.active').dataset.tab;
        document.querySelectorAll('#resultsContent > div').forEach(div => {
            div.style.display = 'none';
        });
        document.getElementById(`${activeTab}-content`).style.display = 'block';
    }
    
    // Visualization tabs
    if (document.querySelector('.viz-tabs .tab-btn.active')) {
        const activeVizTab = document.querySelector('.viz-tabs .tab-btn.active').dataset.tab;
        document.querySelectorAll('#vizContent > div').forEach(div => {
            div.style.display = 'none';
        });
        document.getElementById(`${activeVizTab}-content`).style.display = 'block';
    }
} 