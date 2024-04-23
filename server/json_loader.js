const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/db/ai_tools.db');
const toolsData = JSON.parse(fs.readFileSync('./server/data2.json'));

// Insert tools
toolsData.forEach(tool => {
    const stmt = db.prepare(`insert into tools (id, name, description, website_url, avg_rating, num_reviews, likes, date_added, last_updated,
                                                pricing) VALUES (?,?,?,?,?,?,?,current_timestamp,current_timestamp,?)`);
    let avg_rating, num_reviews, likes = 0;
    stmt.run(tool.id, tool.name, tool.description, tool.website_url, avg_rating, num_reviews, likes, tool.pricing);
    stmt.finalize();
});

// Get distinct categories and insert
const categories = [...new Set(toolsData.flatMap(t => t.categories))];
categories.forEach(name => {
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    stmt.run(name);
    stmt.finalize();
});

db.close();
const dbTools = new sqlite3.Database('./server/db/ai_tools.db');

// Insert tool/category mappings
toolsData.forEach(tool => {
    tool.categories.forEach(category => {
        const stmt = dbTools.prepare('INSERT INTO tools_categories VALUES (?, (SELECT id FROM categories WHERE name = ?))');
        stmt.run(tool.id, category);
        stmt.finalize();
    });

});

console.log('Data inserted!');
