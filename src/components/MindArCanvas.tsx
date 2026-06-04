import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface Props {
  modelSrc: string
  mindFileSrc: string
  onTargetFound: () => void
  onTargetLost: () => void
  onHotspot: (type: 'A' | 'B' | 'C') => void
}

type HotspotDef = { type: 'A' | 'B' | 'C'; position: [number, number, number] }

const HOTSPOT_DEFS: HotspotDef[] = [
  { type: 'A', position: [-0.08, 0.14, 0.01] },
  { type: 'B', position: [0, 0.14, 0.01] },
  { type: 'C', position: [0.08, 0.14, 0.01] },
]

export function MindArCanvas({
  modelSrc,
  mindFileSrc,
  onTargetFound,
  onTargetLost,
  onHotspot,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTargetFoundRef = useRef(onTargetFound)
  const onTargetLostRef = useRef(onTargetLost)
  const onHotspotRef = useRef(onHotspot)

  useEffect(() => { onTargetFoundRef.current = onTargetFound }, [onTargetFound])
  useEffect(() => { onTargetLostRef.current = onTargetLost }, [onTargetLost])
  useEffect(() => { onHotspotRef.current = onHotspot }, [onHotspot])

  useEffect(() => {
    if (!containerRef.current) return

    let stopped = false
    let stopFn: (() => void) | undefined

    // @ts-expect-error mind-ar does not ship full TypeScript declarations
    import('mind-ar/dist/mindar-image-three.prod.js').then(({ MindARThree }) => {
      if (stopped) return

      const mindarThree = new MindARThree({
        container: containerRef.current!,
        imageTargetSrc: mindFileSrc,
        maxTrack: 1,
      })

      const { scene, camera } = mindarThree
      const anchor = mindarThree.addAnchor(0)

      anchor.onTargetFound = () => onTargetFoundRef.current()
      anchor.onTargetLost = () => onTargetLostRef.current()

      let gltfModel: THREE.Group | undefined

      const loader = new GLTFLoader()
      loader.load(modelSrc, (gltf) => {
        if (stopped) return
        const model = gltf.scene
        gltfModel = model
        model.scale.set(0.08, 0.08, 0.08)
        anchor.group.add(model)
      })

      const hotspotMeshes: Array<{ mesh: THREE.Mesh; type: 'A' | 'B' | 'C' }> = []
      for (const def of HOTSPOT_DEFS) {
        const geo = new THREE.CircleGeometry(0.022, 20)
        const mat = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(...def.position)
        anchor.group.add(mesh)
        hotspotMeshes.push({ mesh, type: def.type })
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
      scene.add(ambientLight)
      const dir = new THREE.DirectionalLight(0xffffff, 1)
      dir.position.set(0, 1, 2)
      scene.add(dir)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      function onPointerDown(e: PointerEvent) {
        const rect = containerRef.current!.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera as THREE.PerspectiveCamera)
        const hits = raycaster.intersectObjects(hotspotMeshes.map((h) => h.mesh))
        if (hits.length > 0) {
          const found = hotspotMeshes.find((h) => h.mesh === hits[0].object)
          if (found) onHotspotRef.current(found.type)
        }
      }

      const container = containerRef.current!
      container.addEventListener('pointerdown', onPointerDown)
      mindarThree.start()

      stopFn = () => {
        container.removeEventListener('pointerdown', onPointerDown)
        for (const h of hotspotMeshes) {
          h.mesh.geometry.dispose()
          ;(h.mesh.material as THREE.MeshBasicMaterial).dispose()
        }
        if (gltfModel) {
          gltfModel.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const m = obj as THREE.Mesh
              m.geometry.dispose()
              ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) =>
                mat.dispose(),
              )
            }
          })
        }
        scene.remove(ambientLight)
        scene.remove(dir)
        mindarThree.stop()
      }
    })

    return () => {
      stopped = true
      stopFn?.()
    }
  }, [modelSrc, mindFileSrc])

  return <div ref={containerRef} className="w-full h-full" />
}
