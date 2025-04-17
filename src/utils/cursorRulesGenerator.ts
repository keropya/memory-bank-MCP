/**
 * Utility functions for generating Cursor rules
 *
 * Note: This module dynamically imports the gemini.js module when necessary
 * to generate AI-powered content for cursor rules.
 */

/**
 * Generates cursor rules content based on project purpose
 * @param purpose Project purpose description
 * @returns Generated cursor rules content
 */
export async function generateCursorRules(purpose: string): Promise<string> {
  // Format current date in English locale
  const currentDate = new Date().toLocaleDateString("en-US");

  // Project type detection based on user's purpose
  const projectType = detectProjectType(purpose);

  // AI ile içerik oluştur
  try {
    console.log("Attempting to generate cursor rules with AI...");
    const mainRulesContent = await generateMainCursorRulesWithAI(
      purpose,
      currentDate,
      projectType
    );
    console.log("Successfully generated cursor rules with AI");
    return mainRulesContent;
  } catch (error) {
    console.error("Error generating cursor rules with AI:", error);
    
    // Hata detayı için log ekleyelim
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
      
      // Kullanıcıya daha açıklayıcı hata mesajı göster
      throw new Error(`AI ile içerik oluşturulamadı: ${error.message}`);
    }
    
    // Genel hata durumunda
    throw new Error("AI ile içerik oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
  }
}

/**
 * Detects project type based on user's purpose
 */
function detectProjectType(purpose: string): string {
  const purposeLower = purpose.toLowerCase();

  if (
    purposeLower.includes("frontend") ||
    purposeLower.includes("web") ||
    purposeLower.includes("site") ||
    purposeLower.includes("ui")
  ) {
    return "frontend";
  }

  if (
    purposeLower.includes("backend") ||
    purposeLower.includes("api") ||
    purposeLower.includes("service")
  ) {
    return "backend";
  }

  if (
    purposeLower.includes("mobile") ||
    purposeLower.includes("android") ||
    purposeLower.includes("ios")
  ) {
    return "mobile";
  }

  if (
    purposeLower.includes("fullstack") ||
    purposeLower.includes("full-stack")
  ) {
    return "fullstack";
  }

  if (
    purposeLower.includes("data") ||
    purposeLower.includes("analytics") ||
    purposeLower.includes("ml") ||
    purposeLower.includes("ai")
  ) {
    return "data";
  }

  if (
    purposeLower.includes("devops") ||
    purposeLower.includes("infrastructure") ||
    purposeLower.includes("cloud")
  ) {
    return "devops";
  }

  return "general";
}

/**
 * Generates the main cursor rules content using Gemini API
 */
async function generateMainCursorRulesWithAI(
  purpose: string,
  currentDate: string,
  projectType: string
): Promise<string> {
  const frontmatter = `---
description: Main development guidelines for the ${purpose} project
globs: **/*
alwaysApply: true
---`;

  try {
    console.log("Dynamically importing gemini.js module...");
    const { generateContent } = await import("./gemini.js");
    console.log("Successfully imported gemini.js module");

    const prompt = `
As a software development expert, you are creating Cursor rules for the ${purpose} project.

PROJECT DETAILS:
- PURPOSE: ${purpose}
- TYPE: ${projectType}
- DATE: ${currentDate}

FORMAT REQUIREMENTS:
1. Start with a clear and concise main title
2. Use hierarchical markdown headings (## for main sections, ### for subsections)
3. Use numbered lists for step-by-step instructions
4. Use bullet points for important notes and guidelines
5. Include language-specific code blocks for all examples
6. Provide good and bad examples with explanatory comments
7. Use bold and italic formatting to emphasize important points
8. Include a footer with "Powered by tuncer-byte" and GitHub reference

CONTENT REQUIREMENTS:
1. PROJECT OVERVIEW:
   - Detailed project purpose and objectives
   - Technical goals and success criteria
   - Recommended technology stack with version numbers
   - Architectural patterns and design decisions

2. CODE STRUCTURE AND ORGANIZATION:
   - Detailed file/folder structure for ${projectType} projects
   - Comprehensive naming conventions with examples
   - Module organization and dependency management
   - State management patterns (if applicable)

3. CODING STANDARDS:
   - Language-specific best practices
   - Error handling and logging strategies
   - Performance optimization techniques
   - Security implementation guidelines
   - Code review checklist

4. DEVELOPMENT WORKFLOW:
   - Git workflow with branch naming rules
   - Commit message format with examples
   - PR template and review process
   - CI/CD pipeline configuration
   - Environment management

5. TESTING REQUIREMENTS:
   - Test pyramid implementation
   - Framework setup and configuration
   - Test coverage goals and metrics
   - Mocking and test data strategies
   - E2E testing approach

6. DOCUMENTATION STANDARDS:
   - Code documentation templates
   - API documentation format
   - README structure and content
   - Architectural decision records
   - Deployment documentation

7. QUALITY ASSURANCE:
   - Code quality metrics
   - Static analysis tools
   - Performance monitoring
   - Security scanning
   - Accessibility guidelines

8. FILE ORGANIZATION:
   - Explain the purpose of each directory
   - Provide examples of correct file placement

9. ONBOARDING PROCESS:
   - Step-by-step guide for new developers
   - Required development environment setup
   - Access management and permissions
   - Communication channels and protocols

10. DEPLOYMENT STRATEGY:
    - Environment configuration
    - Release process
    - Rollback procedures
    - Monitoring and alerting setup

Include specific, practical examples that directly apply to ${projectType} development.
Each guideline should be actionable and specific.
End with a footer containing "Powered by tuncer-byte" and GitHub reference.
`;

    console.log("Sending request to Gemini API...");
    const aiGeneratedContent = await generateContent(prompt);
    console.log("Successfully received response from Gemini API");

    return `${frontmatter}

${aiGeneratedContent}

---
*Powered by tuncer-byte*
*GitHub: @tuncer-byte*`;
  } catch (error) {
    console.error("Error generating cursor rules with AI:", error);

    // Daha açıklayıcı hata mesajı
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) {
        throw new Error(
          "Gemini API anahtarı bulunamadı. Lütfen .env dosyasında GEMINI_API_KEY değişkenini tanımlayın."
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Gemini API ile iletişim kurulamadı. Lütfen internet bağlantınızı kontrol edin."
        );
      }
    }

    // Orijinal hatayı yeniden fırlat
    throw error;
  }
}
