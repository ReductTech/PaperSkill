# Local Browser Dependencies

These browser libraries are vendored so the interactive modules do not need a public CDN.

| Library | Version | License | Source file |
| --- | --- | --- | --- |
| Three.js | 0.148.0 | MIT | `three/0.148.0/three.min.js` |
| Three.js legacy loader pair | 0.147.0 | MIT | `three/0.147.0/three.min.js`, `three/0.147.0/GLTFLoader.js` |
| Phaser | 3.90.0 | MIT | `phaser/3.90.0/phaser.min.js` |
| Apache ECharts | 5.6.0 | Apache-2.0 | `echarts/5.6.0/echarts.min.js` |
| Plotly | 3.6.0 | MIT | `plotly/3.6.0/plotly.min.js` |
| Google model-viewer | 3.5.0 | Apache-2.0 | `model-viewer/3.5.0/model-viewer.min.js` |

The `0.147.0` Three.js pair exists only for the legacy CourseMap, whose global `THREE.GLTFLoader` API was removed from Three.js 0.148.0.
