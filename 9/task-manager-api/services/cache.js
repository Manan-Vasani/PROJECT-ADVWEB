const NodeCache = require('node-cache');
require('dotenv').config();

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);

const cacheInstance = new NodeCache({
  stdTTL: TTL,
  checkperiod: 120,
  useClones: false
});

let cacheHits = 0;
let cacheMisses = 0;

const cacheService = {
  get: (key) => {
    const data = cacheInstance.get(key);
    if (data !== undefined) {
      cacheHits++;
      return { hit: true, data };
    }
    cacheMisses++;
    return { hit: false, data: null };
  },

  set: (key, value, ttl = TTL) => {
    return cacheInstance.set(key, value, ttl);
  },

  del: (key) => {
    return cacheInstance.del(key);
  },

  invalidateUser: (userId) => {
    const keys = cacheInstance.keys();
    const userKeys = keys.filter(
      (k) => k.startsWith(`tasks_user_${userId}`) || k.startsWith(`task_doc_${userId}`)
    );
    if (userKeys.length > 0) {
      cacheInstance.del(userKeys);
    }
    return userKeys.length;
  },

  invalidateAllTasks: () => {
    const keys = cacheInstance.keys();
    const taskKeys = keys.filter((k) => k.includes('tasks_') || k.includes('task_'));
    if (taskKeys.length > 0) {
      cacheInstance.del(taskKeys);
    }
    return taskKeys.length;
  },

  flush: () => {
    cacheInstance.flushAll();
    cacheHits = 0;
    cacheMisses = 0;
  },

  getStats: () => {
    const totalRequests = cacheHits + cacheMisses;
    const hitRatio = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : '0.0';
    const keys = cacheInstance.keys();

    return {
      hits: cacheHits,
      misses: cacheMisses,
      totalRequests,
      hitRatio: `${hitRatio}%`,
      keysCount: keys.length,
      keys,
      ttl: TTL,
      nodeCacheStats: cacheInstance.getStats()
    };
  },

  raw: cacheInstance
};

module.exports = cacheService;
