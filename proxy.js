
const api = require('@actual-app/api');
const net = require('net')
const fs = require('fs')

const SOCK_FILE = process.env.ACTUAL_SOCK_FILE || '/tmp/actual-proxy.sock'
try {
    fs.unlinkSync(SOCK_FILE);
} catch (error) { }

function requireAndLog(value, name) {
    // FOR DEBUGGING: console.log(`${name}: ${value}`);
    if (!value){
        console.log(`${name} is required`);
        process.exit()
    }
}

async function proxy(conn, config) {
    const serverURL = config.serverURL || process.env.ACTUAL_SERVER_URL || 'https://localhost:5006';
    requireAndLog(serverURL, 'ACTUAL_SERVER_URL');
    const dataDir = config.dataDir || process.env.ACTUAL_BUDGET_DATA_DIR || path.join(__dirname, '/budget');
    requireAndLog(serverURL, 'ACTUAL_BUDGET_DATA_DIR');
    const password = config.password || process.env.ACTUAL_BUDGET_PASSWORD;
    requireAndLog(serverURL, 'ACTUAL_BUDGET_PASSWORD');
    const budgetSyncId = config.budgetSyncId || process.env.ACTUAL_BUDGET_SYNC_ID;
    requireAndLog(serverURL, 'ACTUAL_BUDGET_SYNC_ID');
    const categories = config.categories || (process.env.ACTUAL_BUDGET_CATEGORIES || '').split(',').map(c => c.trim());
    requireAndLog(serverURL, 'ACTUAL_BUDGET_CATEGORIES');
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
        }
        await api.init({ dataDir, serverURL, password });
        await api.downloadBudget(budgetSyncId);
        const budgetMonth = /^\d{4}-\d{2}/.exec(new Date().toISOString()).toString();
        const budget = await api.getBudgetMonth(budgetMonth);
        const parsedBudget = { categories: [] };
        for (const categoryGroup of (budget.categoryGroups || [])) {
            for (const category of (categoryGroup.categories || [])) {
                if ((categories || []).includes(category.name)) {
                    parsedBudget.categories.push({
                        "name": category.name,
                        "display": (category.budgeted + category.spent) / 100
                    });
                }
            }
        }
        conn.write(JSON.stringify(parsedBudget));
    } catch (e) {
        console.log(e);
        if (e && e.message) {
            conn.write(`{ "error":true, "message": "${e.message}" }`);
        } else {
            conn.write(`{ "error":true, "message": "Unknown Error, check logs" }`);
        }
    }
    try {
        await api.shutdown();
    } catch (ignored) { }
}

const server = net.createServer(conn => {
    let json = '';
    conn.on('data', buffer => {
        json += buffer.toString()
        try {
            const config = JSON.parse(json);
            proxy(conn, config);
        } catch (ignored) { }
    })
});

server.listen(SOCK_FILE, () => fs.chmodSync(SOCK_FILE, 0o600));
