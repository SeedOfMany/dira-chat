# Task Messages Guide - User-Friendly Language

## Quick Reference for End-User Task Messages

This guide provides ready-to-use, user-friendly task messages for different operations in the app. Always use language your users understand, not technical jargon.

---

## Legal Document Search

**Use Case:** When searching legal documents/regulations

```typescript
{
  title: "Searching legal documents",
  items: [
    { text: "✓ Understanding your question", status: "completed" },
    { text: "✓ Preparing search", status: "completed" },
    { text: "Finding relevant sections...", status: "running" },
  ]
}
```

**Alternative variations:**
- "Searching regulations"
- "Looking through legal files"
- "Finding relevant clauses"
- "Checking legal requirements"

---

## Document Upload & Processing

**Use Case:** When user uploads a legal document

```typescript
{
  title: "Processing your document",
  items: [
    { text: "✓ Reading document content", status: "completed" },
    { text: "✓ Breaking into sections", status: "completed" },
    { text: "Preparing for search...", status: "running" },
    { text: "Saving to library", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Uploading your document"
- "Analyzing document structure"
- "Extracting key information"
- "Adding to your library"

---

## Contract Analysis

**Use Case:** When analyzing a contract for compliance

```typescript
{
  title: "Analyzing your contract",
  items: [
    { text: "✓ Reading contract terms", status: "completed" },
    { text: "✓ Reviewing regulations", status: "completed" },
    { text: "Checking for issues...", status: "running" },
    { text: "Preparing recommendations", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Reviewing contract compliance"
- "Checking legal requirements"
- "Identifying potential risks"
- "Comparing with regulations"

---

## Generating Reports

**Use Case:** When creating legal reports or summaries

```typescript
{
  title: "Creating your report",
  items: [
    { text: "✓ Gathering information", status: "completed" },
    { text: "✓ Analyzing key points", status: "completed" },
    { text: "Writing summary...", status: "running" },
    { text: "Formatting document", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Preparing your summary"
- "Generating analysis"
- "Compiling findings"
- "Creating document"

---

## Clause Extraction

**Use Case:** When extracting specific clauses from documents

```typescript
{
  title: "Finding clauses",
  items: [
    { text: "✓ Scanning document", status: "completed" },
    { text: "Identifying relevant clauses...", status: "running" },
    { text: "Organizing results", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Extracting key terms"
- "Finding specific sections"
- "Locating important clauses"
- "Pulling out requirements"

---

## Compliance Check

**Use Case:** When checking document against regulations

```typescript
{
  title: "Checking compliance",
  items: [
    { text: "✓ Loading regulations", status: "completed" },
    { text: "✓ Reading your document", status: "completed" },
    { text: "Comparing requirements...", status: "running" },
    { text: "Identifying gaps", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Reviewing compliance status"
- "Checking against regulations"
- "Verifying requirements"
- "Finding missing items"

---

## Document Comparison

**Use Case:** When comparing two documents or versions

```typescript
{
  title: "Comparing documents",
  items: [
    { text: "✓ Loading documents", status: "completed" },
    { text: "Finding differences...", status: "running" },
    { text: "Highlighting changes", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Checking for changes"
- "Finding differences"
- "Reviewing updates"
- "Identifying modifications"

---

## Risk Assessment

**Use Case:** When analyzing legal risks

```typescript
{
  title: "Assessing risks",
  items: [
    { text: "✓ Reading document", status: "completed" },
    { text: "✓ Checking regulations", status: "completed" },
    { text: "Identifying potential issues...", status: "running" },
    { text: "Rating risk levels", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Analyzing potential risks"
- "Reviewing concerns"
- "Checking for issues"
- "Evaluating problems"

---

## Translation/Summarization

**Use Case:** When translating or summarizing legal text

```typescript
{
  title: "Simplifying legal language",
  items: [
    { text: "✓ Reading original text", status: "completed" },
    { text: "Translating to plain English...", status: "running" },
    { text: "Creating summary", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Summarizing document"
- "Creating plain language version"
- "Simplifying terms"
- "Making it easier to understand"

---

## Batch Processing

**Use Case:** When processing multiple documents

```typescript
{
  title: "Processing documents",
  items: [
    { text: "✓ Processed 3 of 10 documents", status: "completed" },
    { text: "Working on document 4...", status: "running" },
    { text: "6 documents remaining", status: "pending" },
  ]
}
```

**Alternative variations:**
- "Analyzing multiple files"
- "Processing your documents (3/10)"
- "Reviewing files..."

---

## Error States

**When things go wrong, be helpful and honest:**

```typescript
// Network error
{ text: "❌ Unable to connect right now. Please try again.", status: "error" }

// Document error
{ text: "❌ Couldn't read this document. Try a different format.", status: "error" }

// Search error
{ text: "❌ Search unavailable. We're working on it.", status: "error" }

// Timeout
{ text: "❌ This is taking longer than expected. Please try again.", status: "error" }
```

---

## Writing Guidelines

### ✅ DO:
1. **Use active voice**: "Searching documents" not "Documents are being searched"
2. **Be specific**: "Finding employment clauses" not "Processing"
3. **Show progress**: "Processed 5 of 20 pages" not just "Processing"
4. **Be conversational**: "Looking through your files" not "Scanning directory"
5. **Use familiar words**: "Checking" not "Validating"

### ❌ DON'T:
1. **Use jargon**: No "embeddings", "vectors", "APIs", "queries"
2. **Be vague**: Not just "Loading..." - say what's loading
3. **Use tech terms**: No "parsing", "serializing", "executing"
4. **Expose internals**: No "Connecting to database", "Running SQL"
5. **Be robotic**: Avoid "Processing initiated" - say "Starting search"

---

## Context Matters

Choose words based on your user's domain:

**Legal professionals might understand:**
- "Analyzing statutory requirements"
- "Reviewing case precedents"
- "Checking jurisdictional compliance"

**General users prefer:**
- "Checking legal requirements"
- "Reviewing similar cases"
- "Making sure this follows the law"

**Pro tip:** When in doubt, use simpler language. Even experts appreciate clarity.

---

## Testing Your Messages

Before using task messages, ask:

1. **Would my grandmother understand this?**
   - If no, simplify it

2. **Does it explain what's happening?**
   - "Processing" is bad
   - "Reading your document" is good

3. **Is it honest about timing?**
   - Don't say "Almost done" if it's just starting
   - Use "This may take a minute" for long operations

4. **Does it reduce anxiety?**
   - Users worry when things are unclear
   - "Finding the best matches" is better than "Searching..."

---

## Quick Translation Table

| ❌ Technical Term | ✅ User-Friendly |
|------------------|-----------------|
| Generating embeddings | Preparing search |
| Querying database | Searching files |
| Parsing document | Reading document |
| Executing RAG pipeline | Searching library |
| Computing similarity | Finding matches |
| Tokenizing input | Understanding question |
| Running inference | Getting answer |
| Streaming response | Writing answer |
| Indexing chunks | Organizing sections |
| Vector search | Smart search |
| Semantic matching | Finding relevant info |
| OCR processing | Reading text from image |
| NLP analysis | Understanding content |
| Model inference | Analyzing document |
| API call | Getting information |
| Batch processing | Handling multiple files |
| Error handling | Fixing issue |
| Retry logic | Trying again |
| Rate limiting | Waiting our turn |
| Cache warming | Preparing system |

---

## Examples by User Type

### For Legal Teams:
```
"Reviewing contract provisions"
"Checking regulatory compliance"
"Analyzing legal implications"
"Identifying risk factors"
```

### For HR Departments:
```
"Checking employment policies"
"Reviewing hiring documents"
"Verifying compliance"
"Finding relevant guidelines"
```

### For General Users:
```
"Reading your document"
"Finding what you need"
"Checking requirements"
"Getting your answer"
```

---

## Remember:

**Your task messages are part of your user experience.**

Good messages:
- Build trust ("We're working on it")
- Reduce anxiety ("This will take a minute")
- Show progress ("5 of 10 done")
- Feel human ("Looking for answers")

Bad messages:
- Create confusion ("Executing pipeline")
- Sound robotic ("Process initiated")
- Hide progress ("Loading...")
- Use jargon ("Vectorizing query")

---

When in doubt, imagine explaining what the system is doing to a friend over coffee. That's the language you should use.