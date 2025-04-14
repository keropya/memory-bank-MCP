import fs from 'fs-extra';
import path from 'path';

/**
 * Creates the Memory Bank directory structure
 * @param outputDir Output directory (must already exist)
 */
export async function createMemoryBankStructure(outputDir: string): Promise<void> {
  try {
    console.log(`Creating Memory Bank structure in existing directory: ${outputDir}`);
    
    // Verify directory exists
    if (!await fs.pathExists(outputDir)) {
      console.warn(`Directory does not exist: ${outputDir}, will create it`);
      await fs.ensureDir(outputDir);
    }
    
    // No subdirectories needed - using a flat structure for simplicity
    console.log(`Using flat structure for Memory Bank in "${outputDir}"`);
    
    // Create a README.md file with component descriptions
    const readmePath = path.join(outputDir, 'README.md');
    const readmeContent = `# Memory Bank

This directory serves as a structured repository for your project information and notes.

## Directory Structure
- **resources**: Images, diagrams, and other resources
- **temp**: Temporary files and drafts
- **archive**: Archived documents
- **references**: Reference materials and documentation

## Core Documents
- **projectbrief.md**: Project goals, scope, and vision
- **productContext.md**: Product features, user stories, and market context
- **systemPatterns.md**: System architecture, design patterns, and component structure
- **techContext.md**: Technology stack, frameworks, and technical specifications
- **activeContext.md**: Active tasks, current sprint, and in-progress work
- **progress.md**: Progress tracking, milestones, and project history

## Document Management
This Memory Bank uses a structured approach to organize project knowledge. Each document serves a specific purpose in the project lifecycle and should be maintained according to the rules specified in the \`.byterules\` file.

See the \`.byterules\` file for detailed guidelines on how to maintain and update these documents.
`;
    try {
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
      console.log(`README file created at: ${readmePath}`);
    } catch (error) {
      const err = error as any;
      console.error(`Error creating README file: ${err.code} - ${err.message}`);
      // Continue without README
    }
    
    console.log(`Memory Bank structure successfully created in "${outputDir}".`);
  } catch (error) {
    console.error(`Error creating directory structure at ${outputDir}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to create Memory Bank structure: ${error.message} (Code: ${(error as any).code || 'UNKNOWN'})`);
    } else {
      throw new Error(`Failed to create Memory Bank structure: Unknown error`);
    }
  }
}

/**
 * Saves document content to a specific file
 * @param content File content
 * @param filePath File path
 */
export async function saveDocument(content: string, filePath: string): Promise<void> {
  try {
    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));
    
    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
    
    console.log(`Document saved: ${filePath}`);
  } catch (error) {
    console.error('Error saving document:', error);
    throw new Error(`Failed to save document: ${error}`);
  }
}

/**
 * Reads document content
 * @param filePath File path
 * @returns File content
 */
export async function readDocument(filePath: string): Promise<string> {
  try {
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Document not found: ${filePath}`);
    }
    
    // Read file
    const content = await fs.readFile(filePath, 'utf-8');
    
    return content;
  } catch (error) {
    console.error('Error reading document:', error);
    throw new Error(`Failed to read document: ${error}`);
  }
}

/**
 * Reads all documents from a directory
 * @param directoryPath Directory path
 * @returns Object containing file paths and contents
 */
export async function readAllDocuments(directoryPath: string): Promise<Record<string, string>> {
  try {
    // Check if directory exists
    if (!await fs.pathExists(directoryPath)) {
      throw new Error(`Directory not found: ${directoryPath}`);
    }
    
    // List all files
    const files = await fs.readdir(directoryPath);
    
    // Filter only markdown files
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    // Read each file
    const results: Record<string, string> = {};
    
    for (const file of markdownFiles) {
      const filePath = path.join(directoryPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Use filename as key (without extension)
      const fileName = path.basename(file, path.extname(file));
      results[fileName] = content;
    }
    
    return results;
  } catch (error) {
    console.error('Error reading documents:', error);
    throw new Error(`Failed to read documents: ${error}`);
  }
}

/**
 * Exports Memory Bank documents
 * @param sourceDir Source directory
 * @param format Export format ('folder' or 'json')
 * @param outputPath Output file path
 * @returns Path to the exported content
 */
export async function exportMemoryBank(sourceDir: string, format: string = 'folder', outputPath: string): Promise<string> {
  try {
    // Check if source directory exists
    if (!await fs.pathExists(sourceDir)) {
      throw new Error(`Source directory not found: ${sourceDir}`);
    }
    
    const exportDir = path.dirname(outputPath);
    await fs.ensureDir(exportDir);
    
    if (format === 'folder') {
      // Export as folder (copy entire directory structure)
      const exportFolderPath = path.join(exportDir, path.basename(sourceDir));
      await fs.copy(sourceDir, exportFolderPath);
      console.log(`Memory Bank folder exported to "${exportFolderPath}".`);
      return exportFolderPath;
    } else if (format === 'json') {
      // Export as JSON
      const documents = await readAllDocuments(sourceDir);
      
      // Add metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        memoryBank: documents
      };
      
      const jsonFilePath = outputPath.endsWith('.json') ? outputPath : `${outputPath}.json`;
      await fs.writeFile(jsonFilePath, JSON.stringify(exportData, null, 2), 'utf-8');
      console.log(`Memory Bank data exported to "${jsonFilePath}" in JSON format.`);
      return jsonFilePath;
    } else {
      throw new Error(`Unsupported format: ${format}. Use 'folder' or 'json'.`);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    throw new Error(`Failed to export Memory Bank: ${error}`);
  }
}

/**
 * Reads the .byterules file and returns its content
 * @param directory Directory where .byterules file is located
 * @returns Content of .byterules file
 */
export async function readByteRules(directory: string): Promise<string> {
  try {
    const byteRulesPath = path.join(directory, '.byterules');
    
    // Check if file exists
    if (!await fs.pathExists(byteRulesPath)) {
      throw new Error('ByteRules file not found. Memory Bank may not be properly initialized.');
    }
    
    // Read file
    const content = await fs.readFile(byteRulesPath, 'utf-8');
    
    return content;
  } catch (error) {
    console.error('Error reading ByteRules:', error);
    throw new Error(`Failed to read ByteRules: ${error}`);
  }
}

/**
 * Gets document workflow information based on document type
 * @param directory Directory where .byterules file is located
 * @param documentType Type of document to get workflow for
 * @returns Workflow information for the document
 */
export async function getDocumentWorkflow(directory: string, documentType: string): Promise<{
  purpose: string;
  updateTiming: string;
  structure: string[];
  commands: string[];
}> {
  try {
    // Get byterules content
    const byteRulesContent = await readByteRules(directory);
    
    // Extract section for the specific document type
    const regex = new RegExp(`###\\s*\\d+\\.\\s*${documentType.replace(/Context/g, ' Context')}\\s*\\([\\w\\.]+\\)[\\s\\S]*?(?=###\\s*\\d+\\.\\s*|##\\s*|$)`, 'i');
    const match = byteRulesContent.match(regex);
    
    if (!match) {
      return {
        purpose: `Information about ${documentType} document`,
        updateTiming: 'As needed',
        structure: ['No specific structure defined'],
        commands: [`update_document ${documentType.toLowerCase()}`]
      };
    }
    
    // Parse section content
    const sectionContent = match[0];
    
    // Extract purpose
    const purposeMatch = sectionContent.match(/\*\*Purpose\*\*:\s*(.*?)(?=\n)/);
    const purpose = purposeMatch ? purposeMatch[1].trim() : `Information about ${documentType}`;
    
    // Extract when to update
    const updateMatch = sectionContent.match(/\*\*When to Update\*\*:\s*(.*?)(?=\n)/);
    const updateTiming = updateMatch ? updateMatch[1].trim() : 'As needed';
    
    // Extract structure
    const structureMatch = sectionContent.match(/\*\*Structure\*\*:[\s\S]*?(?=\*\*|$)/);
    const structure = structureMatch 
      ? structureMatch[0]
          .replace(/\*\*Structure\*\*:\s*/, '')
          .trim()
          .split('\n')
          .map(line => line.replace(/^\s*-\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['No specific structure defined'];
    
    // Extract commands
    const commandsMatch = sectionContent.match(/\*\*Commands\*\*:[\s\S]*?(?=\*\*|$)/);
    const commands = commandsMatch 
      ? commandsMatch[0]
          .replace(/\*\*Commands\*\*:\s*/, '')
          .trim()
          .split('\n')
          .map(line => line.replace(/^\s*-\s*`(.*?)`.*/, '$1').trim())
          .filter(line => line.length > 0)
      : [`update_document ${documentType.toLowerCase()}`];
    
    return {
      purpose,
      updateTiming,
      structure,
      commands
    };
  } catch (error) {
    console.error('Error getting document workflow:', error);
    return {
      purpose: `Information about ${documentType} document`,
      updateTiming: 'As needed',
      structure: ['No specific structure defined'],
      commands: [`update_document ${documentType.toLowerCase()}`]
    };
  }
}

/**
 * Creates a structured template for a document based on ByteRules
 * @param directory Directory where .byterules file is located
 * @param documentType Type of document to create template for
 * @returns Structured template content
 */
export async function createDocumentTemplate(directory: string, documentType: string): Promise<string> {
  try {
    // Get workflow info
    const workflow = await getDocumentWorkflow(directory, documentType);
    
    // Build template
    let template = `# ${documentType.replace(/([A-Z])/g, ' $1').trim()}\n\n`;
    template += `> ${workflow.purpose}\n\n`;
    template += `> Last Updated: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    // Add sections based on structure
    for (const section of workflow.structure) {
      template += `## ${section}\n\n_Add content here_\n\n`;
    }
    
    // Add reference to update timing
    template += `---\n\n**Note:** This document should be updated ${workflow.updateTiming.toLowerCase()}.\n`;
    
    return template;
  } catch (error) {
    console.error('Error creating document template:', error);
    
    // Return basic template on error
    return `# ${documentType.replace(/([A-Z])/g, ' $1').trim()}\n\nLast Updated: ${new Date().toISOString().split('T')[0]}\n\n## Content\n\n_Add content here_\n`;
  }
}

/**
 * Analyzes document consistency with ByteRules guidelines
 * @param directory Directory where documents are located
 * @returns Analysis results with recommendations
 */
export async function analyzeDocumentConsistency(directory: string): Promise<{
  documentType: string;
  status: 'good' | 'needs-update';
  recommendation: string;
}[]> {
  try {
    // Get all documents
    const documents = await readAllDocuments(directory);
    const results = [];
    
    // Analyze each document
    for (const [docName, content] of Object.entries(documents)) {
      // Skip non-standard documents
      if (!['projectbrief', 'productContext', 'systemPatterns', 'techContext', 'activeContext', 'progress'].includes(docName)) {
        continue;
      }
      
      // Get workflow info
      const workflow = await getDocumentWorkflow(directory, docName);
      
      // Check for required sections
      const missingSections = [];
      for (const section of workflow.structure) {
        const sectionRegex = new RegExp(`##\\s*${section}`, 'i');
        if (!sectionRegex.test(content)) {
          missingSections.push(section);
        }
      }
      
      // Check if document was updated recently (within last 30 days)
      const lastUpdatedMatch = content.match(/Last Updated:\s*(\d{4}-\d{2}-\d{2})/);
      let needsUpdate = false;
      
      if (lastUpdatedMatch) {
        const lastUpdated = new Date(lastUpdatedMatch[1]);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        needsUpdate = lastUpdated < thirtyDaysAgo;
      } else {
        needsUpdate = true; // No update date found
      }
      
      let recommendation = '';
      let status: 'good' | 'needs-update' = 'good';
      
      if (missingSections.length > 0) {
        recommendation = `Missing sections: ${missingSections.join(', ')}`;
        status = 'needs-update';
      } else if (needsUpdate) {
        recommendation = 'Document may need updating (last update over 30 days ago)';
        status = 'needs-update';
      } else {
        recommendation = 'Document follows the structure defined in ByteRules';
      }
      
      results.push({
        documentType: docName,
        status,
        recommendation
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error analyzing documents:', error);
    throw new Error(`Failed to analyze documents: ${error}`);
  }
}