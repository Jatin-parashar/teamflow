const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_PATTERN_REGEX = /javascript:|on\w+\s*=|data:\s*text\/html/gi;

export function sanitize(input: string): string {
  return input.replace(HTML_TAG_REGEX, "").replace(SCRIPT_PATTERN_REGEX, "");
}
