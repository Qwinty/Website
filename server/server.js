const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Create SQLite database and open connection
const db = new sqlite3.Database('./server/db/ai_tools.db');

// Serve static files (HTML, CSS, JS, etc.)
app.use(express.static('public'));

// API endpoint to retrieve tools data
app.get('/api/tools', (req, res) => {
    // Sanitize limit
    let limit = parseInt(req.query.limit) || 100;
    limit = Math.min(limit, 100);

    // Sanitize sortBy
    const allowedSorts = ['date_added', 'name', 'likes'];
    let sortBy = allowedSorts.includes(req.query.sortBy) ? req.query.sortBy : 'date_added';

    // Sanitize search
    const searchTerm = req.query.search ? req.query.search.replace(/%/g, '\\%').replace(/_/g, '\\_') : null;
    // Get categories
    const catArray = req.query.category ? req.query.category.split(',') : null;

    let sql = `
        SELECT *
        FROM tools
        ORDER BY ${sortBy} DESC LIMIT ${limit}
    `;

    if (catArray) {
        // Parameterize query to escape strings
        const catParams = catArray.map((cat) => `'${cat}'`).join(',');

        sql = `
            SELECT *
            FROM tools
            WHERE id IN (SELECT tool_id
                         FROM tools_categories
                                  JOIN categories ON categories.id = tools_categories.category_id
                         WHERE categories.id_name IN (${catParams}))
            ORDER BY ${sortBy} DESC LIMIT ${limit}
        `;
    }

    if (searchTerm) {
        sql = `
            SELECT *
            FROM tools
            WHERE name LIKE '%${searchTerm}%'
               OR description LIKE '%${searchTerm}%'
               OR id IN (SELECT tool_id
                         FROM tools_categories
                                  JOIN categories ON categories.id = tools_categories.category_id
                         WHERE categories.name LIKE '%${searchTerm}%')
            ORDER BY ${sortBy} DESC LIMIT ${limit}
        `;
    }


    if (sortBy === 'name') {
        sql = sql.replace('DESC', '');
    }

    db.all(sql, (err, tools) => {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }

        // Prepare the response
        const data = {
            tools: tools,
        };

        res.json(data);
    });
});


app.get('/api/tools_categories', (req, res) => {
    db.all('SELECT * FROM tools_categories', (err, toolsCategories) => {
        if (err) {
            return res.status(500).json({error: err.message});
        }
        const data = {toolsCategories: toolsCategories}
        res.json(data);
    });
});


app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', (err, categories) => {
        if (err) {
            return res.status(500).json({error: err.message});
        }
        res.json(categories);
    });
});


// Close the SQLite database connection when the Node.js process is terminated
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Closed the SQLite database connection.');
        process.exit(0);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
