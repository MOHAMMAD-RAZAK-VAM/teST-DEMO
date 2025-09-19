const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

// Function to open URL in default browser based on platform
function openBrowser(url) {
    let command;
    switch (process.platform) {
        case 'darwin':    // macOS
            command = `open "${url}"`;
            break;
        case 'win32':    // Windows
            command = `start "" "${url}"`;
            break;
        default:         // Linux and others
            command = `xdg-open "${url}"`;
            break;
    }
    exec(command, (error) => {
        if (error) {
            console.error('Error opening browser:', error);
        }
    });
}

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        const reportPath = path.join(__dirname, 'reports', 'test-report.html');
        
        if (fs.existsSync(reportPath)) {
            const content = fs.readFileSync(reportPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('Report not found. Please run the tests first.');
        }
    }
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Custom report server running at ${url}`);
    console.log('Opening report in your default browser...');
    openBrowser(url);
});
