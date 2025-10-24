# XML Format Examples for Claude Interactions

## Overview

This document shows the exact XML formats Claude should return for each service.

## 1. Concept Extraction

### Prompt Format
```
Analyze this textbook excerpt and extract key domain concepts.

<text_to_analyze>
{text content here}
</text_to_analyze>

Return your response using XML tags in this exact format:
[XML example shown]
```

### Expected Response
```xml
<concepts>
  <concept>
    <term>Virtual Machine</term>
    <definition>A software emulation of a physical computer system that runs an operating system and applications</definition>
    <source_sentences>
      <sentence>A virtual machine (VM) is a software emulation of a physical computer.</sentence>
      <sentence>VMs allow multiple operating systems to run on a single physical machine.</sentence>
    </source_sentences>
  </concept>
  <concept>
    <term>Hypervisor</term>
    <definition>Software that creates and manages virtual machines</definition>
    <source_sentences>
      <sentence>A hypervisor is the software layer that enables virtualization.</sentence>
    </source_sentences>
  </concept>
</concepts>
```

### Python Parsing
```python
import xml.etree.ElementTree as ET

root = ET.fromstring(xml_response)
concepts = []

for concept_elem in root.findall('concept'):
    term = concept_elem.find('term').text
    definition = concept_elem.find('definition').text
    
    source_sentences = []
    source_sentences_elem = concept_elem.find('source_sentences')
    if source_sentences_elem is not None:
        for sentence_elem in source_sentences_elem.findall('sentence'):
            source_sentences.append(sentence_elem.text)
    
    concepts.append({
        'term': term,
        'definition': definition,
        'source_sentences': source_sentences
    })
```

---

## 2. Analogy Generation

### Prompt Format
```
Generate {num_analogies} personalized analogies...

**Output Format (XML):**
[XML example shown]
```

### Expected Response
```xml
<response>
  <analogies>
    <analogy>
      <concept>Virtual Machine</concept>
      <analogy_text>Think of a virtual machine like an apartment building. Just as multiple families can live independently in separate apartments within one building, multiple operating systems can run independently on virtual machines within one physical computer. Each apartment (VM) has its own space, utilities, and privacy, but they all share the same building infrastructure (physical hardware).</analogy_text>
      <based_on_interest>architecture</based_on_interest>
      <learning_style_adaptation>This visual analogy helps you picture the concept spatially, making it easier to understand the isolation and resource sharing aspects of virtualization.</learning_style_adaptation>
    </analogy>
    <analogy>
      <concept>Hypervisor</concept>
      <analogy_text>A hypervisor is like a building manager who allocates apartments, manages utilities, and ensures each tenant gets their fair share of resources without interfering with others.</analogy_text>
      <based_on_interest>architecture</based_on_interest>
      <learning_style_adaptation>Extends the apartment building metaphor to explain the management layer.</learning_style_adaptation>
    </analogy>
  </analogies>
  <memory_techniques>
    <technique>
      <technique_type>acronym</technique_type>
      <technique_text>Remember VM as "Virtual Mansion" - a big house with many independent rooms (virtual machines) inside.</technique_text>
      <application>Use this mnemonic when you need to recall what VMs do - they create multiple independent environments within one physical space.</application>
    </technique>
    <technique>
      <technique_type>mind_palace</technique_type>
      <technique_text>Place the hypervisor at your front door (it controls entry), VMs in different rooms (isolated spaces), and shared resources in the basement (common infrastructure).</technique_text>
      <application>Walk through your mental house to recall the virtualization architecture.</application>
    </technique>
    <technique>
      <technique_type>chunking</technique_type>
      <technique_text>Group virtualization concepts into three chunks: 1) Physical layer (hardware), 2) Hypervisor layer (management), 3) Virtual layer (VMs and guest OSes).</technique_text>
      <application>Remember the three-layer stack when explaining virtualization to others.</application>
    </technique>
  </memory_techniques>
  <learning_mantras>
    <mantra>
      <mantra_text>One machine, many systems</mantra_text>
      <explanation>This captures the essence of virtualization - running multiple operating systems on a single physical computer.</explanation>
    </mantra>
    <mantra>
      <mantra_text>Isolation through abstraction</mantra_text>
      <explanation>VMs are isolated from each other through the abstraction layer provided by the hypervisor.</explanation>
    </mantra>
    <mantra>
      <mantra_text>Share hardware, separate software</mantra_text>
      <explanation>Virtualization allows sharing physical resources while keeping software environments completely separate.</explanation>
    </mantra>
  </learning_mantras>
</response>
```

### Python Parsing
```python
import xml.etree.ElementTree as ET

root = ET.fromstring(xml_response)

# Parse analogies
analogies = []
analogies_elem = root.find('analogies')
if analogies_elem is not None:
    for analogy_elem in analogies_elem.findall('analogy'):
        analogies.append({
            'concept': analogy_elem.find('concept').text,
            'analogy_text': analogy_elem.find('analogy_text').text,
            'based_on_interest': analogy_elem.find('based_on_interest').text,
            'learning_style_adaptation': analogy_elem.find('learning_style_adaptation').text
        })

# Parse memory techniques
techniques = []
techniques_elem = root.find('memory_techniques')
if techniques_elem is not None:
    for technique_elem in techniques_elem.findall('technique'):
        techniques.append({
            'technique_type': technique_elem.find('technique_type').text,
            'technique_text': technique_elem.find('technique_text').text,
            'application': technique_elem.find('application').text
        })

# Parse mantras
mantras = []
mantras_elem = root.find('learning_mantras')
if mantras_elem is not None:
    for mantra_elem in mantras_elem.findall('mantra'):
        mantras.append({
            'mantra_text': mantra_elem.find('mantra_text').text,
            'explanation': mantra_elem.find('explanation').text
        })
```

---

## 3. Relationship Classification

### Prompt Format
```
Determine the relationship between these two concepts...

**Return as XML:**
[XML example shown]
```

### Expected Response
```xml
<relationship>
  <structure_category>hierarchical</structure_category>
  <relationship_type>has_component</relationship_type>
  <direction>A_to_B</direction>
  <strength>0.85</strength>
  <reasoning>The hypervisor is a component that manages virtual machines. This is a clear hierarchical relationship where the hypervisor is part of the virtualization system and has a specific management role.</reasoning>
</relationship>
```

### Python Parsing
```python
import xml.etree.ElementTree as ET

root = ET.fromstring(xml_response)

relationship = {
    'structure_category': root.find('structure_category').text,
    'relationship_type': root.find('relationship_type').text,
    'direction': root.find('direction').text,
    'strength': float(root.find('strength').text),
    'reasoning': root.find('reasoning').text
}
```

---

## 4. Question Generation

### Prompt Format
```
Generate personalized questions...

**Return as XML:**
[XML example shown]
```

### Expected Response
```xml
<questions>
  <question>
    <question_text>Think of a time you organized items into different categories. How did you decide what belonged in each group? How does this relate to how a hypervisor organizes virtual machines?</question_text>
    <question_type>experience_mapping</question_type>
    <reasoning>This question connects the user's organizational experience to the hierarchical structure of virtualization, making the abstract concept more concrete.</reasoning>
  </question>
  <question>
    <question_text>In your work with software, have you ever needed to run multiple programs that might conflict with each other? How did you handle that? How is this similar to what virtual machines solve?</question_text>
    <question_type>process_parallel</question_type>
    <reasoning>Relates to the user's professional background and highlights the isolation benefit of VMs.</reasoning>
  </question>
  <question>
    <question_text>If you were to explain virtual machines using an analogy from architecture (one of your interests), what building or structure would you compare them to?</question_text>
    <question_type>metaphorical_bridge</question_type>
    <reasoning>Leverages the user's interest in architecture to create a personal connection to the concept.</reasoning>
  </question>
</questions>
```

### Python Parsing
```python
import xml.etree.ElementTree as ET

root = ET.fromstring(xml_response)
questions = []

for q_elem in root.findall('question'):
    questions.append({
        'question_text': q_elem.find('question_text').text,
        'question_type': q_elem.find('question_type').text,
        'reasoning': q_elem.find('reasoning').text if q_elem.find('reasoning') is not None else None
    })
```

---

## Best Practices

### For Claude Prompts

1. **Be explicit about XML format**
   - Show the exact structure you want
   - Include opening and closing tags
   - Provide a complete example

2. **Use descriptive tag names**
   - `<concept>` not `<c>`
   - `<analogy_text>` not `<text>`
   - Self-documenting structure

3. **Request specific structure**
   - "Return your response using XML tags"
   - "Use this exact format"
   - "Begin your XML response"

4. **Handle text content properly**
   - Multi-line text works fine in XML
   - No need to escape quotes
   - Preserve formatting naturally

### For Python Parsing

1. **Always check for None**
   ```python
   text = elem.text if elem is not None and elem.text else ''
   ```

2. **Extract XML from response**
   ```python
   xml_start = response.find('<root_tag>')
   xml_end = response.rfind('</root_tag>') + len('</root_tag>')
   xml_str = response[xml_start:xml_end]
   ```

3. **Use try-except blocks**
   ```python
   try:
       root = ET.fromstring(xml_str)
   except ET.ParseError as e:
       logger.error(f"XML parse error: {e}")
       return fallback_value
   ```

4. **Iterate safely**
   ```python
   elem = root.find('optional_element')
   if elem is not None:
       for child in elem.findall('child'):
           # process child
   ```

---

## Why XML Over JSON?

### Advantages

1. **More forgiving** - Missing comma doesn't break entire response
2. **Natural for LLMs** - More XML in training data
3. **Self-documenting** - Tags explain structure
4. **Better for text** - No escaping quotes in content
5. **Hierarchical** - Natural nesting without brackets

### When to Use Each

- **XML**: AI responses, structured data with text content
- **Markdown**: Human-editable templates, documentation
- **JSON**: API contracts, configuration files, data storage

---

## Testing

Run the test suite to verify XML parsing:
```bash
python backend/test_xml_migration.py
```

Expected: All tests pass ✅
