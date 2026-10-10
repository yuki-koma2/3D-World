import { useEffect, useRef, useState } from 'react'
import { useWorld } from '../state/world'
import { Diagnostics } from './Diagnostics'
import { VIEWS, telemetry, type View, type Quality, QUALITY, SEED } from '../lib/world'

function Icon({ name }: { name: 'orbit' | 'walk' | 'settings' | 'reset' | 'arrow' | 'sun' }) {
  const paths = {
    orbit: <><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" /><circle cx="12" cy="12" r="2.4" /><path d="M18 5l2-1M4 17l2 1" /></>,
    walk: <><circle cx="13" cy="4" r="2" /><path d="m10 8 4 1 3 4M10 8l-3 5M12 9l-1 6-4 6M11 15l5 6" /></>,
    settings: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}

function Settings({ close }: { close: () => void }) {
  const state = useWorld()
  return <aside className="settings-panel" aria-label="世界の設定">
    <div className="panel-heading"><span>世界を調整</span><button className="close-button" onClick={close} aria-label="設定を閉じる">×</button></div>
    <label className="setting-label" htmlFor="time"><span>時間帯</span><span>{state.time < 0.4 ? '夕暮れ' : state.time < 0.75 ? 'ブルーアワー' : '夜'}</span></label>
    <input id="time" type="range" min="0" max="1" step="0.01" value={state.time} onChange={(e) => state.setTime(Number(e.target.value))} />
    <div className="range-endpoints"><span>夕暮れ</span><span>夜</span></div>
    <button className={`flow-button ${state.timeFlow ? 'enabled' : ''}`} onClick={() => useWorld.setState({ timeFlow: !state.timeFlow })}>{state.timeFlow ? '時間の流れを止める' : '夕暮れから夜へ'}</button>
    <label className="setting-label" htmlFor="light"><span>光の強さ</span><span>{state.light.toFixed(1)}</span></label>
    <input id="light" type="range" min="0.2" max="2" step="0.05" value={state.light} onChange={(e) => state.setLight(Number(e.target.value))} />
    <label className="setting-label" htmlFor="fog"><span>霧の深さ</span><span>{Math.round(state.fog * 100)}%</span></label>
    <input id="fog" type="range" min="0" max="1" step="0.01" value={state.fog} onChange={(e) => state.setFog(Number(e.target.value))} />
    <label className="setting-label" htmlFor="quality"><span>描画品質</span></label>
    <select id="quality" value={state.quality} onChange={(e) => state.setQuality(e.target.value as Quality)}>
      {Object.entries(QUALITY).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
    </select>
    <label className="checkbox-label"><input type="checkbox" checked={state.autoQuality} onChange={(e) => useWorld.setState({ autoQuality: e.target.checked })} />負荷に合わせて解像度を調整</label>
    <div className="panel-note">空と照明は、同じ時間を刻みます。<br />気になる場所で、少し立ち止まってみてください。</div>
  </aside>
}

export function Interface() {
  const mode = useWorld((s) => s.mode)
  const view = useWorld((s) => s.view)
  const walkMessage = useWorld((s) => s.walkMessage)
  const walkReady = useWorld((s) => s.walkReady)
  const [settings, setSettings] = useState(false)
  const [help, setHelp] = useState(false)
  const [diagnostics, setDiagnostics] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const fps = useRef<HTMLSpanElement>(null!)
  const hour = useRef<HTMLSpanElement>(null!)
  const place = useRef<HTMLSpanElement>(null!)
  useEffect(() => {
    const timer = setInterval(() => {
      if (fps.current) fps.current.textContent = `${telemetry.fps || '—'} FPS`
      if (hour.current) { const time = useWorld.getState().time; hour.current.textContent = `${18 + Math.floor(time * 3)}:${String(Math.floor(time * 180) % 60).padStart(2, '0')}` }
      if (useWorld.getState().timeFlow) {
        useWorld.getState().setTime(telemetry.time)
        if (telemetry.time >= 1) useWorld.setState({ timeFlow: false })
      }
      if (place.current && useWorld.getState().mode === 'walk') {
        const [x,,z] = telemetry.player
        place.current.textContent = x > 32 ? 'スカイテラス' : x < -27 ? 'エーテル庭園' : z < -32 ? 'ルミナ・ハーバー' : 'セントラル・スパイア'
      }
      if (telemetry.ready) setLoaded(true)
    }, 750)
    return () => clearInterval(timer)
  }, [])

  return <div className={`interface ${mode}`}>
    <header className="top-bar">
      <a className="brand" href="./" aria-label="Aether City ホーム"><svg className="brand-mark" viewBox="0 0 40 40"><path d="m6 32 14-25 14 25M12 23h16" /><ellipse cx="20" cy="21" rx="17" ry="7" transform="rotate(-24 20 21)" /></svg><span>AETHER<span className="brand-sub">WORLD / 001</span></span></a>
      <div className="top-right"><span className="live-indicator"><i /> LIVE WORLD</span><span className="fps" ref={fps}>— FPS</span><button className={`icon-button ${settings ? 'active' : ''}`} onClick={() => setSettings(!settings)} aria-label="世界を調整" aria-expanded={settings}><Icon name="settings" /></button></div>
    </header>
    <div className="north"><span>N</span><div className="north-line" /><span>↗</span></div>
    <div className="scene-caption"><span className="eyebrow"><i /> ABOVE THE CLOUDS</span><h1>Aether City<span className="title-period">.</span></h1><p>{VIEWS[view].short}</p><div className="caption-meta"><span>標高 2,400 m</span><i /><span ref={hour}>18:41</span><span className="meta-weather">晴れ、ときどき浮遊。</span></div></div>
    {settings && <Settings close={() => setSettings(false)} />}
    {help && <aside className="help-panel" aria-label="操作ガイド"><div className="panel-heading">操作ガイド<button className="close-button" onClick={() => setHelp(false)} aria-label="ガイドを閉じる">×</button></div><p><b>Orbit / 鑑賞</b><br />ドラッグで回転・ホイールでズーム。右ドラッグで視点をずらせます。</p><p><b>Walk / 探索</b><br />道路・広場・橋の床をクリックすると、障害物を避けて移動します。ドラッグで景色をつかむように見回せます。WASDも使用でき、Shiftで加速、Spaceでジャンプ。</p><p>ESCで移動を停止。Rまたは復帰ボタンで開始地点へ戻ります。橋を渡って3つの島を訪れてみてください。</p><span className="help-seed">世界のSeed: {SEED}</span></aside>}
    <div className="view-picker" aria-label="視点を選ぶ">{(Object.keys(VIEWS) as View[]).map((key, index) => <button key={key} className={`view-card ${view === key ? 'selected' : ''}`} onClick={() => useWorld.getState().setView(key)} aria-pressed={view === key}><span className="view-number">0{index + 1}</span><span>{VIEWS[key].label}</span><span className="view-arrow">↗</span></button>)}</div>
    {diagnostics && <Diagnostics close={() => setDiagnostics(false)} />}
    {mode === 'walk' && !walkReady && <div className="walk-loading">探索の準備をしています…</div>}
    {mode === 'walk' && walkReady && <><div className="walk-location"><i /><span ref={place}>セントラル・スパイア</span></div><div className="walk-notice" role="status"><span>{walkMessage}</span><small>ドラッグで見回す · WASDでも移動 · Rで復帰</small></div></>}
    <footer className="bottom-bar">
      <div className="mode-controls"><button className={`mode-button ${mode === 'orbit' ? 'selected' : ''}`} onClick={() => useWorld.getState().setMode('orbit')} aria-pressed={mode === 'orbit'}><Icon name="orbit" /><span>Orbit <small>鑑賞</small></span></button><button className={`mode-button ${mode === 'walk' ? 'selected' : ''}`} onClick={() => useWorld.getState().setMode('walk')} aria-pressed={mode === 'walk'}><Icon name="walk" /><span>Walk <small>探索</small></span></button><span className="control-divider" /><button className="icon-button" aria-label="カメラをリセット・復帰" title="カメラをリセット・復帰" onClick={() => useWorld.getState().reset()}><Icon name="reset" /></button></div>
      <div className="bottom-guide"><span>{mode === 'orbit' ? 'ドラッグで回転' : '床をクリックして移動'}<i />{mode === 'orbit' ? 'スクロールでズーム' : 'ドラッグで見回す'}</span><button className="info-button" onClick={() => setDiagnostics(!diagnostics)} aria-label="描画情報を表示" aria-expanded={diagnostics}>描画情報</button><button className="help-button" onClick={() => setHelp(!help)} aria-label="操作ガイドを表示" aria-expanded={help}>?</button></div>
    </footer>
    {!loaded && <div className="loading-screen"><div className="loading-orbit" /><span>雲の上へ、まもなく。</span><small>世界を描いています</small></div>}
  </div>
}
