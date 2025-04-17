import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { generateAllDocuments } from '../utils/gemini.js';
import { 
  createMemoryBankStructure, 
  saveDocument, 
  readDocument, 
  readAllDocuments, 
  exportMemoryBank 
} from '../utils/fileManager.js';
import { generateCursorRules } from '../utils/cursorRulesGenerator.js';

// Create MCP server
const server = new McpServer({
  name: 'Memory Bank MCP',
  version: '1.0.0'
});

// Import URL and fileURLToPath for ESM compatible __dirname alternative
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Helper function to get the workspace root directory
const getWorkspaceRootDir = () => {
  // Try to get VS Code workspace folder from environment variables
  // This is more reliable than process.cwd() in VS Code environment
  if (process.env.VSCODE_WORKSPACE_FOLDER) {
    console.log(`Using VS Code workspace folder: ${process.env.VSCODE_WORKSPACE_FOLDER}`);
    return process.env.VSCODE_WORKSPACE_FOLDER;
  }
  
  // If not in VS Code or env var not available, try to determine from current file path
  // ESM compatible version of __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const currentFilePath = __dirname;
  console.log(`Current file directory: ${currentFilePath}`);
  
  // Try to find the workspace root by looking for package.json
  let dir = currentFilePath;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      console.log(`Found workspace root at: ${dir}`);
      return dir;
    }
    dir = path.dirname(dir);
  }
  
  // Fallback to current working directory with warning
  console.warn(`Could not determine workspace root, falling back to CWD: ${process.cwd()}`);
  return process.cwd();
};

// Default document directory path - initialize to null, will be set during initialization
let MEMORY_BANK_DIR: string | null = null;

// Initialize Memory Bank - create new document structure
server.tool(
  'initialize_memory_bank',
  {
    goal: z.string().min(10, 'Project goal must be at least 10 characters'),
    geminiApiKey: z.string().optional().describe('Gemini API key (optional)'),
    location: z.string().describe('Absolute path where memory-bank folder will be created')
  },
  async ({ goal, geminiApiKey, location }) => {
    try {
      // Diagnostics: Log environment info
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Node version: ${process.version}`);
      console.log(`Platform: ${process.platform}`);
      
      // Determine where to create the memory-bank directory
      let baseDir;
      let memoryBankDir;
      
      if (location) {
        // Use user-specified location as the base directory
        if (path.isAbsolute(location)) {
          // If absolute path is provided, use it directly as base directory
          baseDir = location;
        } else {
          // If relative path is provided, resolve against current working directory
          baseDir = path.resolve(process.cwd(), location);
        }
        console.log(`Using user specified base location: ${baseDir}`);
      } else {
        // If no location provided, use current working directory as base
        baseDir = process.cwd();
        console.log(`No location specified, using current directory as base: ${baseDir}`);
      }
      
      // Create memory-bank directory inside the base directory
      memoryBankDir = path.join(baseDir, 'memory-bank');
      console.log(`Will create Memory Bank structure at: ${memoryBankDir}`);
      
      // Ensure parent directory exists if needed
      const parentDir = path.dirname(memoryBankDir);
      try {
        await fs.ensureDir(parentDir);
        console.log(`Ensured parent directory exists: ${parentDir}`);
      } catch (error) {
        console.error(`Error ensuring parent directory: ${error}`);
        throw new Error(`Cannot create or access parent directory: ${error}`);
      }
      
      // Set global memory bank directory
      MEMORY_BANK_DIR = memoryBankDir;
      
      console.log(`Will create Memory Bank at: ${MEMORY_BANK_DIR}`);
      
      // Ensure memory-bank directory exists before passing to createMemoryBankStructure
      try {
        await fs.ensureDir(MEMORY_BANK_DIR);
        console.log(`Created Memory Bank root directory: ${MEMORY_BANK_DIR}`);
      } catch (error) {
        console.error(`Error creating Memory Bank directory: ${error}`);
        throw new Error(`Cannot create Memory Bank directory: ${error}`);
      }

      // Temporarily set the API key if provided
      if (geminiApiKey) {
        process.env.GEMINI_API_KEY = geminiApiKey;
      }

      // First, set up the .byterules file before creating other files
      // This ensures the byterules file is in place before other operations
      const byterulesDest = path.join(MEMORY_BANK_DIR, '.byterules');
      
      try {
        // Debug: List all search paths we're going to try
        console.log('Searching for .byterules template file...');
        
        // Get the ESM compatible dirname
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        console.log(`Current file directory: ${__dirname}`);
        
        // Try multiple possible locations for the .byterules file
        const possiblePaths = [
          path.join(process.cwd(), 'src', 'templates', '.byterules'),          // From current working dir
          path.join(__dirname, '..', 'templates', '.byterules'),               // From mcp dir to templates
          path.join(__dirname, '..', '..', 'src', 'templates', '.byterules'),  // From mcp dir up two levels
          path.join(process.cwd(), 'templates', '.byterules'),                 // Direct templates folder
          path.join(process.cwd(), '.byterules')                               // Root of project
        ];
        
        // Manually create .byterules content as fallback
        const defaultByterules = `# Memory Bank Document Orchestration Standard

## Directory Validation

Before any operation (create/update/reference/review), ensure you are in the correct project root directory. Specifically:

- A valid Memory Bank system **must contain** this \`.byterules\` file at its root.
- If this file is missing, halt operations and **navigate to the correct directory** using:

\`\`\`bash
cd /your/project/root
\`\`\`

Failing to validate the directory can lead to misplaced or inconsistent documentation.

---

## System Overview

Memory Bank is a structured documentation system designed to maintain project knowledge in an organized, accessible format. This \`.byterules\` file serves as the standard guide for how the system works across all projects.

## Standard Document Types

### 1. Project Brief (projectbrief.md)
- **Purpose**: Core document that defines project objectives, scope, and vision
- **When to Use**: Reference when making any major project decisions
- **Workflow Step**: Start here; all other documents derive from this foundation
- **Critical For**: Maintaining alignment with business goals throughout development

### 2. Product Context (productContext.md)
- **Purpose**: Documents product functionality from a user perspective
- **When to Use**: When designing features and establishing requirements
- **Workflow Step**: Second document in sequence, expands on project brief goals
- **Critical For**: Ensuring user needs drive technical decisions

### 3. System Patterns (systemPatterns.md)
- **Purpose**: Establishes system architecture and component relationships
- **When to Use**: During system design and when making integration decisions
- **Workflow Step**: Third document, translates product needs to technical design
- **Critical For**: Maintaining a coherent and scalable technical architecture

### 4. Tech Context (techContext.md)
- **Purpose**: Specifies technology stack and implementation details
- **When to Use**: During development and when onboarding technical team members
- **Workflow Step**: Fourth document, makes concrete technology choices
- **Critical For**: Technical consistency and efficient development

### 5. Active Context (activeContext.md)
- **Purpose**: Tracks current tasks, open issues, and development focus
- **When to Use**: Daily, during planning sessions, and when switching tasks
- **Workflow Step**: Fifth document, operationalizes the technical approach
- **Critical For**: Day-to-day execution and short-term planning

### 6. Progress (progress.md)
- **Purpose**: Documents completed work, milestones, and project history
- **When to Use**: After completing significant work or during reviews
- **Workflow Step**: Ongoing document that records the project journey
- **Critical For**: Tracking accomplishments and learning from experience

## Standard Workflows

### Documentation Sequence
Always follow this sequence for document creation and reference:
1. **Project Brief** → Foundation of all project decisions
2. **Product Context** → User-focused requirements and features
3. **System Patterns** → Architecture and component design
4. **Tech Context** → Technology choices and implementation guidelines
5. **Active Context** → Current work and immediate focus
6. **Progress** → Historical record and milestone tracking

### Document Lifecycle Management
Each document follows a standard lifecycle:
1. **Creation**: Establish initial content based on project needs
2. **Reference**: Use document for planning and decision-making
3. **Update**: Revise when relevant factors change
4. **Review**: Periodically validate for accuracy and completeness
5. **Archive**: Maintain as historical reference when superseded

## Best Practices

### Document Quality Standards
- **Clarity**: Write in clear, concise language
- **Completeness**: Include all relevant information
- **Consistency**: Use consistent terminology across documents
- **Structure**: Follow standardized document formats
- **Granularity**: Balance detail with readability
- **Traceability**: Link related concepts across documents

### Document Integration Principles
- **Vertical Traceability**: Ensure business goals trace to technical implementation
- **Horizontal Consistency**: Maintain alignment across documents at the same level
- **Change Impact Analysis**: Update related documents when one changes
- **Decision Recording**: Document the reasoning behind significant decisions


`;
        
        // Try each path and use the first one that exists
        let bytesRulesFound = false;
        
        for (const testPath of possiblePaths) {
          console.log(`Checking path: ${testPath}`);
          
          if (await fs.pathExists(testPath)) {
            console.log(`✓ Found .byterules at: ${testPath}`);
            await fs.copy(testPath, byterulesDest);
            console.log(`Standard .byterules file copied to: ${byterulesDest}`);
            bytesRulesFound = true;
            break;
          } else {
            console.log(`✗ Not found at: ${testPath}`);
          }
        }
        
        // If no .byterules file found, create one with the default content
        if (!bytesRulesFound) {
          console.log('No .byterules template found, creating default');
          await fs.writeFile(byterulesDest, defaultByterules, 'utf-8');
          console.log(`Default .byterules file created at: ${byterulesDest}`);
        }
        
      } catch (error) {
        console.error(`Error setting up .byterules file: ${error}`);
        throw new Error(`Failed to set up .byterules file: ${error}`);
      }
      
      // Now create the full structure
      await createMemoryBankStructure(MEMORY_BANK_DIR);

      // Generate document contents
      const documentContents = await generateAllDocuments(goal);

      // Save each document
      for (const [docType, content] of Object.entries(documentContents)) {
        const filePath = path.join(MEMORY_BANK_DIR, `${docType}.md`);
        await saveDocument(content, filePath);
      }

      return {
        content: [
          { 
            type: 'text', 
            text: `✅ Memory Bank successfully created!\n\nLocation: ${MEMORY_BANK_DIR}\n\nGenerated Documents:\n- projectbrief.md\n- productContext.md\n- systemPatterns.md\n- techContext.md\n- activeContext.md\n- progress.md\n- .byterules` 
          }
        ]
      };
    } catch (error) {
      console.error('Error creating Memory Bank:', error);
      return {
        content: [{ type: 'text', text: `❌ Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
);

// Update document
server.tool(
  'update_document',
  {
    documentType: z.enum(['projectbrief', 'productContext', 'systemPatterns', 'techContext', 'activeContext', 'progress']),
    content: z.string().optional(),
    regenerate: z.boolean().default(false)
  },
  async ({ documentType, content, regenerate }) => {
    try {
      // Check if Memory Bank directory is initialized
      if (!MEMORY_BANK_DIR) {
        throw new Error('Memory Bank not initialized. Please use initialize_memory_bank tool first.');
      }

      const filePath = path.join(MEMORY_BANK_DIR, `${documentType}.md`);

      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        // Create file if it doesn't exist
        await fs.ensureFile(filePath);
        await fs.writeFile(filePath, `# ${documentType}\n\n`, 'utf-8');
      }

      if (regenerate) {
        // Read existing document
        const currentContent = await readDocument(filePath);
        
        // Always use en-US locale for date formatting to ensure English output
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const englishDate = new Date().toLocaleDateString('en-US');
        
        // TODO: Generate new content with Gemini (example for now)
        const newContent = `${currentContent}\n\n## Update\nThis document was regenerated on ${englishDate}.`;
        
        // Save document
        await saveDocument(newContent, filePath);
      } else if (content) {
        // Save provided content
        await saveDocument(content, filePath);
      } else {
        throw new Error('Content must be provided or regenerate=true');
      }

      // Always use English for all response messages
      return {
        content: [{ 
          type: 'text', 
          text: `✅ "${documentType}.md" document successfully updated!` 
        }]
      };
    } catch (error) {
      console.error('Error updating document:', error);
      // Ensure error messages are also in English
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Error: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Query Memory Bank
server.tool(
  'query_memory_bank',
  {
    query: z.string().min(5, 'Query must be at least 5 characters')
  },
  async ({ query }) => {
    try {
      // Check if Memory Bank has been initialized
      if (!MEMORY_BANK_DIR) {
        return {
          content: [{ type: 'text', text: `ℹ️ Memory Bank not initialized. Please use 'initialize_memory_bank' tool first.` }]
        };
      }

      // Check if Memory Bank directory exists on disk
      if (!await fs.pathExists(MEMORY_BANK_DIR)) {
        return {
          content: [{ type: 'text', text: `ℹ️ Memory Bank directory (${MEMORY_BANK_DIR}) not found on disk. Please use 'initialize_memory_bank' tool first.` }]
        };
      }

      // Read all documents
      const documents = await readAllDocuments(MEMORY_BANK_DIR);
      
      // Advanced search function
      const searchResults = performAdvancedSearch(query, documents);
      
      if (searchResults.length === 0) {
        return {
          content: [{ type: 'text', text: `ℹ️ No results found for query "${query}".` }]
        };
      }
      
      // Format results
      const formattedResults = searchResults.map(result => {
        return `📄 **${result.documentType}**:\n${result.snippet}\n`;
      }).join('\n');
      
      return {
        content: [{ 
          type: 'text', 
          text: `🔍 Results for query "${query}":\n\n${formattedResults}` 
        }]
      };
    } catch (error) {
      console.error('Error querying Memory Bank:', error);
      return {
        content: [{ type: 'text', text: `❌ Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
);

// Advanced search functionality
interface SearchResult {
  documentType: string;
  relevanceScore: number;
  snippet: string;
}

function performAdvancedSearch(query: string, documents: Record<string, string>): SearchResult[] {
  const results: SearchResult[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  // Search in each document
  for (const [docType, content] of Object.entries(documents)) {
    // Split document into sections and paragraphs
    const sections = content.split(/\n#{2,3}\s+/).filter(Boolean);
    
    for (const section of sections) {
      // Extract title and content
      const titleMatch = section.match(/^([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Evaluate each paragraph
      const paragraphs = section.split(/\n\n+/);
      
      for (const paragraph of paragraphs) {
        // Calculate relevance score
        const relevanceScore = calculateRelevanceScore(query, queryTerms, paragraph);
        
        // Add results above threshold
        if (relevanceScore > 0.3) {
          // Extract relevant snippet
          const snippet = extractRelevantSnippet(paragraph, queryTerms, title);
          
          results.push({
            documentType: docType,
            relevanceScore,
            snippet
          });
        }
      }
    }
  }
  
  // Sort results by relevance and return top 5
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

function calculateRelevanceScore(query: string, queryTerms: string[], text: string): number {
  const lowerText = text.toLowerCase();
  
  // Exact match check (highest score)
  if (lowerText.includes(query.toLowerCase())) {
    return 1.0;
  }
  
  // Term-based matching
  let matchCount = 0;
  for (const term of queryTerms) {
    if (lowerText.includes(term)) {
      matchCount++;
    }
  }
  
  // Term match ratio
  const termMatchRatio = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
  
  // Proximity factor calculation
  let proximityFactor = 0;
  if (matchCount >= 2) {
    // Calculate proximity between matching terms
    // (This is a simplified approach)
    proximityFactor = 0.2;
  }
  
  return termMatchRatio * 0.8 + proximityFactor;
}

function extractRelevantSnippet(text: string, queryTerms: string[], sectionTitle: string): string {
  const lowerText = text.toLowerCase();
  const MAX_SNIPPET_LENGTH = 150;
  
  // Find best match
  let bestPosition = 0;
  let bestTermCount = 0;
  
  // Query for each character in the document
  for (let i = 0; i < lowerText.length; i++) {
    let termCount = 0;
    for (const term of queryTerms) {
      if (lowerText.substring(i, i + 100).includes(term)) {
        termCount++;
      }
    }
    
    if (termCount > bestTermCount) {
      bestTermCount = termCount;
      bestPosition = i;
    }
  }
  
  // Create snippet around best match
  let startPos = Math.max(0, bestPosition - 30);
  let endPos = Math.min(text.length, bestPosition + MAX_SNIPPET_LENGTH - 30);
  
  // Adjust to word boundaries
  while (startPos > 0 && text[startPos] !== ' ' && text[startPos] !== '\n') {
    startPos--;
  }
  
  while (endPos < text.length && text[endPos] !== ' ' && text[endPos] !== '\n') {
    endPos++;
  }
  
  let snippet = text.substring(startPos, endPos).trim();
  
  // Add ellipsis to indicate truncation
  if (startPos > 0) {
    snippet = '...' + snippet;
  }
  
  if (endPos < text.length) {
    snippet = snippet + '...';
  }
  
  // Add title
  if (sectionTitle) {
    return `**${sectionTitle}**: ${snippet}`;
  }
  
  return snippet;
}

// Export Memory Bank
server.tool(
  'export_memory_bank',
  {
    format: z.enum(['json', 'folder']).default('folder').describe('Export format'),
    outputPath: z.string().optional()
  },
  async ({ format, outputPath }) => {
    try {
      // Check if Memory Bank has been initialized
      if (!MEMORY_BANK_DIR) {
        return {
          content: [{ type: 'text', text: `ℹ️ Memory Bank not initialized. Please use 'initialize_memory_bank' tool first.` }]
        };
      }
      
      // Check if Memory Bank directory exists on disk
      if (!await fs.pathExists(MEMORY_BANK_DIR)) {
        return {
          content: [{ type: 'text', text: `ℹ️ Memory Bank directory (${MEMORY_BANK_DIR}) not found on disk. Please use 'initialize_memory_bank' tool first.` }]
        };
      }

      // Ensure we have an absolute path for the output
      const defaultOutputPath = path.resolve(path.join(process.cwd(), 'memory-bank-export'));
      const targetOutputPath = outputPath ? path.resolve(outputPath) : defaultOutputPath;
      
      console.log(`Exporting Memory Bank from ${MEMORY_BANK_DIR} to ${targetOutputPath}`);
      
      // Call exportMemoryBank function
      const exportResult = await exportMemoryBank(MEMORY_BANK_DIR, format, targetOutputPath);
      
      // Create message based on format type
      const formatMessage = format === 'json' ? 'JSON file' : 'folder';
      
      return {
        content: [{ 
          type: 'text', 
          text: `✅ Memory Bank successfully exported as ${formatMessage}: ${exportResult}` 
        }]
      };
    } catch (error) {
      console.error('Error exporting Memory Bank:', error);
      return {
        content: [{ type: 'text', text: `❌ Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
);

// Create Cursor Rules
server.tool(
  'create_cursor_rules',
  {
    projectPurpose: z.string()
      .min(10, 'Proje amacı en az 10 karakter olmalıdır')
      .describe('Proje amacını detaylı bir şekilde açıklayan bir metin giriniz. Bu metin projenin temel hedeflerini ve kapsamını belirleyecektir.'),
    location: z.string()
      .describe('Absolute path where cursor-rules will be created')
  },
  async ({ projectPurpose, location }) => {
    try {
      // Diagnostics: Log environment info
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Node version: ${process.version}`);
      console.log(`Platform: ${process.platform}`);
      
      // Determine where to create the .cursor directory
      let baseDir;
      
      if (location) {
        // Use user-specified location as the base directory
        if (path.isAbsolute(location)) {
          // If absolute path is provided, use it directly as base directory
          baseDir = location;
        } else {
          // If relative path is provided, resolve against current working directory
          baseDir = path.resolve(process.cwd(), location);
        }
        console.log(`Using user specified base location: ${baseDir}`);
      } else {
        // If no location provided, use current working directory as base
        baseDir = process.cwd();
        console.log(`No location specified, using current directory as base: ${baseDir}`);
      }
      
      // Create .cursor directory in the base directory
      const cursorDir = path.join(baseDir, '.cursor');
      console.log(`Will create Cursor Rules at: ${cursorDir}`);
      
      // Ensure parent directory exists if needed
      const parentDir = path.dirname(cursorDir);
      try {
        await fs.ensureDir(parentDir);
        console.log(`Ensured parent directory exists: ${parentDir}`);
      } catch (error) {
        console.error(`Error ensuring parent directory: ${error}`);
        throw new Error(`Cannot create or access parent directory: ${error}`);
      }
      
      // Ensure .cursor directory exists
      try {
        await fs.ensureDir(cursorDir);
        console.log(`Created .cursor directory: ${cursorDir}`);
      } catch (error) {
        console.error(`Error creating .cursor directory: ${error}`);
        throw new Error(`Cannot create .cursor directory: ${error}`);
      }
      
      // Create the cursor-rules.mdc file
      const cursorRulesPath = path.join(cursorDir, 'cursor-rules.mdc');
      console.log(`Will create cursor-rules.mdc at: ${cursorRulesPath}`);
      
      // Generate content for the rules file based on project purpose
      console.log(`Generating cursor rules content for purpose: ${projectPurpose}`);
      try {
        const cursorRulesContent = await generateCursorRules(projectPurpose);
        
        // Save the file
        try {
          await fs.writeFile(cursorRulesPath, cursorRulesContent, 'utf-8');
          console.log(`Created cursor-rules.mdc at: ${cursorRulesPath}`);
        } catch (error) {
          console.error(`Error creating cursor-rules.mdc file: ${error}`);
          throw new Error(`Cannot create cursor-rules.mdc file: ${error}`);
        }
        
        return {
          content: [{ 
            type: 'text', 
            text: `✅ Cursor Rules successfully created!\n\nLocation: ${cursorRulesPath}` 
          }]
        };
      } catch (ruleGenError) {
        console.error(`Error generating cursor rules content: ${ruleGenError}`);
        
        // Detaylı hata mesajı oluştur
        let errorMessage = 'Error generating Cursor Rules content: ';
        if (ruleGenError instanceof Error) {
          errorMessage += ruleGenError.message;
          
          // API key ile ilgili hata mesajlarını daha açıklayıcı hale getir
          if (ruleGenError.message.includes('GEMINI_API_KEY') || ruleGenError.message.includes('API key')) {
            errorMessage += '\n\nÖnemli: Bu özellik Gemini API kullanıyor. Lütfen .env dosyasında geçerli bir GEMINI_API_KEY tanımladığınızdan emin olun.';
          }
        } else {
          errorMessage += String(ruleGenError);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating Cursor Rules:', error);
      return {
        content: [{ type: 'text', text: `❌ Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
);

// Read document contents - provides as resource
server.resource(
  'memory_bank_document',
  'memory-bank://{documentType}',
  async (uri) => {
    try {
      // First check if Memory Bank has been initialized
      if (!MEMORY_BANK_DIR) {
        throw new Error('Memory Bank not initialized. Please use initialize_memory_bank tool first.');
      }
      
      const documentType = uri.pathname.split('/').pop();
      const validDocumentTypes = ['projectbrief', 'productContext', 'systemPatterns', 'techContext', 'activeContext', 'progress'];
      
      if (!documentType || !validDocumentTypes.includes(documentType)) {
        throw new Error(`Invalid document type: ${documentType}`);
      }
      
      const filePath = path.join(MEMORY_BANK_DIR, `${documentType}.md`);
      
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        // Create file if it doesn't exist
        await fs.ensureFile(filePath);
        await fs.writeFile(filePath, `# ${documentType}\n\nThis document has not been created yet.`, 'utf-8');
      }
      
      const content = await readDocument(filePath);
      
      return {
        contents: [{
          uri: uri.href,
          text: content
        }]
      };
    } catch (error) {
      console.error('Error reading document:', error);
      throw error;
    }
  }
);

// Export MCP server
export default server;

// Direct execution function
export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  
  try {
    console.log('Starting Memory Bank MCP server...');
    await server.connect(transport);
    console.log('Memory Bank MCP server successfully started!');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
} 