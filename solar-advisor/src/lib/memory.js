"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMemory = saveMemory;
exports.getMemory = getMemory;
exports.updateMemory = updateMemory;
exports.listMemoryKeys = listMemoryKeys;
// Simple in-memory storage for demo purposes
// In production, this would use a database
const memoryStore = {};
async function saveMemory(key, data, ttl) {
    console.log(`Saving data with key: ${key}`);
    memoryStore[key] = {
        data,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl * 1000 : null
    };
}
async function getMemory(key) {
    console.log(`Retrieving data with key: ${key}`);
    const entry = memoryStore[key];
    if (!entry) {
        console.log(`No data found for key: ${key}`);
        return null;
    }
    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
        console.log(`Data for key ${key} has expired`);
        delete memoryStore[key];
        return null;
    }
    return entry.data;
}
async function updateMemory(key, updateFn) {
    const currentData = await getMemory(key);
    if (currentData) {
        const updatedData = updateFn(currentData);
        await saveMemory(key, updatedData);
    }
}
async function listMemoryKeys(prefix) {
    if (prefix) {
        return Object.keys(memoryStore).filter(key => key.startsWith(prefix));
    }
    return Object.keys(memoryStore);
}
// Automatically clean up expired memories
setInterval(() => {
    const now = Date.now();
    Object.keys(memoryStore).forEach(key => {
        const entry = memoryStore[key];
        if (entry.expiry && now > entry.expiry) {
            delete memoryStore[key];
        }
    });
}, 60000); // Check every minute
