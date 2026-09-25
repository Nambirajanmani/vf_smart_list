# Transformer-Based Voice Product Identification Architecture

## Problem Diagnosis
The voice assistant in **VF Smart List** currently cannot identify items properly due to 3 root causes:
1. **Catalog Scope**: The voice assistant was only receiving items from the currently selected category tab on the UI (e.g., if on 'Fruits', vegetables were missing).
2. **Field Name Mismatch**: Catalog items have Tanglish names (`Thakkali`, `Urulaikizhangu`, `Vengayam`) in the database. When speaking English ("Tomato", "Potato"), the parser never checked `getEnglishName(item)`.
3. **Regex & Substring Fragility**: Real voice speech contains conversational phrasing, filler words ("could you please add", "podunga", "venum"), and transcription variations that strict regexes fail to parse.
