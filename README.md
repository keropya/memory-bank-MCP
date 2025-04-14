# Memory Bank MCP

<div align="center">
  <img src="https://raw.githubusercontent.com/modelcontextprotocol/mcp/main/icon.png" height="128">
  <h1>Memory Bank MCP</h1>
  <p>
    <b>A structured documentation system for project knowledge management via Model Context Protocol (MCP)</b>
  </p>
</div>

Memory Bank is an MCP server that helps teams create, manage, and access structured project documentation. It generates and maintains a set of interconnected Markdown documents that capture different aspects of project knowledge, from high-level goals to technical details and day-to-day progress.

## Features

- **AI-Generated Documentation**: Leverages Gemini API to automatically generate comprehensive project documentation
- **Structured Knowledge System**: Maintains six core document types in a hierarchical structure
- **MCP Integration**: Implements the Model Context Protocol for seamless integration with AI assistants
- **Customizable Location**: Specify where you want your Memory Bank directory created
- **Document Templates**: Pre-defined templates for project brief, product context, system patterns, etc.
- **AI-Assisted Updates**: Update documents manually or regenerate them with AI assistance
- **Advanced Querying**: Search across all documents with context-aware relevance ranking

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/memory-bank-mcp.git
cd memory-bank-mcp

# Install dependencies
npm install

# Create .env file with your Gemini API key (optional)
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

## Usage

### Development Mode

```bash
# Start in development mode
npm run dev
```

### Production Mode

```bash
# Build the project
npm run build

# Start in production mode
npm run start
```

### MCP Configuration

To integrate Memory Bank with the Model Context Protocol (MCP), add the following configuration to your `mcp.json` file:

```json
{
  "memoryBank": {
    "command": "node",
    "args": ["/path/to/memory-bank-mcp/dist/index.js"],
    "env": {
      "GEMINI_API_KEY": "your_gemini_api_key_here"
    }
  }
}
```

Replace `/path/to/memory-bank-mcp/dist/index.js` with the absolute path to your built index.js file, and add your Gemini API key (if applicable).

Example:

```json
{
  "memoryBank": {
    "command": "node",
    "args": ["/Users/username/memory-bank-mcp/dist/index.js"],
    "env": {
      "GEMINI_API_KEY": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  }
}
```

## MCP Tools

Memory Bank MCP provides the following tools via the Model Context Protocol:

### `initialize_memory_bank`

Creates a new Memory Bank structure with all document templates.

**Parameters:**
- `goal` (string): Project goal description (min 10 characters)
- `geminiApiKey` (string, optional): Gemini API key for document generation
- `location` (string, optional): Absolute path where memory-bank folder will be created

**Example:**
```javascript
await callTool({
  name: "initialize_memory_bank",
  arguments: {
    goal: "Building a self-documenting AI-powered software development assistant",
    location: "/Users/username/Documents/projects/ai-assistant"
  }
});
```

### `update_document`

Updates a specific document in the Memory Bank.

**Parameters:**
- `documentType` (enum): One of: `projectbrief`, `productContext`, `systemPatterns`, `techContext`, `activeContext`, `progress`
- `content` (string, optional): New content for the document
- `regenerate` (boolean, default: false): Whether to regenerate the document using AI

**Example:**
```javascript
await callTool({
  name: "update_document",
  arguments: {
    documentType: "projectbrief",
    content: "# Project Brief\n\n## Purpose\nTo develop an advanced and user-friendly AI..."
  }
});
```

### `query_memory_bank`

Searches across all documents with context-aware relevance ranking.

**Parameters:**
- `query` (string): Search query (min 5 characters)

**Example:**
```javascript
await callTool({
  name: "query_memory_bank",
  arguments: {
    query: "system architecture components"
  }
});
```

### `export_memory_bank`

Exports all Memory Bank documents.

**Parameters:**
- `format` (enum, default: "folder"): Export format, either "json" or "folder"
- `outputPath` (string, optional): Custom output path for the export

**Example:**
```javascript
await callTool({
  name: "export_memory_bank",
  arguments: {
    format: "json",
    outputPath: "/Users/username/Documents/exports"
  }
});
```

## Document Types

Memory Bank organizes project knowledge into six core document types:

1. **Project Brief** (`projectbrief.md`): Core document defining project objectives, scope, and vision
2. **Product Context** (`productContext.md`): Documents product functionality from a user perspective
3. **System Patterns** (`systemPatterns.md`): Establishes system architecture and component relationships
4. **Tech Context** (`techContext.md`): Specifies technology stack and implementation details
5. **Active Context** (`activeContext.md`): Tracks current tasks, open issues, and development focus
6. **Progress** (`progress.md`): Documents completed work, milestones, and project history

## License

MIT 