// =============================================================================
// PATCH SERVICE - Smart Diff & Merge System for LuxScaler Antigravity
// =============================================================================
// Implementa la estrategia de "Output Comprimido" para ediciones quirurgicas
// en lugar de reescribir documentos completos.
// =============================================================================

import { Patch, PatchResult, DocumentSection, DocumentTree } from '../types';

// -----------------------------------------------------------------------------
// 1. DOCUMENT TREE BUILDER
// -----------------------------------------------------------------------------

export function buildDocumentTree(content: string): DocumentTree {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  let currentSection: DocumentSection | null = null;
  let lineIndex = 0;

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    
    if (headerMatch) {
      if (currentSection) {
        currentSection.endLine = lineIndex - 1;
        sections.push(currentSection);
      }
      
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      
      currentSection = {
        id: `section-${slug}-${lineIndex}`,
        title,
        level,
        startLine: lineIndex,
        endLine: -1,
        content: line,
        children: []
      };
    } else if (currentSection) {
      currentSection.content += '\n' + line;
    }
    
    lineIndex++;
  }
  
  if (currentSection) {
    currentSection.endLine = lineIndex - 1;
    sections.push(currentSection);
  }

  return {
    sections,
    totalLines: lineIndex,
    hash: simpleHash(content)
  };
}

// -----------------------------------------------------------------------------
// 2. FUZZY MATCH - Encuentra anclas con tolerancia
// -----------------------------------------------------------------------------

export function findFuzzyMatch(
  content: string, 
  anchor: string, 
  threshold: number = 0.85
): number {
  if (!anchor || anchor.length < 5) return -1;
  
  const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ');
  const normalizedAnchor = anchor.toLowerCase().replace(/\s+/g, ' ');
  
  const exactIndex = normalizedContent.indexOf(normalizedAnchor);
  if (exactIndex !== -1) {
    return findOriginalIndex(content, exactIndex, normalizedContent);
  }
  
  const windowSize = normalizedAnchor.length;
  let bestMatch = { index: -1, score: 0 };
  
  for (let i = 0; i <= normalizedContent.length - windowSize; i++) {
    const window = normalizedContent.slice(i, i + windowSize);
    const score = calculateSimilarity(window, normalizedAnchor);
    
    if (score > bestMatch.score && score >= threshold) {
      bestMatch = { index: i, score };
    }
  }
  
  if (bestMatch.index !== -1) {
    return findOriginalIndex(content, bestMatch.index, normalizedContent);
  }
  
  return -1;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  let matches = 0;
  const minLen = Math.min(a.length, b.length);
  
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  
  return matches / Math.max(a.length, b.length);
}

function findOriginalIndex(original: string, normalizedIndex: number, normalized: string): number {
  let origIdx = 0;
  let normIdx = 0;
  
  while (normIdx < normalizedIndex && origIdx < original.length) {
    const origChar = original[origIdx].toLowerCase();
    const normChar = normalized[normIdx];
    
    if (origChar === normChar || (origChar.match(/\s/) && normChar === ' ')) {
      normIdx++;
    }
    origIdx++;
  }
  
  return origIdx;
}

// -----------------------------------------------------------------------------
// 3. APPLY PATCH - Aplica un parche individual
// -----------------------------------------------------------------------------

export function applyPatch(content: string, patch: Patch): PatchResult {
  const { section_id, operation, before_anchor, new_content } = patch;
  
  if (!operation || !new_content) {
    return { 
      success: false, 
      content, 
      error: 'Patch invalido: falta operation o new_content',
      patchId: section_id
    };
  }

  switch (operation) {
    case 'REPLACE': {
      if (!before_anchor) {
        return { success: false, content, error: 'REPLACE requiere before_anchor', patchId: section_id };
      }
      
      const anchorIndex = findFuzzyMatch(content, before_anchor, 0.80);
      if (anchorIndex === -1) {
        return { 
          success: false, 
          content, 
          error: `Anchor no encontrado: "${before_anchor.slice(0, 40)}..."`,
          patchId: section_id
        };
      }
      
      const sectionEnd = findSectionEnd(content, anchorIndex);
      const newDoc = content.slice(0, anchorIndex) + new_content + content.slice(sectionEnd);
      
      return { success: true, content: newDoc, patchId: section_id };
    }
    
    case 'INSERT_AFTER': {
      if (!before_anchor) {
        return { success: false, content, error: 'INSERT_AFTER requiere before_anchor', patchId: section_id };
      }
      
      const anchorIndex = findFuzzyMatch(content, before_anchor, 0.80);
      if (anchorIndex === -1) {
        return { 
          success: false, 
          content, 
          error: `Anchor no encontrado para INSERT_AFTER`,
          patchId: section_id
        };
      }
      
      const insertPoint = findSectionEnd(content, anchorIndex);
      const newDoc = content.slice(0, insertPoint) + '\n\n' + new_content + content.slice(insertPoint);
      
      return { success: true, content: newDoc, patchId: section_id };
    }
    
    case 'INSERT_BEFORE': {
      if (!before_anchor) {
        return { success: false, content, error: 'INSERT_BEFORE requiere before_anchor', patchId: section_id };
      }
      
      const anchorIndex = findFuzzyMatch(content, before_anchor, 0.80);
      if (anchorIndex === -1) {
        return { 
          success: false, 
          content, 
          error: `Anchor no encontrado para INSERT_BEFORE`,
          patchId: section_id
        };
      }
      
      const newDoc = content.slice(0, anchorIndex) + new_content + '\n\n' + content.slice(anchorIndex);
      
      return { success: true, content: newDoc, patchId: section_id };
    }
    
    case 'APPEND': {
      const newDoc = content + '\n\n' + new_content;
      return { success: true, content: newDoc, patchId: section_id };
    }
    
    default:
      return { 
        success: false, 
        content, 
        error: `Operacion desconocida: ${operation}`,
        patchId: section_id
      };
  }
}

function findSectionEnd(content: string, startIndex: number): number {
  const afterStart = content.slice(startIndex);
  const lines = afterStart.split('\n');
  
  let charCount = startIndex;
  let foundFirstLine = false;
  
  for (const line of lines) {
    if (foundFirstLine && line.match(/^#{1,6}\s/)) {
      return charCount;
    }
    foundFirstLine = true;
    charCount += line.length + 1;
  }
  
  return content.length;
}

// -----------------------------------------------------------------------------
// 4. APPLY ALL PATCHES - Aplica multiples parches con verificacion
// -----------------------------------------------------------------------------

export function applyAllPatches(
  content: string, 
  patches: Patch[]
): { 
  finalContent: string; 
  results: PatchResult[]; 
  success: boolean;
  sectionsLost: string[];
} {
  const originalTree = buildDocumentTree(content);
  let currentContent = content;
  const results: PatchResult[] = [];
  
  const sortedPatches = [...patches].sort((a, b) => {
    const order: Record<string, number> = { 'APPEND': 0, 'INSERT_AFTER': 1, 'INSERT_BEFORE': 2, 'REPLACE': 3 };
    return (order[a.operation] || 99) - (order[b.operation] || 99);
  });
  
  for (const patch of sortedPatches) {
    const result = applyPatch(currentContent, patch);
    results.push(result);
    
    if (result.success) {
      currentContent = result.content;
    }
  }
  
  const newTree = buildDocumentTree(currentContent);
  const sectionsLost: string[] = [];
  
  for (const originalSection of originalTree.sections) {
    const stillExists = newTree.sections.some(
      s => s.title.toLowerCase() === originalSection.title.toLowerCase()
    );
    if (!stillExists) {
      sectionsLost.push(originalSection.title);
    }
  }
  
  const allSuccess = results.every(r => r.success) && sectionsLost.length === 0;
  
  return {
    finalContent: currentContent,
    results,
    success: allSuccess,
    sectionsLost
  };
}

// -----------------------------------------------------------------------------
// 5. VERIFY INTEGRITY
// -----------------------------------------------------------------------------

export function verifyIntegrity(
  originalContent: string,
  newContent: string
): { 
  valid: boolean; 
  warnings: string[];
  sectionDiff: { added: string[]; removed: string[]; modified: string[] };
} {
  const originalTree = buildDocumentTree(originalContent);
  const newTree = buildDocumentTree(newContent);
  
  const warnings: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  
  for (const orig of originalTree.sections) {
    const match = newTree.sections.find(
      s => s.title.toLowerCase() === orig.title.toLowerCase()
    );
    if (!match) {
      removed.push(orig.title);
      warnings.push(`ALERTA: Seccion "${orig.title}" fue eliminada`);
    } else if (match.content !== orig.content) {
      modified.push(orig.title);
    }
  }
  
  for (const newSec of newTree.sections) {
    const match = originalTree.sections.find(
      s => s.title.toLowerCase() === newSec.title.toLowerCase()
    );
    if (!match) {
      added.push(newSec.title);
    }
  }
  
  const lengthRatio = newContent.length / originalContent.length;
  if (lengthRatio < 0.5) {
    warnings.push(`ALERTA: El documento se redujo a ${Math.round(lengthRatio * 100)}% del original`);
  }
  
  return {
    valid: removed.length === 0 && warnings.length === 0,
    warnings,
    sectionDiff: { added, removed, modified }
  };
}

// -----------------------------------------------------------------------------
// 6. HELPER: Simple Hash
// -----------------------------------------------------------------------------

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// -----------------------------------------------------------------------------
// 7. EXPORT
// -----------------------------------------------------------------------------

export const patchService = {
  buildDocumentTree,
  findFuzzyMatch,
  applyPatch,
  applyAllPatches,
  verifyIntegrity
};
