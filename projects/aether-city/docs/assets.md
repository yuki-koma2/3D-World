# 素材とライセンス

外部の3Dモデル、画像、HDRI、音声、ダウンロードフォントは使用していません。

| 素材 | 生成方法 / 取得元 |
| --- | --- |
| 島、橋、スパイア、周辺建築、植栽、ドローン | 本プロジェクトのTypeScriptでプロシージャル生成 |
| アーチ | Three.js ShapeとExtrudeGeometryで実際に開口を生成 |
| 空、星、雲海、ホタル | 本プロジェクトのGLSL |
| 窓、床、構造リブ、遠景 | 固定SeedとInstancedMesh |
| 案内板 | CanvasTexture。端末のシステムフォントで描画 |
| 環境照明 | Three.js同梱のRoomEnvironmentをPMREM変換。外部HDRI取得なし |
| UIロゴ、アイコン | 本プロジェクト内のSVG |

依存パッケージのコードには各パッケージのライセンスが適用されます。React / Three.js / React Three Fiber / drei / React Three Rapier / React Three Postprocessing / Zustand / Leva / ViteはMIT、postprocessingはZlib、RapierとPlaywrightはApache-2.0です。導入したパッケージの`package.json`で確認し、React Three Rapierは[上流のLICENSE](https://github.com/pmndrs/react-three-rapier/blob/main/LICENSE)で確認しました。

取得元はnpm公式レジストリ（[固定依存](../package.json)と[ロックファイル](../package-lock.json)）。主な上流プロジェクト:

- [Three.js](https://github.com/mrdoob/three)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [drei](https://github.com/pmndrs/drei)
- [React Three Rapier](https://github.com/pmndrs/react-three-rapier) / [Rapier](https://github.com/dimforge/rapier)
- [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing)
- [Playwright](https://github.com/microsoft/playwright)

本プロジェクトで制作したソースと画像の配布ライセンスは、リポジトリ所有者が公開時に選択できます。
