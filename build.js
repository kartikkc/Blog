const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Step 1: Build frontend (EJS)
console.log('Building frontend...');
execSync('npm run build:frontend');

// Step 2: Copy built frontend files to public directory
const publicDir = path.join(__dirname, 'public');
const frontendBuildDir = path.join(__dirname, 'views'); // Update this path if needed

console.log('Copying built frontend files to public directory...');
copyContents(frontendBuildDir, publicDir);

// Step 3: Run backend build tasks (if needed)
console.log('Running backend build tasks...');
// Add your backend build tasks here if applicable

console.log('Build process completed.');

// Function to copy contents of a directory
function copyContents(source, destination) {
    fs.readdirSync(source).forEach((file) => {
        const sourceFile = path.join(source, file);
        const destFile = path.join(destination, file);

        if (fs.statSync(sourceFile).isDirectory()) {
            fs.mkdirSync(destFile, { recursive: true });
            copyContents(sourceFile, destFile);
        } else {
            fs.copyFileSync(sourceFile, destFile);
        }
    });
}