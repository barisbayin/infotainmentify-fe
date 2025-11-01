import { useEffect, useState } from 'react'
import { api, type Prompt } from '../api/client'

export default function GeneratePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selected, setSelected] = useState<number | ''>('' as any)
  const [result, setResult] = useState<string>('')

  useEffect(()=>{ api.listPrompts(undefined, undefined, true).then(setPrompts) }, [])

  async function run() {
    if (!selected) return
    try {
      const r = await api.generateFromPrompt(Number(selected))
      setResult(JSON.stringify(r, null, 2))
    } catch (e:any) {
      setResult(e.message || 'error')
    }
  }

  return (
    <div>
      <h2>Generate Topics from Prompt</h2>
      <select value={selected} onChange={e=>setSelected(Number(e.target.value))}>
        <option value="">Select a prompt</option>
        {prompts.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={run} disabled={!selected}>Run</button>
      <pre style={{marginTop:12, background:'#111', color:'#0f0', padding:12, borderRadius:8, maxHeight:300, overflow:'auto'}}>
        {result}
      </pre>
    </div>
  )
}
