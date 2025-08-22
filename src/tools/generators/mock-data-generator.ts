import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface MockDataConfig {
  dataType: 'user' | 'product' | 'order' | 'address' | 'custom' | 'api' | 'database';
  count: number;
  format: 'json' | 'csv' | 'sql' | 'xml' | 'yaml';
  locale: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh';
  includeIds: boolean;
  includeTimestamps: boolean;
  nullProbability: number;
  customSchema?: string;
  seedValue?: string;
  outputStyle: 'pretty' | 'compact' | 'minified';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: GenerationMetadata;
}

interface GenerationMetadata {
  recordsGenerated: number;
  fieldsPerRecord: number;
  estimatedSize: number;
  generationTime: number;
  seedUsed: string;
}

// Localized data sets
const LOCALE_DATA = {
  en: {
    firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco'],
    streets: ['Main St', 'First St', 'Second St', 'Park Ave', 'Elm St', 'Washington St', 'Oak St', 'Maple St', 'Cedar St', 'Pine St'],
    companies: ['Tech Corp', 'Global Industries', 'Innovation Labs', 'Digital Solutions', 'Future Systems', 'Smart Technologies', 'Cloud Dynamics', 'Data Insights', 'Quantum Computing', 'AI Ventures'],
    products: ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Monitor', 'Keyboard', 'Mouse', 'Webcam', 'Speaker', 'Charger'],
  },
  es: {
    firstNames: ['Antonio', 'José', 'Manuel', 'Francisco', 'David', 'Juan', 'Miguel', 'Ángel', 'Diego', 'Carlos', 'María', 'Carmen', 'Josefa', 'Isabel', 'Ana', 'Dolores', 'Pilar', 'Teresa', 'Rosa', 'Laura'],
    lastNames: ['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno'],
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante'],
    streets: ['Calle Mayor', 'Calle Real', 'Plaza Mayor', 'Avenida Principal', 'Calle Nueva', 'Plaza España', 'Calle Sol', 'Avenida Libertad'],
    companies: ['Empresa Tech', 'Soluciones Globales', 'Innovación SA', 'Tecnología Digital', 'Sistemas Futuros'],
    products: ['Portátil', 'Teléfono', 'Tableta', 'Auriculares', 'Monitor', 'Teclado', 'Ratón', 'Altavoz'],
  },
  fr: {
    firstNames: ['Pierre', 'Jean', 'Michel', 'André', 'Philippe', 'Alain', 'Bernard', 'Christian', 'Daniel', 'François', 'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Françoise', 'Christine', 'Brigitte', 'Monique', 'Martine'],
    lastNames: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux'],
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
    streets: ['Rue de la Paix', 'Avenue des Champs', 'Rue Principale', 'Boulevard Saint-Germain', 'Rue du Commerce'],
    companies: ['Tech France', 'Solutions Globales', 'Innovation SARL', 'Systèmes Numériques', 'Futur Technologies'],
    products: ['Ordinateur', 'Téléphone', 'Tablette', 'Écouteurs', 'Moniteur', 'Clavier', 'Souris', 'Haut-parleur'],
  },
};

// Seeded random number generator for reproducible results
class SeededRandom {
  private seed: number;

  constructor(seed: string = '') {
    this.seed = this.hashCode(seed) || Math.random() * 1000000;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  choice<T>(array: T[]): T {
    return array[this.integer(0, array.length - 1)];
  }

  string(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.choice(chars.split(''));
    }
    return result;
  }

  email(firstName: string, lastName: string): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com', 'example.org'];
    const formats = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${this.integer(1, 999)}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    ];
    return `${this.choice(formats)}@${this.choice(domains)}`;
  }

  phone(): string {
    return `+1-${this.integer(200, 999)}-${this.integer(200, 999)}-${this.integer(1000, 9999)}`;
  }

  date(startYear: number = 1980, endYear: number = 2024): string {
    const year = this.integer(startYear, endYear);
    const month = this.integer(1, 12);
    const day = this.integer(1, 28); // Safe day range for all months
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  currency(): number {
    return parseFloat((this.next() * 1000).toFixed(2));
  }
}

function generateUserData(count: number, config: MockDataConfig, random: SeededRandom): any[] {
  const locale = LOCALE_DATA[config.locale] || LOCALE_DATA.en;
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = random.choice(locale.firstNames);
    const lastName = random.choice(locale.lastNames);
    
    const user: any = {};
    
    if (config.includeIds) {
      user.id = i + 1;
    }
    
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = random.email(firstName, lastName);
    user.phone = random.phone();
    user.age = random.integer(18, 80);
    user.city = random.choice(locale.cities);
    user.address = `${random.integer(1, 9999)} ${random.choice(locale.streets)}`;
    
    if (config.includeTimestamps) {
      user.createdAt = new Date(Date.now() - random.integer(0, 365 * 24 * 60 * 60 * 1000)).toISOString();
      user.updatedAt = new Date().toISOString();
    }
    
    // Add null values based on probability
    if (config.nullProbability > 0) {
      Object.keys(user).forEach(key => {
        if (key !== 'id' && random.boolean(config.nullProbability / 100)) {
          user[key] = null;
        }
      });
    }
    
    users.push(user);
  }

  return users;
}

function generateProductData(count: number, config: MockDataConfig, random: SeededRandom): any[] {
  const locale = LOCALE_DATA[config.locale] || LOCALE_DATA.en;
  const products = [];

  for (let i = 0; i < count; i++) {
    const product: any = {};
    
    if (config.includeIds) {
      product.id = i + 1;
      product.sku = `SKU-${random.string(6).toUpperCase()}`;
    }
    
    product.name = random.choice(locale.products);
    product.description = `High-quality ${product.name.toLowerCase()} with advanced features`;
    product.price = random.currency();
    product.category = random.choice(['Electronics', 'Accessories', 'Computing', 'Mobile', 'Audio']);
    product.brand = random.choice(locale.companies);
    product.inStock = random.boolean(0.8);
    product.quantity = random.integer(0, 100);
    product.rating = parseFloat((random.next() * 5).toFixed(1));
    
    if (config.includeTimestamps) {
      product.createdAt = new Date(Date.now() - random.integer(0, 365 * 24 * 60 * 60 * 1000)).toISOString();
      product.updatedAt = new Date().toISOString();
    }
    
    // Add null values based on probability
    if (config.nullProbability > 0) {
      Object.keys(product).forEach(key => {
        if (key !== 'id' && random.boolean(config.nullProbability / 100)) {
          product[key] = null;
        }
      });
    }
    
    products.push(product);
  }

  return products;
}

function generateOrderData(count: number, config: MockDataConfig, random: SeededRandom): any[] {
  const orders = [];

  for (let i = 0; i < count; i++) {
    const order: any = {};
    
    if (config.includeIds) {
      order.id = i + 1;
      order.orderNumber = `ORD-${random.string(8).toUpperCase()}`;
    }
    
    order.customerId = random.integer(1, 1000);
    order.status = random.choice(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
    order.total = random.currency();
    order.tax = parseFloat((order.total * 0.08).toFixed(2));
    order.shipping = parseFloat((random.next() * 20).toFixed(2));
    order.items = random.integer(1, 5);
    order.paymentMethod = random.choice(['credit_card', 'paypal', 'bank_transfer', 'cash']);
    
    if (config.includeTimestamps) {
      const createdAt = new Date(Date.now() - random.integer(0, 30 * 24 * 60 * 60 * 1000));
      order.createdAt = createdAt.toISOString();
      order.updatedAt = new Date(createdAt.getTime() + random.integer(0, 7 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    // Add null values based on probability
    if (config.nullProbability > 0) {
      Object.keys(order).forEach(key => {
        if (key !== 'id' && random.boolean(config.nullProbability / 100)) {
          order[key] = null;
        }
      });
    }
    
    orders.push(order);
  }

  return orders;
}

function generateAddressData(count: number, config: MockDataConfig, random: SeededRandom): any[] {
  const locale = LOCALE_DATA[config.locale] || LOCALE_DATA.en;
  const addresses = [];

  for (let i = 0; i < count; i++) {
    const address: any = {};
    
    if (config.includeIds) {
      address.id = i + 1;
    }
    
    address.street = `${random.integer(1, 9999)} ${random.choice(locale.streets)}`;
    address.city = random.choice(locale.cities);
    address.state = random.choice(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']);
    address.zipCode = random.integer(10000, 99999).toString();
    address.country = config.locale === 'en' ? 'United States' : 
                     config.locale === 'es' ? 'Spain' :
                     config.locale === 'fr' ? 'France' : 'Country';
    address.latitude = parseFloat((random.next() * 180 - 90).toFixed(6));
    address.longitude = parseFloat((random.next() * 360 - 180).toFixed(6));
    
    if (config.includeTimestamps) {
      address.createdAt = new Date(Date.now() - random.integer(0, 365 * 24 * 60 * 60 * 1000)).toISOString();
      address.updatedAt = new Date().toISOString();
    }
    
    // Add null values based on probability
    if (config.nullProbability > 0) {
      Object.keys(address).forEach(key => {
        if (key !== 'id' && random.boolean(config.nullProbability / 100)) {
          address[key] = null;
        }
      });
    }
    
    addresses.push(address);
  }

  return addresses;
}

function generateCustomData(count: number, schema: string, config: MockDataConfig, random: SeededRandom): any[] {
  try {
    const schemaObj = JSON.parse(schema);
    const data = [];

    for (let i = 0; i < count; i++) {
      const record: any = {};
      
      if (config.includeIds) {
        record.id = i + 1;
      }

      for (const [key, fieldDef] of Object.entries(schemaObj)) {
        if (typeof fieldDef === 'string') {
          record[key] = generateFieldValue(fieldDef, random, config);
        } else if (typeof fieldDef === 'object' && fieldDef !== null) {
          const def = fieldDef as any;
          record[key] = generateFieldValue(def.type || 'string', random, config, def);
        }
      }

      if (config.includeTimestamps) {
        record.createdAt = new Date(Date.now() - random.integer(0, 365 * 24 * 60 * 60 * 1000)).toISOString();
        record.updatedAt = new Date().toISOString();
      }

      data.push(record);
    }

    return data;
  } catch (error) {
    throw new Error('Invalid JSON schema provided');
  }
}

function generateFieldValue(type: string, random: SeededRandom, config: MockDataConfig, options: any = {}): any {
  const locale = LOCALE_DATA[config.locale] || LOCALE_DATA.en;

  switch (type.toLowerCase()) {
    case 'string':
      return options.enum ? random.choice(options.enum) : random.string(options.length || 10);
    case 'name':
      return `${random.choice(locale.firstNames)} ${random.choice(locale.lastNames)}`;
    case 'firstname':
      return random.choice(locale.firstNames);
    case 'lastname':
      return random.choice(locale.lastNames);
    case 'email':
      const firstName = random.choice(locale.firstNames);
      const lastName = random.choice(locale.lastNames);
      return random.email(firstName, lastName);
    case 'phone':
      return random.phone();
    case 'number':
    case 'integer':
      return random.integer(options.min || 1, options.max || 100);
    case 'float':
    case 'decimal':
      return parseFloat((random.next() * (options.max || 100 - options.min || 0) + (options.min || 0)).toFixed(2));
    case 'boolean':
      return random.boolean(options.probability || 0.5);
    case 'date':
      return random.date(options.startYear, options.endYear);
    case 'datetime':
      return new Date(Date.now() - random.integer(0, 365 * 24 * 60 * 60 * 1000)).toISOString();
    case 'city':
      return random.choice(locale.cities);
    case 'company':
      return random.choice(locale.companies);
    case 'product':
      return random.choice(locale.products);
    case 'currency':
    case 'price':
      return random.currency();
    case 'uuid':
      return `${random.string(8)}-${random.string(4)}-${random.string(4)}-${random.string(4)}-${random.string(12)}`;
    case 'url':
      return `https://${random.string(8).toLowerCase()}.com`;
    default:
      return random.string(10);
  }
}

function formatOutput(data: any[], format: string, style: string): string {
  switch (format.toLowerCase()) {
    case 'json':
      const indent = style === 'minified' ? 0 : style === 'compact' ? 1 : 2;
      return JSON.stringify(data, null, indent);
      
    case 'csv':
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          const stringValue = value === null ? '' : String(value);
          return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        });
        csvRows.push(values.join(','));
      }
      return csvRows.join('\n');
      
    case 'sql':
      if (data.length === 0) return '';
      const tableName = 'generated_data';
      const columns = Object.keys(data[0]);
      
      let sql = `-- Generated SQL INSERT statements\n`;
      sql += `-- Table: ${tableName}\n\n`;
      
      for (const row of data) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          return String(value);
        });
        sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      return sql;
      
    case 'xml':
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
      for (const item of data) {
        xml += '  <record>\n';
        for (const [key, value] of Object.entries(item)) {
          const xmlValue = value === null ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          xml += `    <${key}>${xmlValue}</${key}>\n`;
        }
        xml += '  </record>\n';
      }
      xml += '</data>';
      return xml;
      
    case 'yaml':
      let yaml = '# Generated YAML data\n---\n';
      yaml += data.map((item, index) => {
        let itemYaml = `- # Record ${index + 1}\n`;
        for (const [key, value] of Object.entries(item)) {
          const yamlValue = value === null ? 'null' : 
                           typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : 
                           String(value);
          itemYaml += `  ${key}: ${yamlValue}\n`;
        }
        return itemYaml.slice(0, -1); // Remove trailing newline
      }).join('\n');
      return yaml;
      
    default:
      return JSON.stringify(data, null, 2);
  }
}

export function processMockData(input: string, config: MockDataConfig): ToolResult {
  const startTime = Date.now();
  
  try {
    if (config.count <= 0 || config.count > 10000) {
      return {
        success: false,
        error: 'Count must be between 1 and 10,000'
      };
    }

    const random = new SeededRandom(config.seedValue || '');
    let data: any[] = [];

    switch (config.dataType) {
      case 'user':
        data = generateUserData(config.count, config, random);
        break;
      case 'product':
        data = generateProductData(config.count, config, random);
        break;
      case 'order':
        data = generateOrderData(config.count, config, random);
        break;
      case 'address':
        data = generateAddressData(config.count, config, random);
        break;
      case 'custom':
        if (!input.trim()) {
          return {
            success: false,
            error: 'Custom schema is required when using custom data type'
          };
        }
        data = generateCustomData(config.count, input, config, random);
        break;
      default:
        return {
          success: false,
          error: `Unsupported data type: ${config.dataType}`
        };
    }

    const output = formatOutput(data, config.format, config.outputStyle);
    const generationTime = Date.now() - startTime;

    const metadata: GenerationMetadata = {
      recordsGenerated: data.length,
      fieldsPerRecord: data.length > 0 ? Object.keys(data[0]).length : 0,
      estimatedSize: new Blob([output]).size,
      generationTime,
      seedUsed: config.seedValue || 'auto-generated',
    };

    return {
      success: true,
      output,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate mock data'
    };
  }
}

export const MOCK_DATA_GENERATOR_TOOL: Tool = {
  id: 'mock-data-generator',
  name: 'Mock Data Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'generators')!.subcategories!.find(sub => sub.id === 'mock-data')!,
  slug: 'mock-data-generator',
  icon: '🎭',
  keywords: ['mock', 'data', 'generator', 'fake', 'test', 'json', 'csv', 'sql', 'database', 'api'],
  seoTitle: 'Mock Data Generator - Generate Test Data for Development | FreeFormatHub',
  seoDescription: 'Generate realistic mock data for testing and development. Create users, products, orders, and custom data in JSON, CSV, SQL, XML, and YAML formats.',
  description: 'Generate realistic mock data for testing, development, and prototyping. Create users, products, orders, addresses, or custom data structures in multiple formats.',
  
  examples: [
    {
      title: 'User Data (JSON)',
      input: '',
      output: `[
  {
    "id": 1,
    "firstName": "James",
    "lastName": "Smith",
    "email": "james.smith@gmail.com",
    "phone": "+1-555-123-4567",
    "age": 32,
    "city": "New York",
    "address": "1234 Main St",
    "createdAt": "2023-05-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "firstName": "Mary",
    "lastName": "Johnson",
    "email": "mary.johnson@company.com",
    "phone": "+1-555-987-6543",
    "age": 28,
    "city": "Los Angeles",
    "address": "5678 Oak St",
    "createdAt": "2023-08-22T14:15:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]`,
      description: 'Generate realistic user profiles with contact information'
    },
    {
      title: 'Product Data (CSV)',
      input: '',
      output: `id,sku,name,description,price,category,brand,inStock,quantity,rating,createdAt,updatedAt
1,SKU-ABC123,Laptop,"High-quality laptop with advanced features",899.99,Electronics,Tech Corp,true,45,4.5,2023-05-15T10:30:00.000Z,2024-01-15T10:30:00.000Z
2,SKU-DEF456,Smartphone,"High-quality smartphone with advanced features",599.99,Mobile,Digital Solutions,true,23,4.2,2023-08-22T14:15:00.000Z,2024-01-15T10:30:00.000Z
3,SKU-GHI789,Headphones,"High-quality headphones with advanced features",149.99,Audio,Innovation Labs,false,0,4.8,2023-11-10T09:45:00.000Z,2024-01-15T10:30:00.000Z`,
      description: 'Generate product catalog data in CSV format'
    },
    {
      title: 'Custom Schema (JSON)',
      input: `{
  "username": "string",
  "score": {"type": "integer", "min": 0, "max": 1000},
  "isActive": {"type": "boolean", "probability": 0.8},
  "joinDate": "date",
  "level": {"type": "string", "enum": ["bronze", "silver", "gold", "platinum"]}
}`,
      output: `[
  {
    "id": 1,
    "username": "KXJM8QNVZP",
    "score": 756,
    "isActive": true,
    "joinDate": "2022-03-15",
    "level": "gold",
    "createdAt": "2023-05-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "username": "PLBW5RDTXY",
    "score": 234,
    "isActive": false,
    "joinDate": "2023-11-08",
    "level": "bronze",
    "createdAt": "2023-08-22T14:15:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]`,
      description: 'Generate data using custom JSON schema'
    },
    {
      title: 'SQL Insert Statements',
      input: '',
      output: `-- Generated SQL INSERT statements
-- Table: generated_data

INSERT INTO generated_data (id, orderNumber, customerId, status, total, tax, shipping, items, paymentMethod, createdAt, updatedAt) VALUES (1, 'ORD-ABC12345', 456, 'shipped', 129.99, 10.40, 9.99, 2, 'credit_card', '2024-01-10T08:30:00.000Z', '2024-01-12T14:20:00.000Z');
INSERT INTO generated_data (id, orderNumber, customerId, status, total, tax, shipping, items, paymentMethod, createdAt, updatedAt) VALUES (2, 'ORD-DEF67890', 789, 'delivered', 89.50, 7.16, 0.00, 1, 'paypal', '2024-01-08T16:45:00.000Z', '2024-01-11T10:15:00.000Z');
INSERT INTO generated_data (id, orderNumber, customerId, status, total, tax, shipping, items, paymentMethod, createdAt, updatedAt) VALUES (3, 'ORD-GHI24680', 123, 'pending', 299.99, 24.00, 15.99, 4, 'bank_transfer', '2024-01-14T11:20:00.000Z', '2024-01-15T09:30:00.000Z');`,
      description: 'Generate SQL INSERT statements for database seeding'
    }
  ],
  
  useCases: [
    'API testing and development',
    'Database seeding and migration testing',
    'Frontend prototype development',
    'Load testing with realistic data',
    'Demo data for presentations',
    'QA testing with diverse datasets'
  ],
  
  faq: [
    {
      question: 'What data types can be generated?',
      answer: 'The tool supports users, products, orders, addresses, and custom data structures. Custom schemas allow you to define specific field types and constraints.'
    },
    {
      question: 'How do I create reproducible data?',
      answer: 'Use a custom seed value to generate the same data set every time. This is useful for consistent testing environments and reproducible results.'
    },
    {
      question: 'What output formats are supported?',
      answer: 'Data can be generated in JSON, CSV, SQL INSERT statements, XML, and YAML formats. Each format is optimized for different use cases.'
    },
    {
      question: 'Can I generate data in different languages?',
      answer: 'Yes! The tool supports multiple locales including English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, and Chinese with localized names and locations.'
    },
    {
      question: 'How do I define custom data schemas?',
      answer: 'Use JSON format to define field types, constraints, and options. Supported types include string, number, boolean, date, email, phone, and many more.'
    }
  ],
  
  commonErrors: [
    'Invalid JSON schema - check syntax and field definitions',
    'Count too large - maximum 10,000 records per generation',
    'Invalid field type in custom schema',
    'Null probability must be between 0 and 100',
    'Seed value should be a string for consistent results'
  ],

  relatedTools: ['json-formatter', 'csv-formatter', 'sql-formatter', 'uuid-generator']
};