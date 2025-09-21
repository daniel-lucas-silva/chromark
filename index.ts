// Using § as the escape character for inline styling and transforms

/**
 * Represents a parsed token from the input string.
 * - text: plain text without styles
 * - styled: text wrapped with styles and/or transforms
 */
type Token = {
  type: 'text' | 'styled'
  content: string
  styles: string[]
}

const foregroundColors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  grey: '\x1b[90m',
  black: '\x1b[30m',
}

const backgroundColors = {
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgGrey: '\x1b[100m',
  bgBlack: '\x1b[40m',
}

const styles = {
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  invert: '\x1b[7m',
  strike: '\x1b[9m',
}
// Text transformations
const textTransforms = {
  upper: (text: string) => text.toUpperCase(),
  lower: (text: string) => text.toLowerCase(),
  capitalize: (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
  title: (text: string) => text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
  camel: (text: string) =>
    text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
      .replace(/\s+/g, ''),
  kebab: (text: string) => text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
  snake: (text: string) => text.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
  reverse: (text: string) => text.split('').reverse().join(''),
  repeat: (text: string, count: number = 2) => text.repeat(count),
  pad: (text: string, length: number = 10, char: string = ' ') => text.padStart(length, char),
  truncate: (text: string, length: number = 10, suffix: string = '...') =>
    text.length > length ? text.substring(0, length) + suffix : text,
}

const reset = '\x1b[0m'
const allStyles = { ...foregroundColors, ...backgroundColors, ...styles }

export function applyColors(text: string): string {
  /**
   * Patterns:
   * §color:text§
   * §color,upper:text§
   * §color,transform:text§
   * Examples:
   * §green,upper:success§
   * §red,capitalize:critical error§
   * §blue,title:my title§
   */

  function buildStyleString(styleNames: string[]): string {
    return styleNames
      .map(name => allStyles[name as keyof typeof allStyles])
      .filter(Boolean)
      .join('')
  }

  function applyTextTransforms(text: string, transforms: string[]): string {
    let result = text

    for (const transform of transforms) {
      if (transform in textTransforms) {
        result = textTransforms[transform as keyof typeof textTransforms](result)
      } else if (transform.startsWith('repeat')) {
        const count = parseInt(transform.split('=')[1]) || 2
        result = textTransforms.repeat(result, count)
      } else if (transform.startsWith('pad')) {
        const [length, char] = transform.split('=').slice(1)
        result = textTransforms.pad(result, parseInt(length) || 10, char || ' ')
      } else if (transform.startsWith('truncate')) {
        const [length, suffix] = transform.split('=').slice(1)
        result = textTransforms.truncate(result, parseInt(length) || 10, suffix || '...')
      }
    }

    return result
  }

  function parseTokens(input: string): Token[] {
    const tokens: Token[] = []
    let i = 0

    while (i < input.length) {
      if (input[i] === '§') {
        const colonIndex = input.indexOf(':', i)
        if (colonIndex === -1) {
          tokens.push({ type: 'text', content: input[i], styles: [] })
          i++
          continue
        }

        const stylesList = input.slice(i + 1, colonIndex)
        const styles = stylesList.split('|').map(s => s.trim())

        let openCount = 1
        let j = colonIndex + 1
        let content = ''

        while (j < input.length && openCount > 0) {
          if (input[j] === '§') {
            if (
              j + 1 < input.length &&
              input.indexOf(':', j) !== -1 &&
              input.indexOf(':', j) < input.indexOf('§', j + 1)
            ) {
              openCount++
            } else {
              openCount--
            }
          }

          if (openCount > 0) {
            content += input[j]
          }
          j++
        }

        tokens.push({ type: 'styled', styles, content })
        i = j
      } else {
        let text = ''
        while (i < input.length && input[i] !== '§') {
          text += input[i]
          i++
        }
        if (text) {
          tokens.push({ type: 'text', content: text, styles: [] })
        }
      }
    }

    return tokens
  }

  function processTokens(tokens: Token[], parentStyles: string[] = []): string {
    return tokens
      .map(token => {
        if (token.type === 'text') {
          return token.content
        } else if (token.type === 'styled') {
          const currentStyles = [...parentStyles, ...token.styles]
          const nestedTokens = parseTokens(token.content)
          const processedContent = processTokens(nestedTokens, currentStyles)

          // Separate visual styles from text transforms
          const visualStyles = token.styles.filter(style => style in allStyles || style.startsWith('bg'))
          const transformNames = token.styles.filter(style => !(style in allStyles) && !style.startsWith('bg'))

          // Apply text transforms
          const transformedContent = applyTextTransforms(processedContent, transformNames)

          const styleString = buildStyleString(visualStyles)
          const parentStyleString = buildStyleString(parentStyles)

          if (parentStyles.length === 0) {
            return styleString + transformedContent + reset
          } else {
            return styleString + transformedContent + reset + parentStyleString
          }
        }
        return ''
      })
      .join('')
  }

  const tokens = parseTokens(text)
  return processTokens(tokens)
}

// Helper function for easier usage
export function c(text: string): string {
  return applyColors(text)
}

// ==================== AUTOMATIC OVERRIDES ====================

// 1. Override do console.log
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleInfo = console.info

export function enableConsoleOverride() {
  console.log = (...args: any[]) => {
    const processedArgs = args.map(arg => (typeof arg === 'string' ? applyColors(arg) : arg))
    originalConsoleLog(...processedArgs)
  }

  console.error = (...args: any[]) => {
    const processedArgs = args.map(arg => (typeof arg === 'string' ? applyColors(arg) : arg))
    originalConsoleError(...processedArgs)
  }

  console.warn = (...args: any[]) => {
    const processedArgs = args.map(arg => (typeof arg === 'string' ? applyColors(arg) : arg))
    originalConsoleWarn(...processedArgs)
  }

  console.info = (...args: any[]) => {
    const processedArgs = args.map(arg => (typeof arg === 'string' ? applyColors(arg) : arg))
    originalConsoleInfo(...processedArgs)
  }
}

export function disableConsoleOverride() {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.info = originalConsoleInfo
}

// 2. Override process.stdout.write
const originalStdoutWrite = process.stdout.write.bind(process.stdout)

export function enableStdoutOverride() {
  process.stdout.write = function (chunk: any, encoding?: any, callback?: any): boolean {
    if (typeof chunk === 'string') {
      chunk = applyColors(chunk)
    }
    return originalStdoutWrite(chunk, encoding, callback)
  }
}

export function disableStdoutOverride() {
  process.stdout.write = originalStdoutWrite
}

// 3. Wrapper to make piped usage easier
export class ColoredOutputStream {
  constructor(private originalStream = process.stdout) {}

  write(text: string): void {
    this.originalStream.write(applyColors(text))
  }

  log(...args: any[]): void {
    const processedArgs = args.map(arg => (typeof arg === 'string' ? applyColors(arg) : arg))
    console.log(...processedArgs)
  }
}

// 4. String prototype extension (optional)
declare global {
  interface String {
    color(): string
  }
}

export function enableStringPrototypeExtension() {
  String.prototype.color = function (): string {
    return applyColors(this.toString())
  }
}

// 5. Template literal tag
export function color(strings: TemplateStringsArray, ...values: any[]): string {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return applyColors(result)
}

// 6. Helper to enable multiple overrides at once
export function enableAutoColors(
  options: {
    console?: boolean
    stdout?: boolean
    stringPrototype?: boolean
  } = {},
) {
  if (options.console ?? true) enableConsoleOverride()
  if (options.stdout ?? true) enableStdoutOverride()
  if (options.stringPrototype ?? true) enableStringPrototypeExtension()
}

export function disableAutoColors() {
  disableConsoleOverride()
  disableStdoutOverride()
}


