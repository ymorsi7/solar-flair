// Simple in-memory storage for demo purposes
// In production, this would use a database
const memoryStore: Record<string, any> = {};

export async function saveMemory(key: string, data: any, ttl?: number): Promise<void> {
  console.log(`Saving data with key: ${key}`);
  
  memoryStore[key] = {
    data,
    timestamp: Date.now(),
    expiry: ttl ? Date.now() + ttl * 1000 : null
  };
}

export async function getMemory(key: string): Promise<any> {
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

export async function updateMemory(key: string, updateFn: (data: any) => any): Promise<void> {
  const currentData = await getMemory(key);
  if (currentData) {
    const updatedData = updateFn(currentData);
    await saveMemory(key, updatedData);
  }
}

export async function listMemoryKeys(prefix?: string): Promise<string[]> {
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