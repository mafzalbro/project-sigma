const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

// Function to render EJS pages
const renderEJS = (templatePath, outputPath, data) => {
  const layoutPath = path.join(__dirname, 'views', 'layouts', 'main.ejs');
  
  // Render the EJS file with the layout
  ejs.renderFile(templatePath, { ...data, layout: layoutPath }, (err, str) => {
    if (err) {
      console.error(`Error rendering ${templatePath}:`, err);
    } else {
      fs.writeFileSync(outputPath, str);
    }
  });
};

// Recursive function to render all EJS pages
const renderPagesRecursively = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively render pages in subdirectories
      renderPagesRecursively(fullPath);
    } else if (file.endsWith('.ejs')) {
      const templatePath = fullPath;
      const outputPath = path.join(__dirname, 'public', file.replace('.ejs', '.html'));

      // Default data for rendering
      const defaultData = {
        tools: [], // Default tools array
        error: '',  // Default error message
        title: file.replace('.ejs', '').replace(/-/g, ' ').toUpperCase(), // Generate title
        user: null, // Add user as null for initial rendering
      };

      renderEJS(templatePath, outputPath, defaultData);
      console.log(`Rendered ${outputPath}`);
    }
  });
};

// Starting point for rendering
const startingDirectory = path.join(__dirname, 'views', 'pages');
renderPagesRecursively(startingDirectory);
