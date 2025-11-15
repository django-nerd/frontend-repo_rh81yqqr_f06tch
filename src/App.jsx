import React, { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, MousePointerClick, Rocket, Menu, Mail, Github, Link as LinkIcon, ArrowLeft } from 'lucide-react'

const tryDeriveBackendURLs = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL
  const urls = []
  if (envUrl) urls.push(envUrl)
  try {
    const { protocol, host } = window.location
    // Try same host, backend port 8000
    const byPort = host.replace('3000', '8000')
    urls.push(`${protocol}//${byPort}`)

    // Try Modal-style host transformation: add -api
    if (host.includes('-3000')) {
      const apiHost = host.replace('-3000', '-8000').replace('.run', '-api.run')
      urls.push(`${protocol}//${apiHost}`)
    }
  } catch {}
  // Fallback to relative (works if served behind a proxy)
  urls.push('')
  // Ensure uniqueness & without trailing slash
  return Array.from(new Set(urls.map(u => (u || '').replace(/\/$/, ''))))
}

async function apiGet(path) {
  const bases = tryDeriveBackendURLs()
  let lastErr
  for (const base of bases) {
    const url = `${base}${path}`
    try {
      const res = await fetch(url)
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('No backend reachable')
}

const Panel = ({ children, className = '' }) => (
  <div className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${className}`}>
    {children}
  </div>
)

const Button = ({ children, onClick, variant = 'primary', icon: Icon, className = '' }) => {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors'
  const styles = variant === 'primary'
    ? 'bg-cyan-500/90 hover:bg-cyan-400 text-white'
    : variant === 'ghost'
      ? 'bg-white/5 hover:bg-white/10 text-white'
      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
  return (
    <button onClick={onClick} className={`${base} ${styles} ${className}`}>
      {Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  )
}

const MenuItem = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${selected ? 'border-cyan-400/60 bg-cyan-400/10 text-white' : 'border-white/10 hover:border-white/20 text-zinc-200'}`}
  >
    <span>{label}</span>
    <ChevronRight size={18} className="opacity-70" />
  </button>
)

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-white text-lg font-semibold tracking-wide">{title}</h3>
    {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
  </div>
)

export default function App() {
  const [stage, setStage] = useState('menu') // menu | frontend-tech | frontend-projects | uiux-focus | uiux-gallery | reviews | contact
  const [menuItems, setMenuItems] = useState([])
  const [techItems, setTechItems] = useState([])
  const [designFocus, setDesignFocus] = useState([])
  const [reviews, setReviews] = useState([])
  const [contacts, setContacts] = useState([])

  const [selectedTech, setSelectedTech] = useState(null)
  const [projects, setProjects] = useState([])

  const [selectedFocus, setSelectedFocus] = useState(null)
  const [gallery, setGallery] = useState([])

  const [loading, setLoading] = useState(true)
  const [hint, setHint] = useState('Move your mouse — the console reacts to you')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function bootstrap() {
      setLoading(true)
      setError('')
      try {
        const [menuRes, techRes, focusRes, reviewsRes, contactRes] = await Promise.all([
          apiGet('/api/menu'),
          apiGet('/api/frontend/tech'),
          apiGet('/api/design/focus'),
          apiGet('/api/reviews'),
          apiGet('/api/contact'),
        ])
        if (!mounted) return
        setMenuItems(menuRes.items || [])
        setTechItems(techRes.items || [])
        setDesignFocus(focusRes.items || [])
        setReviews(reviewsRes.items || [])
        setContacts(contactRes.items || [])
      } catch (e) {
        setError('Unable to reach backend. Set VITE_BACKEND_URL or retry in a moment.')
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
    return () => { mounted = false }
  }, [])

  const variants = {
    rotateIn: { opacity: 0, rotateX: -10, y: 20 },
    center: { opacity: 1, rotateX: 0, y: 0 },
    rotateOut: { opacity: 0, rotateX: 10, y: -20 }
  }

  const goBack = () => {
    if (stage === 'frontend-projects') return setStage('frontend-tech')
    if (stage === 'frontend-tech' || stage === 'uiux-focus' || stage === 'reviews' || stage === 'contact') return setStage('menu')
    if (stage === 'uiux-gallery') return setStage('uiux-focus')
    return setStage('menu')
  }

  const openFrontend = async () => {
    setStage('frontend-tech')
  }

  const confirmTech = async () => {
    if (!selectedTech) return
    setLoading(true)
    try {
      const data = await apiGet(`/api/projects?tech=${encodeURIComponent(selectedTech)}`)
      setProjects(data.projects || [])
      setStage('frontend-projects')
    } catch (e) {
      setError('Could not load projects')
    } finally {
      setLoading(false)
    }
  }

  const openUIUX = () => setStage('uiux-focus')
  const confirmFocus = async () => {
    if (!selectedFocus) return
    setLoading(true)
    try {
      const data = await apiGet(`/api/design/gallery?focus=${encodeURIComponent(selectedFocus)}`)
      setGallery(data.items || [])
      setStage('uiux-gallery')
    } catch (e) {
      setError('Could not load gallery')
    } finally {
      setLoading(false)
    }
  }

  const openReviews = () => setStage('reviews')
  const openContact = () => setStage('contact')

  return (
    <div className="h-dvh w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/VyGeZv58yuk8j7Yy/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      </div>

      <div className="relative h-full flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Device header */}
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center">
                <Rocket size={18} className="text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Frontend Dev & UI/UX Designer</h1>
                <p className="text-zinc-400 text-sm">Creator Console — retro‑futuristic portfolio</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm">
              <MousePointerClick size={16} />
              <span className="hidden sm:inline">{hint}</span>
            </div>
          </div>

          {/* Left: Main device screen */}
          <Panel className="p-5 md:p-6 min-h-[360px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-zinc-400">Main Screen</span>
              <span className="text-xs text-zinc-400">{stage.replace('-', ' ')}</span>
            </div>
            <div className="relative h-full">
              <AnimatePresence mode="wait">
                {stage === 'menu' && (
                  <motion.div
                    key="menu"
                    initial="rotateIn"
                    animate="center"
                    exit="rotateOut"
                    variants={variants}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <SectionTitle title="What would you like to explore?" />
                    <div className="grid grid-cols-1 gap-3">
                      {menuItems.map((m) => (
                        <MenuItem
                          key={m.key}
                          label={m.label}
                          onClick={() => {
                            if (m.key === 'frontend') openFrontend()
                            if (m.key === 'uiux') openUIUX()
                            if (m.key === 'reviews') openReviews()
                            if (m.key === 'about') openContact()
                          }}
                        />
                      ))}
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                  </motion.div>
                )}

                {stage === 'frontend-projects' && (
                  <motion.div key="projects" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }}>
                    <SectionTitle title={`${selectedTech || ''} Projects`} subtitle="Curated builds and experiments" />
                    <div className="space-y-3">
                      {projects.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{p.title}</div>
                              <div className="text-sm text-zinc-400">{p.subtitle}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a className="text-cyan-300 hover:text-cyan-200 text-sm inline-flex items-center gap-1" href={p.demo} target="_blank" rel="noreferrer">
                                <LinkIcon size={16} /> Live
                              </a>
                              <a className="text-zinc-300 hover:text-white text-sm inline-flex items-center gap-1" href={p.code} target="_blank" rel="noreferrer">
                                <Github size={16} /> Code
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <p className="text-zinc-400 text-sm">No projects listed for this tech yet.</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {stage === 'uiux-gallery' && (
                  <motion.div key="gallery" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }}>
                    <SectionTitle title={`${selectedFocus || ''}`} subtitle="Modern UI Gallery" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gallery.map((g, i) => (
                        <div key={i} className="group overflow-hidden rounded-xl border border-white/10">
                          <img src={g.image} alt={g.title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="p-3 text-sm text-zinc-300">{g.title}</div>
                        </div>
                      ))}
                      {gallery.length === 0 && (
                        <p className="text-zinc-400 text-sm">No items available.</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <Button variant="ghost" onClick={() => setHint('Tip: Use Confirm on the side module to lock your choice')}>View Full Case Study</Button>
                    </div>
                  </motion.div>
                )}

                {stage === 'reviews' && (
                  <motion.div key="reviews" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }}>
                    <SectionTitle title="Latest Design Reviews" />
                    <div className="space-y-3">
                      {reviews.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg border border-white/10 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{r.title}</div>
                            <div className="text-sm text-zinc-400">{r.source} • {r.type}</div>
                          </div>
                          <a className="text-cyan-300 hover:text-cyan-200 text-sm inline-flex items-center gap-1" href={r.url} target="_blank" rel="noreferrer">
                            <LinkIcon size={16} /> Watch/Read
                          </a>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {stage === 'contact' && (
                  <motion.div key="contact" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }}>
                    <SectionTitle title={"LET'S CONNECT"} subtitle="Building for the 2025 web trend." />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {contacts.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition text-center">
                          <div className="text-sm font-medium">{c.label}</div>
                        </a>
                      ))}
                    </div>
                    <div className="mt-4 text-zinc-400 text-sm flex items-center gap-2"><Mail size={16} /> Prefer email? Choose "Email Me" above.</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>

          {/* Right: Side module */}
          <Panel className="p-5 md:p-6 min-h-[360px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-zinc-400">Side Module</span>
              <div className="flex items-center gap-2">
                {stage !== 'menu' && <Button variant="ghost" icon={ArrowLeft} onClick={goBack} className="px-3 py-1" />}
              </div>
            </div>
            <div className="relative h-full">
              <AnimatePresence mode="wait">
                {stage === 'menu' && (
                  <motion.div key="boot" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-xs text-zinc-400 mb-2">Booting console…</div>
                    <div className="text-2xl font-semibold tracking-tight">Creator Console</div>
                    <div className="text-zinc-400 text-sm mt-1">Press ACCEPT to continue</div>
                  </motion.div>
                )}

                {stage === 'frontend-tech' && (
                  <motion.div key="tech" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="TECH STACK" subtitle="Select one, then Confirm" />
                    <div className="grid grid-cols-1 gap-2">
                      {techItems.map((t) => (
                        <button key={t} onClick={() => setSelectedTech(t)} className={`px-3 py-2 rounded-lg border text-left ${selectedTech === t ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 hover:border-white/20'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <Button onClick={confirmTech} icon={Check}>CONFIRM</Button>
                    </div>
                  </motion.div>
                )}

                {stage === 'frontend-projects' && (
                  <motion.div key="techdone" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="Projects Loaded" subtitle="Rotate back to main screen" />
                    <div className="text-zinc-400 text-sm">Use the left panel to browse results.</div>
                  </motion.div>
                )}

                {stage === 'uiux-focus' && (
                  <motion.div key="focus" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="DESIGN FOCUS" subtitle="Select one, then Confirm" />
                    <div className="grid grid-cols-1 gap-2">
                      {designFocus.map((f) => (
                        <button key={f} onClick={() => setSelectedFocus(f)} className={`px-3 py-2 rounded-lg border text-left ${selectedFocus === f ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 hover:border-white/20'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <Button onClick={confirmFocus} icon={Check}>CONFIRM</Button>
                    </div>
                  </motion.div>
                )}

                {stage === 'uiux-gallery' && (
                  <motion.div key="focusdone" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="Gallery Ready" subtitle="Rotate back to view" />
                    <div className="text-zinc-400 text-sm">See the left screen for images.</div>
                  </motion.div>
                )}

                {stage === 'reviews' && (
                  <motion.div key="rv" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="ACCEPTED" subtitle="Rotated to Reviews" />
                    <div className="text-zinc-400 text-sm">Browse latest design reviews on the left.</div>
                  </motion.div>
                )}

                {stage === 'contact' && (
                  <motion.div key="ctc" initial="rotateIn" animate="center" exit="rotateOut" variants={variants} transition={{ duration: 0.4 }} className="space-y-3">
                    <SectionTitle title="LET'S CONNECT" subtitle="Icons available on main screen" />
                    <div className="text-zinc-400 text-sm">Dev Community • Tech Creator • Email</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Device controls */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between pt-4">
                {stage === 'menu' ? (
                  <Button icon={Check} onClick={() => setHint('Select an option on the left to begin')}>ACCEPT</Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={goBack}>Back</Button>
                    <Button variant="ghost" icon={Menu} onClick={() => setStage('menu')}>Menu</Button>
                  </div>
                )}
                {loading && <div className="text-xs text-zinc-400">Loading…</div>}
              </div>
            </div>
          </Panel>

          {/* Footer strip */}
          <div className="md:col-span-2 flex items-center justify-between text-xs text-zinc-500">
            <div>© {new Date().getFullYear()} Creator Console</div>
            <div>Futuristic • Minimal • Interactive</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
