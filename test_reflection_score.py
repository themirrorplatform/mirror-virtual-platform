from mirror_os.constitutional import L0AxiomChecker
import re

c = L0AxiomChecker()
text = "I notice you're struggling. I see a pattern here. I wonder about that. I observe this tension."

print(f"Text: {text}")
print(f"\nReflection score: {c.get_reflection_score(text)}")
print(f"Directive ratio: {c._calculate_directive_ratio(text)}")

# Count reflection patterns
count = 0
for pattern in c.REFLECTION_PATTERNS:
    matches = re.findall(pattern, text.lower())
    if matches:
        print(f"Pattern '{pattern}': {len(matches)} matches - {matches}")
        count += len(matches)

sentences = len(re.split(r'[.!?]+', text))
print(f"\nTotal reflection markers: {count}")
print(f"Sentences: {sentences}")
print(f"Score calculation: {count} / {sentences} = {count/sentences if sentences > 0 else 0}")
