import ARKit
import SceneKit
import UIKit
import Vision
import AVFoundation

struct ARStep {
    let order: Int
    let title: String
    let duration: String
    let reason: String
}

class ARViewController: UIViewController, ARSCNViewDelegate {
    var steps: [ARStep] = []
    var onClose: ((Int) -> Void)?

    private var sceneView: ARSCNView!
    private var checkedIndices = Set<Int>()
    private var stepNodes = [Int: SCNNode]()
    private var placedSteps = false

    private var progressLabel: UILabel!
    private var scanLabel: UILabel!

    private var objectOverlayNodes = [SCNNode]()
    private var lastObjectDetectionTime: TimeInterval = 0
    private let objectDetectionInterval: TimeInterval = 0.5

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupARView()
        setupUI()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal]
        sceneView.session.run(config)

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.placeStepsInWorld()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        sceneView.session.pause()
    }

    func renderer(_ renderer: SCNSceneRenderer, didRenderScene scene: SCNScene, atTime time: TimeInterval) {
        let now = Date().timeIntervalSince1970
        if now - lastObjectDetectionTime > objectDetectionInterval {
            lastObjectDetectionTime = now
            detectObjectsInARFrame()
        }
    }

    // MARK: - Setup

    private func setupARView() {
        sceneView = ARSCNView(frame: view.bounds)
        sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        sceneView.delegate = self
        sceneView.autoenablesDefaultLighting = true
        view.addSubview(sceneView)

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        sceneView.addGestureRecognizer(tap)
    }

    private func setupUI() {
        let safeTop = view.safeAreaInsets.top + 16

        // Close button
        let closeBtn = UIButton(type: .custom)
        closeBtn.setTitle("✕", for: .normal)
        closeBtn.titleLabel?.font = .systemFont(ofSize: 18, weight: .bold)
        closeBtn.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        closeBtn.layer.cornerRadius = 20
        closeBtn.frame = CGRect(x: view.bounds.width - 56, y: safeTop + 44, width: 40, height: 40)
        closeBtn.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        view.addSubview(closeBtn)

        // Progress pill
        progressLabel = UILabel()
        progressLabel.textColor = .white
        progressLabel.font = .systemFont(ofSize: 13, weight: .bold)
        progressLabel.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        progressLabel.layer.cornerRadius = 14
        progressLabel.layer.masksToBounds = true
        progressLabel.textAlignment = .center
        progressLabel.frame = CGRect(x: 16, y: safeTop + 44, width: 120, height: 28)
        view.addSubview(progressLabel)
        updateProgress()

        // Scan hint
        scanLabel = UILabel()
        scanLabel.text = "주변을 천천히 스캔하세요 📷"
        scanLabel.textColor = .white
        scanLabel.font = .systemFont(ofSize: 15, weight: .semibold)
        scanLabel.textAlignment = .center
        scanLabel.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        scanLabel.layer.cornerRadius = 20
        scanLabel.layer.masksToBounds = true
        let scanW: CGFloat = 280
        scanLabel.frame = CGRect(x: (view.bounds.width - scanW) / 2,
                                 y: view.bounds.height - 120,
                                 width: scanW, height: 44)
        view.addSubview(scanLabel)
    }

    // MARK: - Place Steps

    private func placeStepsInWorld() {
        guard !placedSteps, let frame = sceneView.session.currentFrame else { return }
        placedSteps = true

        UIView.animate(withDuration: 0.4) { self.scanLabel.alpha = 0 }

        let t = frame.camera.transform
        let camPos  = SIMD3<Float>(t.columns.3.x,  t.columns.3.y,  t.columns.3.z)
        let forward = SIMD3<Float>(-t.columns.2.x, -t.columns.2.y, -t.columns.2.z)
        let right   = SIMD3<Float>(t.columns.0.x,   t.columns.0.y,  t.columns.0.z)

        let count = steps.count
        let spread: Float = .pi / 4   // 45° total fan
        let dist: Float   = 1.1

        for (i, step) in steps.enumerated() {
            let ratio = count > 1 ? Float(i) / Float(count - 1) - 0.5 : 0
            let angle = ratio * spread

            let pos = camPos
                + forward * (cos(angle) * dist)
                + right   * (sin(angle) * dist)
                + SIMD3<Float>(0, -0.15, 0)

            let node = makeStepNode(step: step, index: i)
            node.position = SCNVector3(pos.x, pos.y, pos.z)
            node.scale = SCNVector3(0.001, 0.001, 0.001)

            let billboard = SCNBillboardConstraint()
            billboard.freeAxes = .Y
            node.constraints = [billboard]

            sceneView.scene.rootNode.addChildNode(node)
            stepNodes[i] = node

            let delay = Double(i) * 0.12
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                SCNTransaction.begin()
                SCNTransaction.animationDuration = 0.45
                SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeOut)
                node.scale = SCNVector3(1, 1, 1)
                SCNTransaction.commit()
            }
        }
    }

    // MARK: - Node Creation

    private func makeStepNode(step: ARStep, index: Int) -> SCNNode {
        let plane = SCNPlane(width: 0.32, height: 0.18)
        plane.cornerRadius = 0.018
        plane.firstMaterial?.diffuse.contents = renderCard(step: step, checked: false)
        plane.firstMaterial?.isDoubleSided = true
        plane.firstMaterial?.lightingModel = .constant
        let node = SCNNode(geometry: plane)
        node.name = "step_\(index)"
        return node
    }

    private func renderCard(step: ARStep, checked: Bool) -> UIImage {
        let size = CGSize(width: 640, height: 360)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let cg = ctx.cgContext

            // Background
            (checked
                ? UIColor(red: 0.18, green: 0.62, blue: 0.14, alpha: 0.96)
                : UIColor(red: 0.06, green: 0.11, blue: 0.22, alpha: 0.96)
            ).setFill()
            UIBezierPath(roundedRect: CGRect(origin: .zero, size: size), cornerRadius: 36).fill()

            // Border
            cg.setStrokeColor((checked
                ? UIColor(red: 0.3, green: 0.85, blue: 0.25, alpha: 1)
                : UIColor(red: 0.3, green: 0.55, blue: 1.0, alpha: 0.45)
            ).cgColor)
            cg.setLineWidth(3)
            UIBezierPath(roundedRect: CGRect(x: 2, y: 2, width: size.width-4, height: size.height-4), cornerRadius: 34).stroke()

            // Badge
            let badgeRect = CGRect(x: 22, y: 22, width: 68, height: 68)
            (checked
                ? UIColor(red: 0.3, green: 0.85, blue: 0.25, alpha: 1)
                : UIColor(red: 0.15, green: 0.4, blue: 0.9, alpha: 1)
            ).setFill()
            UIBezierPath(ovalIn: badgeRect).fill()

            let badgeTxt = checked ? "✓" : "\(step.order)"
            let badgeAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 30, weight: .black),
                .foregroundColor: UIColor.white
            ]
            let bs = (badgeTxt as NSString).size(withAttributes: badgeAttrs)
            (badgeTxt as NSString).draw(
                at: CGPoint(x: badgeRect.midX - bs.width/2, y: badgeRect.midY - bs.height/2),
                withAttributes: badgeAttrs)

            // Duration top-right
            let durAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 22, weight: .semibold),
                .foregroundColor: UIColor(red: 0.55, green: 0.82, blue: 1.0, alpha: 1)
            ]
            let durTxt = "⏱ \(step.duration)"
            let ds = (durTxt as NSString).size(withAttributes: durAttrs)
            (durTxt as NSString).draw(at: CGPoint(x: size.width - ds.width - 22, y: 30), withAttributes: durAttrs)

            // Title
            let titleAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 28, weight: .black),
                .foregroundColor: UIColor.white
            ]
            (step.title as NSString).draw(in: CGRect(x: 106, y: 26, width: size.width - 230, height: 90), withAttributes: titleAttrs)

            // Reason
            let reasonAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 20, weight: .regular),
                .foregroundColor: UIColor(white: 1, alpha: 0.65)
            ]
            (step.reason as NSString).draw(in: CGRect(x: 22, y: 112, width: size.width - 44, height: 120), withAttributes: reasonAttrs)

            // Tap hint
            if !checked {
                let hintAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 17, weight: .medium),
                    .foregroundColor: UIColor(white: 1, alpha: 0.35)
                ]
                let ht = "탭하여 완료 →"
                let hs = (ht as NSString).size(withAttributes: hintAttrs)
                (ht as NSString).draw(at: CGPoint(x: size.width - hs.width - 22, y: size.height - hs.height - 18), withAttributes: hintAttrs)
            }
        }
    }

    // MARK: - Interaction

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let pt = gesture.location(in: sceneView)
        let hits = sceneView.hitTest(pt, options: [SCNHitTestOption.searchMode: SCNHitTestSearchMode.all.rawValue])
        for hit in hits {
            guard let name = hit.node.name, name.hasPrefix("step_"),
                  let idx = Int(name.dropFirst(5)) else { continue }
            toggleStep(idx)
            return
        }
    }

    private func toggleStep(_ index: Int) {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        if checkedIndices.contains(index) {
            checkedIndices.remove(index)
        } else {
            checkedIndices.insert(index)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }

        updateProgress()

        guard let node = stepNodes[index] else { return }
        let step = steps[index]
        let checked = checkedIndices.contains(index)

        // Bounce scale animation
        SCNTransaction.begin()
        SCNTransaction.animationDuration = 0.12
        node.scale = SCNVector3(1.12, 1.12, 1.12)
        SCNTransaction.completionBlock = {
            // Update texture
            if let plane = node.geometry as? SCNPlane {
                plane.firstMaterial?.diffuse.contents = self.renderCard(step: step, checked: checked)
            }
            SCNTransaction.begin()
            SCNTransaction.animationDuration = 0.15
            node.scale = SCNVector3(1, 1, 1)
            if checked { node.position.y += 0.04 }
            SCNTransaction.commit()
        }
        SCNTransaction.commit()

        if checkedIndices.count == steps.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.showAllDone() }
        }
    }

    private func updateProgress() {
        progressLabel?.text = "  \(checkedIndices.count)/\(steps.count) 완료  "
    }

    private func showAllDone() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)

        let overlay = UIView(frame: view.bounds)
        overlay.backgroundColor = .clear
        view.addSubview(overlay)

        UIView.animate(withDuration: 0.35) {
            overlay.backgroundColor = UIColor.black.withAlphaComponent(0.65)
        }

        let emoji = UILabel()
        emoji.text = "🎉"
        emoji.font = .systemFont(ofSize: 72)
        emoji.sizeToFit()
        emoji.center = CGPoint(x: view.bounds.midX, y: view.bounds.midY - 60)
        emoji.alpha = 0
        emoji.transform = CGAffineTransform(scaleX: 0.4, y: 0.4)
        overlay.addSubview(emoji)

        let title = UILabel()
        title.text = "정리 완료!"
        title.font = .systemFont(ofSize: 32, weight: .black)
        title.textColor = .white
        title.sizeToFit()
        title.center = CGPoint(x: view.bounds.midX, y: view.bounds.midY + 10)
        title.alpha = 0
        overlay.addSubview(title)

        let btn = UIButton(type: .custom)
        btn.setTitle("닫기", for: .normal)
        btn.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
        btn.backgroundColor = UIColor(red: 0.18, green: 0.62, blue: 0.14, alpha: 1)
        btn.layer.cornerRadius = 24
        btn.frame = CGRect(x: view.bounds.midX - 90, y: view.bounds.midY + 60, width: 180, height: 48)
        btn.alpha = 0
        btn.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        overlay.addSubview(btn)

        UIView.animate(withDuration: 0.5, delay: 0.1, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.8) {
            emoji.alpha = 1
            emoji.transform = .identity
        }
        UIView.animate(withDuration: 0.4, delay: 0.25) {
            title.alpha = 1
            btn.alpha = 1
        }
    }

    @objc private func closeTapped() {
        sceneView.session.pause()
        dismiss(animated: true) { [weak self] in
            self?.onClose?(self?.checkedIndices.count ?? 0)
        }
    }

    // MARK: - Object Detection

    private func detectObjectsInARFrame() {
        guard let frame = sceneView.session.currentFrame else { return }
        let pixelBuffer = frame.capturedImage

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let detections = self?.analyzeImageBrightness(pixelBuffer) ?? []
            DispatchQueue.main.async {
                self?.processDetectedRegions(detections, frame: frame)
            }
        }
    }

    private func analyzeImageBrightness(_ pixelBuffer: CVPixelBuffer) -> [(CGRect, Float)] {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer)!

        let gridSize = 16
        var detections: [(CGRect, Float)] = []

        for gy in 0..<gridSize {
            for gx in 0..<gridSize {
                let cellW = width / gridSize
                let cellH = height / gridSize
                let y1 = gy * cellH
                let y2 = min(y1 + cellH, height)
                let x1 = gx * cellW
                let x2 = min(x1 + cellW, width)

                var brightness: [UInt8] = []
                for y in y1..<y2 {
                    let row = baseAddress.advanced(by: y * bytesPerRow)
                    for x in x1..<x2 {
                        let pixel = row.advanced(by: x * 4).assumingMemoryBound(to: UInt8.self)
                        let r = UInt16(pixel[0])
                        let g = UInt16(pixel[1])
                        let b = UInt16(pixel[2])
                        let lum = UInt8((r * 299 + g * 587 + b * 114) / 1000)
                        brightness.append(lum)
                    }
                }

                if brightness.count > 0 {
                    let mean = Float(brightness.reduce(0, +)) / Float(brightness.count)
                    let variance = brightness.map { (Float($0) - mean) * (Float($0) - mean) }
                        .reduce(0, +) / Float(brightness.count)
                    let stdDev = sqrt(variance)

                    if stdDev > 20 {
                        let rect = CGRect(x: CGFloat(x1), y: CGFloat(y1), width: CGFloat(cellW), height: CGFloat(cellH))
                        detections.append((rect, stdDev))
                    }
                }
            }
        }

        return detections.sorted { $0.1 > $1.1 }.prefix(6).map { ($0.0, $0.1) }
    }

    private func processDetectedRegions(_ detections: [(CGRect, Float)], frame: ARFrame) {
        objectOverlayNodes.forEach { $0.removeFromParentNode() }
        objectOverlayNodes.removeAll()

        let cameraTransform = frame.camera.transform
        let cameraPos = SIMD3<Float>(cameraTransform.columns.3.x, cameraTransform.columns.3.y, cameraTransform.columns.3.z)
        let forward = SIMD3<Float>(-cameraTransform.columns.2.x, -cameraTransform.columns.2.y, -cameraTransform.columns.2.z)
        let right = SIMD3<Float>(cameraTransform.columns.0.x, cameraTransform.columns.0.y, cameraTransform.columns.0.z)
        let up = SIMD3<Float>(cameraTransform.columns.1.x, cameraTransform.columns.1.y, cameraTransform.columns.1.z)

        let imageWidth = Float(CVPixelBufferGetWidth(frame.capturedImage))
        let imageHeight = Float(CVPixelBufferGetHeight(frame.capturedImage))

        for (i, detection) in detections.enumerated() {
            let rect = detection.0
            let normX = Float(rect.midX / CGFloat(imageWidth > 0 ? imageWidth : 1))
            let normY = Float(rect.midY / CGFloat(imageHeight > 0 ? imageHeight : 1))

            let offsetX = (normX - 0.5) * 1.2
            let offsetY = (0.5 - normY) * 0.9

            let pos = cameraPos + forward * 0.55 + right * offsetX + up * offsetY

            let overlayNode = makeTransparentOverlay(index: i)
            overlayNode.position = SCNVector3(pos.x, pos.y, pos.z)
            overlayNode.scale = SCNVector3(0.35, 0.35, 0.35)

            sceneView.scene.rootNode.addChildNode(overlayNode)
            objectOverlayNodes.append(overlayNode)
        }
    }

    private func makeTransparentOverlay(index: Int) -> SCNNode {
        let plane = SCNPlane(width: 0.25, height: 0.25)
        plane.cornerRadius = 0.015

        let colors: [UIColor] = [
            UIColor(red: 1.0, green: 0.2, blue: 0.2, alpha: 0.35),
            UIColor(red: 0.2, green: 1.0, blue: 0.2, alpha: 0.35),
            UIColor(red: 0.2, green: 0.2, blue: 1.0, alpha: 0.35),
            UIColor(red: 1.0, green: 1.0, blue: 0.2, alpha: 0.35),
        ]
        let color = colors[index % colors.count]

        plane.firstMaterial?.diffuse.contents = color
        plane.firstMaterial?.isDoubleSided = true
        plane.firstMaterial?.lightingModel = .constant

        let node = SCNNode(geometry: plane)
        node.name = "overlay_\(index)"
        return node
    }
}
