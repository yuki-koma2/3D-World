import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WorldCanvas } from './scene/Scene'
import { Interface } from './ui/Interface'

class RenderBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Aether City rendering error', error, info.componentStack) }
  render() {
    return this.state.error ? <div className="error-screen"><p>3D空間を読み込めませんでした</p><span>WebGL 2対応ブラウザをご利用ください。</span><button onClick={() => location.reload()}>再読み込み</button></div> : this.props.children
  }
}

export function App() {
  return <main className="world"><RenderBoundary><WorldCanvas /></RenderBoundary><Interface /></main>
}
