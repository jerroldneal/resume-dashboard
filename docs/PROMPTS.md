# Prompt Templates Guide

## Overview

Prompt templates define the instructions sent to the LLM for various operations. The Prompts tab allows you to view, edit, and test your prompt templates.

---

## Built-in Templates

### 1. Requirement Extraction

**ID:** `requirement-extraction`

**Purpose:** Extract structured requirements from job descriptions

**Template Variables:**
- `jobDescription` - The full job description text

**Used For:** Analyzing job postings to identify required skills, experience, and qualifications

**Example Input:**
```
{jobDescription}
```

**Expected Output Structure:**
```json
{
  "required_skills": ["JavaScript", "React"],
  "preferred_skills": ["TypeScript"],
  "required_experience": "5 years",
  "education": "BS in CS",
  "certifications": ["AWS"],
  "responsibilities": ["Build features", "Lead team"]
}
```

---

### 2. Resume Generation

**ID:** `resume-generation`

**Purpose:** Generate a tailored resume from job description and existing content

**Template Variables:**
- `jobDescription` - The job description to tailor for
- `baseResume` - Existing resume content to refine

**Used For:** Creating custom resumes for each application

**Example Input:**
```
Job Description:
{jobDescription}

Base Resume:
{baseResume}
```

**Output:** Resume in Markdown format

---

### 3. Gap Analysis

**ID:** `gap-analysis`

**Purpose:** Compare resume against job requirements to identify gaps

**Template Variables:**
- `jobDescription` - The job requirements
- `resumeContent` - The resume to analyze

**Used For:** Identifying missing qualifications and suggesting improvements

**Example Input:**
```
Job Description:
{jobDescription}

Resume Content:
{resumeContent}
```

**Output Structure:**
```json
{
  "coverage": 85,
  "gaps": [
    {"requirement": "AWS certification", "severity": "moderate", "suggestion": "Add AWS experience"}
  ],
  "strengths": ["React experience"],
  "overallAssessment": "Good candidate with minor gaps"
}
```

---

### 4. Fact Check

**ID:** `fact-check`

**Purpose:** Verify claims in a resume for accuracy and credibility

**Template Variables:**
- `resumeContent` - The resume to fact-check

**Used For:** Ensuring resume content is truthful and credible

**Example Input:**
```
Resume Content:
{resumeContent}
```

**Output Structure:**
```json
{
  "overallCredibility": "medium",
  "claims": [
    {
      "statement": "Led team of 10 engineers",
      "category": "dates",
      "concern": "unverifiable",
      "suggestion": "Verify team size claim"
    }
  ],
  "recommendations": ["Add specific metrics"]
}
```

---

## How to Use the Prompts Tab

### Viewing Templates
1. Navigate to **Prompts** tab
2. See all available templates with their descriptions
3. Click **Edit** to modify a template
4. Click **Test** to validate with sample inputs

### Editing a Template
1. Click **Edit** on a template
2. Modify the template text in the Monaco editor
3. Add or remove variables as needed
4. Click **Save Changes** to apply

### Testing a Template
1. Click **Test** on any template
2. Enter sample values for each variable
3. Click **Run Test**
4. See results from LLM or template preview

---

## Writing Custom Prompts

### Best Practices

1. **Be Specific:** Clearly define what you want the LLM to output
2. **Use JSON Responses:** Ask for structured JSON when you need parsed data
3. **Include Examples:** Show desired output format in the prompt
4. **Handle Edge Cases:** Account for missing or empty inputs

### Template Pattern

```
[Role/Instruction]

[Input Data]
{inputVariable}

[Expected Output Format]
Return [format] with:
- item1
- item2

Return ONLY the output, no explanations.
```

### Example Custom Prompt

```
You are a technical skills extractor.

Input:
{jobDescription}

Extract all technical skills mentioned. Return a JSON object:
{
  "languages": ["Python", "JavaScript"],
  "frameworks": ["React", "Django"],
  "tools": ["Git", "Docker"]
}
```

---

## Variable Naming Rules

- Variables must be valid JavaScript identifiers
- Use descriptive names: `jobDescription` not `jd`
- Enclose in curly braces in templates: `{variableName}`
- Variables are case-sensitive

---

## Testing Prompts with Real Data

### Get Sample Data from an Application

1. Go to **Applications** tab
2. Select an application
3. Copy the job description from the application details

### Create Test Input

In the **Test** modal:
1. Paste real job description into `jobDescription` field
2. Or paste existing resume into `resumeContent` field
3. Click **Run Test**

---

## Default Model

The default model is `qwen2.5:1.5b`. For better quality results with complex prompts, you may want to switch to a larger model via **Settings** > **LLM Model**.

**Available models:**
- `qwen2.5:1.5b` (default) - Fast, good quality
- `llama2` - Balanced, widely available
- `llama3.2:3b` - Latest, good at reasoning
- Custom models - Any Ollama model

---

## Troubleshooting

### Prompt Not Working
- Check variable names match exactly
- Ensure all required variables are provided
- Check LLM is running (`ollama list`)

### Unexpected Output
- Make the output format more specific
- Add examples of desired format
- Reduce temperature in settings

### Template Preview Only
If you see "LLM API unavailable" in the output, Ollama is not running or not accessible at the configured endpoint.