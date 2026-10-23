import React, { useEffect, useId, useState } from 'react'
import { useTheme } from '../../context/ThemeProvider'

// Mermaid is big, so it only loads the first time Nexa draws a diagram
let loader = null
const loadMermaid = () => {
  loader ||= import('mermaid').then((m) => m.default)
  return loader
}

// Draws a Mermaid diagram (flowchart, sequence…) from Nexa's ```mermaid block.
// If the diagram has a syntax error, shows the source instead.
const Mermaid = ({ code }) => {
  const { dark } = useTheme() || {}
  const id = `nexa-diagram-${useId().replace(/:/g, '')}`
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'neutral',
          fontFamily: 'inherit',
          flowchart: { htmlLabels: true, curve: 'basis' },
        })
        if (!(await mermaid.parse(code, { suppressErrors: true }))) throw new Error('bad diagram')
        const { svg } = await mermaid.render(id, code)
        if (alive) { setSvg(svg); setFailed(false) }
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [code, dark, id])

  if (failed) {
    return <pre className="my-1.5 overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-xs leading-relaxed text-slate-100 dark:bg-black/40"><code>{code}</code></pre>
  }
  if (!svg) {
    return <div className="my-1.5 h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700/50" aria-label="Drawing diagram" />
  }
  return (
    <div
      className="my-1.5 overflow-x-auto rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700 [&_svg]:mx-auto [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default Mermaid
