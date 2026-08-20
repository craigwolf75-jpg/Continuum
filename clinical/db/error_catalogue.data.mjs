/* Continuum Prompt 40 (Prompt 39A Section 5): the error catalogue source. The
   catalogue starts essentially empty and grows from real board rejections (Prompt
   40 Section 9.7). The package contains exactly one real rejection code, from
   `7.02 - Sample Batch Return File (with error).txt` (dated 2007), so that is the
   single seeded row.

   A row maps a board code to AN ELEMENT and nothing more. There is no field for a
   required value, a polarity, or a correction, by design: the 2007 wording

     "121023: Worker Personal Health Number must be BLANK since Worker Personal
      Health Number Indicator is No"

   has the OPPOSITE polarity of the current element. The legacy field was a
   "Personal Health Number Indicator" where No meant no PHN (so blank was correct);
   the current element is "Patient does not have an Worker 36" where Y means no
   PHN. Same rule, inverted flag. So the code is mapped to the PHN element only,
   with the caveat recorded as a human note, and no value is ever seeded.

   confidence is confidence in the ELEMENT mapping (the code is unambiguously about
   the PHN), not in any value. Below 0.80 the engine surfaces the raw board text to
   a human. errorcataloguegen.mjs emits 008_seed_error_catalogue.sql. No dashes. */

export const ROWS = [
  {
    jurisdiction_code: "AB",
    board_code: "121023",
    element_name: "Worker 36",
    confidence: 0.85,
    legacy_note: "Legacy 2007 return file wording (7.02) has inverted polarity versus the current \"Patient does not have an Worker 36\" element (Y means no PHN). Mapped to the element only; never seed a value or a correction.",
    source: "7.02 - Sample Batch Return File (with error).txt"
  }
];
