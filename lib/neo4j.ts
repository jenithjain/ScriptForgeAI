import neo4j, { Driver, Session } from 'neo4j-driver';

// Neo4j connection configuration
const NEO4J_URI = process.env.NEO4J_URI || '';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

// Singleton driver instance
let driver: Driver | null = null;

/**
 * Get the Neo4j driver instance (singleton pattern)
 */
export function getDriver(): Driver {
  if (!driver) {
    if (!NEO4J_URI || !NEO4J_PASSWORD) {
      throw new Error('Neo4j connection details not configured in environment variables');
    }
    
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        logging: {
          level: 'info',
          logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
        }
      }
    );
  }
  
  return driver;
}

/**
 * Get a Neo4j session
 */
export function getSession(): Session {
  const driver = getDriver();
  return driver.session({ database: NEO4J_DATABASE });
}

/**
 * Close the Neo4j driver connection
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Run a Cypher query with error handling
 */
export async function runQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = getSession();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.toObject()) as T[];
  } finally {
    await session.close();
  }
}

/**
 * Run a write transaction
 */
export async function runWriteTransaction<T = any>(
  work: (tx: any) => Promise<T>
): Promise<T> {
  const session = getSession();
  try {
    return await session.executeWrite(work);
  } finally {
    await session.close();
  }
}

/**
 * Run a read transaction
 */
export async function runReadTransaction<T = any>(
  work: (tx: any) => Promise<T>
): Promise<T> {
  const session = getSession();
  try {
    return await session.executeRead(work);
  } finally {
    await session.close();
  }
}

/**
 * Initialize the Neo4j schema with indexes and constraints
 */
export async function initializeSchema(): Promise<void> {
  const session = getSession();
  try {
    // Create constraints for unique identifiers
    const constraints = [
      'CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE',
      'CREATE CONSTRAINT object_id IF NOT EXISTS FOR (o:Object) REQUIRE o.id IS UNIQUE',
      'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT plot_thread_id IF NOT EXISTS FOR (p:PlotThread) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT chapter_id IF NOT EXISTS FOR (ch:Chapter) REQUIRE ch.id IS UNIQUE',
      'CREATE CONSTRAINT state_id IF NOT EXISTS FOR (s:State) REQUIRE s.id IS UNIQUE',
    ];

    // Create indexes for faster lookups
    const indexes = [
      'CREATE INDEX character_name IF NOT EXISTS FOR (c:Character) ON (c.name)',
      'CREATE INDEX location_name IF NOT EXISTS FOR (l:Location) ON (l.name)',
      'CREATE INDEX event_timestamp IF NOT EXISTS FOR (e:Event) ON (e.timestamp)',
      'CREATE INDEX chapter_number IF NOT EXISTS FOR (ch:Chapter) ON (ch.number)',
      'CREATE INDEX state_version IF NOT EXISTS FOR (s:State) ON (s.version)',
    ];

    for (const constraint of constraints) {
      try {
        await session.run(constraint);
      } catch (error: any) {
        // Ignore if constraint already exists
        if (!error.message.includes('already exists')) {
          console.warn(`Warning creating constraint: ${error.message}`);
        }
      }
    }

    for (const index of indexes) {
      try {
        await session.run(index);
      } catch (error: any) {
        // Ignore if index already exists
        if (!error.message.includes('already exists')) {
          console.warn(`Warning creating index: ${error.message}`);
        }
      }
    }

    console.log('Neo4j schema initialized successfully');
  } finally {
    await session.close();
  }
}

export default { getDriver, getSession, closeDriver, runQuery, initializeSchema };
