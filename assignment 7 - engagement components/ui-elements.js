// HTML Elements - Interactive JavaScript
// This script handles all the interactive functionality for the form elements
// It demonstrates how to create real-time updates and event handling

// Wait for the DOM (Document Object Model) to be fully loaded before running any code
// This ensures all HTML elements exist before we try to access them
document.addEventListener('DOMContentLoaded', function() {
  
  // Select all range input elements (sliders) on the page using CSS selector
  // This returns a NodeList (array-like object) of all matching elements
  const sliders = document.querySelectorAll('input[type="range"]');
  
  // Get a reference to the output display div where we'll show current values
  // This element will be updated whenever any form element changes
  const output = document.getElementById('output-display');
  
  // Loop through each slider element and set up event listeners
  // forEach is a method that executes a function for each item in an array/NodeList
  sliders.forEach(slider => {
    // Find the corresponding value display element for this slider
    // We construct the ID by adding '-value' to the slider's ID
    const valueDisplay = document.getElementById(slider.id + '-value');
    
    // Add an event listener that fires whenever the slider value changes
    // 'input' event fires continuously as the user drags the slider
    slider.addEventListener('input', function() {
      // Update the text content of the value display to show current slider value
      // 'this' refers to the slider element that triggered the event
      valueDisplay.textContent = this.value;
      
      // Call the updateOutput function to refresh the main output display
      updateOutput();
    });
  });
  
  /**
   * updateOutput Function
   * Purpose: Collects current values from all form elements and displays them
   * This function is called whenever any form element changes to keep the display current
   */
  function updateOutput() {
    // Get the current value from the text input field
    // .value returns the text content of an input element
    const textInput = document.getElementById('text-input').value;
    
    // Get the current value from the email input field
    const emailInput = document.getElementById('email-input').value;
    
    // Get the current value from the first slider (0-100 range)
    const slider1Value = document.getElementById('slider-1').value;
    
    // Get the current value from the second slider (0-200 range)
    const slider2Value = document.getElementById('slider-2').value;
    
    // Get the current value from the third slider (0-10, step 2)
    const slider3Value = document.getElementById('slider-3').value;
    
    // Check if the first checkbox is checked (returns true/false)
    // .checked is a boolean property of checkbox inputs
    const checkbox1 = document.getElementById('checkbox-1').checked;
    
    // Check if the second checkbox is checked
    const checkbox2 = document.getElementById('checkbox-2').checked;
    
    // Find which radio button is currently selected
    // querySelector finds the first element matching the selector
    // ?. is optional chaining - if no radio is selected, it returns undefined
    // || 'none' provides a fallback value if no radio is selected
    const radioValue = document.querySelector('input[name="radio-group"]:checked')?.id || 'none';
    
    // Get the currently selected option from the dropdown
    const selectValue = document.getElementById('select-dropdown').value;
    
    // Update the output display with all current values
    // Template literals (backticks) allow us to embed variables in strings
    // innerHTML replaces the content of the output element
    output.innerHTML = `
      <p><strong>Current Values:</strong></p>
      <p>Text Input: "${textInput}"</p>
      <p>Email Input: "${emailInput}"</p>
      <p>Slider 1: ${slider1Value}</p>
      <p>Slider 2: ${slider2Value}</p>
      <p>Slider 3: ${slider3Value}</p>
      <p>Checkbox 1: ${checkbox1}</p>
      <p>Checkbox 2: ${checkbox2}</p>
      <p>Radio Selection: ${radioValue}</p>
      <p>Dropdown Selection: "${selectValue}"</p>
    `;
  }
  
  // Add event listeners for all interactive elements
  // These listeners call updateOutput() whenever the element changes
  
  // Listen for changes to the text input (fires on every keystroke)
  document.getElementById('text-input').addEventListener('input', updateOutput);
  
  // Listen for changes to the email input (fires on every keystroke)
  document.getElementById('email-input').addEventListener('input', updateOutput);
  
  // Listen for changes to the first checkbox (fires when checked/unchecked)
  // 'change' event fires when the checkbox state changes
  document.getElementById('checkbox-1').addEventListener('change', updateOutput);
  
  // Listen for changes to the second checkbox
  document.getElementById('checkbox-2').addEventListener('change', updateOutput);
  
  // Listen for changes to any radio button in the radio group
  // querySelectorAll returns all radio buttons with the same name
  // forEach adds the same event listener to each radio button
  document.querySelectorAll('input[name="radio-group"]').forEach(radio => {
    radio.addEventListener('change', updateOutput);
  });
  
  // Listen for changes to the dropdown selection
  document.getElementById('select-dropdown').addEventListener('change', updateOutput);
  
  // Initialize the output display with current values when the page loads
  // This ensures the display shows the initial state of all elements
  updateOutput();
}); 