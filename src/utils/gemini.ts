import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

const DEFAULT_API_KEY = 'AIzaSyBCwxeNGM9Jwnl4C5iqfgZtlsd4RcFanWE';

let apiKey = DEFAULT_API_KEY;

console.log('Checking for Gemini API key...');
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is not defined.');
  
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, `GEMINI_API_KEY=${DEFAULT_API_KEY}`, 'utf-8');
      console.log('Created .env file with default API key.');
    }
  } catch (err) {
    console.error('Failed to create .env file:', err);
  }
  
  apiKey = DEFAULT_API_KEY;
  console.log('Using default API key.');
}

if (apiKey === 'your_gemini_api_key_here') {
  console.warn('GEMINI_API_KEY is set to the example value. Using default API key instead.');
  apiKey = DEFAULT_API_KEY;
}

console.log('Gemini API key found.');

let genAI: GoogleGenerativeAI;
try {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('Gemini client created successfully.');
} catch (error) {
  console.error('Failed to create Gemini client:', error);
  throw new Error(`Gemini client oluşturulamadı: ${error}`);
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function generateContent(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API hatası:', error);
    throw new Error(`Belge içeriği üretilirken hata oluştu: ${error}`);
  }
}

export async function fillTemplate(templatePath: string, values: Record<string, string>): Promise<string> {
  try {
    let templateContent = await fs.readFile(templatePath, 'utf-8');
    
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      templateContent = templateContent.replace(regex, value);
    });
    
    return templateContent;
  } catch (error) {
    console.error('Şablon doldurma hatası:', error);
    throw new Error(`Şablon doldurulurken hata oluştu: ${error}`);
  }
}

export async function generateAllDocuments(goal: string): Promise<Record<string, string>> {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  
  const basePrompt = `
You are a project documentation expert. You will create comprehensive documentation for the following project:

PROJECT PURPOSE: ${goal}

Create the following documents for this project:
`;

  const documentTypes = {
    projectbrief: `
1. Project Brief (projectbrief.md):
   - Explain the general purpose and vision of the project
   - List the main objectives
   - Define the target audience
   - Specify key features
   - Determine success criteria
   - Present a realistic timeline`,
    
    productContext: `
2. Product Context (productContext.md):
   - Conduct market analysis
   - Evaluate competitive landscape
   - Write user stories
   - List requirements
   - Explain workflows
   - Define product roadmap`,
    
    systemPatterns: `
3. System Patterns (systemPatterns.md):
   - Explain architectural design
   - Define data models
   - Specify API definitions
   - Show component structure
   - List integration points
   - Explain scalability strategy`,
    
    techContext: `
4. Technology Context (techContext.md):
   - List technologies used
   - Specify software development tools
   - Define development environment
   - Explain testing strategy
   - Define deployment process
   - Explain continuous integration approach`,
    
    activeContext: `
5. Active Context (activeContext.md):
   - Explain current sprint goals
   - List ongoing tasks
   - Specify known issues
   - Define priorities
   - Explain next steps
   - Add meeting notes`,
    
    progress: `
6. Progress Report (progress.md):
   - List completed tasks
   - Specify milestones
   - Report test results
   - Show performance metrics
   - Summarize feedback
   - Maintain a changelog`
  };
  

  const results: Record<string, string> = {};

  for (const [docType, docPrompt] of Object.entries(documentTypes)) {
    console.log(`${docType} belgesi oluşturuluyor...`);
    
    const fullPrompt = `${basePrompt}${docPrompt}\n\nPlease create content only for the "${docType}" document. Use Markdown format with section headers marked by ##. At the end of the document, add the note "Created on ${currentDate}".`;
    
    const content = await generateContent(fullPrompt);
    results[docType] = content;
  }

  return results;
} 