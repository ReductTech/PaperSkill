import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const paperPath = path.join(root, 'paper.json')
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

let paper
try {
  paper = JSON.parse(await readFile(paperPath, 'utf8'))
} catch (error) {
  console.error(`paper.json could not be read or parsed: ${error.message}`)
  process.exit(1)
}

const errors = []
if (!isNonEmptyString(paper.title)) errors.push('title must be a non-empty string')
if (!Array.isArray(paper.authors) || paper.authors.length === 0) {
  errors.push('authors must be a non-empty array')
} else if (paper.authors.some((author) => !isNonEmptyString(author))) {
  errors.push('every author must be a non-empty string')
}
if (!isNonEmptyString(paper.arxivUrl) || !/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}(?:v\d+)?$/.test(paper.arxivUrl)) {
  errors.push('arxivUrl must be a valid arxiv.org abstract URL')
}
if (!isNonEmptyString(paper.abstract)) errors.push('abstract must be a non-empty string')

if (errors.length > 0) {
  console.error('paper.json validation failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`paper.json validation passed: ${paper.title} (${paper.authors.length} authors)`)
