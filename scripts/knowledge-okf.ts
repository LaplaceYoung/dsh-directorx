import { runKnowledgeCli } from '../src/knowledge-audit.ts'

const code = await runKnowledgeCli(process.argv.slice(2))
process.exit(code)
