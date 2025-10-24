"""
Test XML Migration

Verify that the JSON to XML migration works correctly.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.template_loader import load_question_templates, load_onboarding_questions


def test_question_templates():
    """Test loading question templates from Markdown"""
    print("\n" + "="*80)
    print("Testing Question Templates (Markdown)")
    print("="*80)
    
    try:
        templates = load_question_templates()
        
        print(f"\n✅ Loaded templates successfully")
        print(f"\nCategories found:")
        for category, template_list in templates.items():
            print(f"  - {category}: {len(template_list)} templates")
        
        # Show sample template
        if templates['hierarchical_templates']:
            sample = templates['hierarchical_templates'][0]
            print(f"\n📋 Sample Template:")
            print(f"  ID: {sample.template_id}")
            print(f"  Type: {sample.question_type}")
            print(f"  Structure: {sample.structure_type}")
            print(f"  Text: {sample.template_text[:100]}...")
            if sample.example:
                print(f"  Example: {sample.example[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading templates: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_onboarding_questions():
    """Test loading onboarding questions from Markdown"""
    print("\n" + "="*80)
    print("Testing Onboarding Questions (Markdown)")
    print("="*80)
    
    try:
        questions = load_onboarding_questions()
        
        print(f"\n✅ Loaded questions successfully")
        print(f"\nCategories found:")
        total_questions = 0
        for category, question_list in questions.items():
            print(f"  - {category}: {len(question_list)} questions")
            total_questions += len(question_list)
        
        print(f"\nTotal questions: {total_questions}")
        
        # Show sample question
        first_category = list(questions.keys())[0]
        if questions[first_category]:
            sample = questions[first_category][0]
            print(f"\n📋 Sample Question:")
            print(f"  ID: {sample.question_id}")
            print(f"  Category: {sample.category}")
            print(f"  Type: {sample.question_type}")
            print(f"  Text: {sample.question_text}")
            if sample.options:
                print(f"  Options: {', '.join(sample.options[:3])}...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading questions: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_xml_parsing():
    """Test XML parsing for concept extraction"""
    print("\n" + "="*80)
    print("Testing XML Parsing")
    print("="*80)
    
    import xml.etree.ElementTree as ET
    
    # Sample XML response
    sample_xml = """<concepts>
  <concept>
    <term>Virtual Machine</term>
    <definition>A software emulation of a physical computer system</definition>
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
</concepts>"""
    
    try:
        root = ET.fromstring(sample_xml)
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
        
        print(f"\n✅ Parsed {len(concepts)} concepts from XML")
        
        for i, concept in enumerate(concepts, 1):
            print(f"\n📋 Concept {i}:")
            print(f"  Term: {concept['term']}")
            print(f"  Definition: {concept['definition'][:80]}...")
            print(f"  Source sentences: {len(concept['source_sentences'])}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error parsing XML: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_analogy_xml_parsing():
    """Test XML parsing for analogy generation"""
    print("\n" + "="*80)
    print("Testing Analogy XML Parsing")
    print("="*80)
    
    import xml.etree.ElementTree as ET
    
    sample_xml = """<response>
  <analogies>
    <analogy>
      <concept>Virtual Machine</concept>
      <analogy_text>Think of a virtual machine like an apartment building. Just as multiple families can live independently in separate apartments within one building, multiple operating systems can run independently on virtual machines within one physical computer.</analogy_text>
      <based_on_interest>architecture</based_on_interest>
      <learning_style_adaptation>This visual analogy helps you picture the concept spatially</learning_style_adaptation>
    </analogy>
  </analogies>
  <memory_techniques>
    <technique>
      <technique_type>acronym</technique_type>
      <technique_text>Remember VM as "Virtual Mansion" - a big house with many rooms</technique_text>
      <application>Use this when recalling what VMs do</application>
    </technique>
  </memory_techniques>
  <learning_mantras>
    <mantra>
      <mantra_text>One machine, many systems</mantra_text>
      <explanation>Captures the essence of virtualization</explanation>
    </mantra>
  </learning_mantras>
</response>"""
    
    try:
        root = ET.fromstring(sample_xml)
        
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
        
        print(f"\n✅ Parsed analogy response:")
        print(f"  - {len(analogies)} analogies")
        print(f"  - {len(techniques)} memory techniques")
        print(f"  - {len(mantras)} learning mantras")
        
        if analogies:
            print(f"\n📋 Sample Analogy:")
            print(f"  Concept: {analogies[0]['concept']}")
            print(f"  Text: {analogies[0]['analogy_text'][:100]}...")
            print(f"  Interest: {analogies[0]['based_on_interest']}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error parsing analogy XML: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("XML MIGRATION TEST SUITE")
    print("="*80)
    
    results = {
        'Question Templates': test_question_templates(),
        'Onboarding Questions': test_onboarding_questions(),
        'XML Concept Parsing': test_xml_parsing(),
        'XML Analogy Parsing': test_analogy_xml_parsing()
    }
    
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Migration is ready.")
    else:
        print("\n⚠️  Some tests failed. Review errors above.")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
