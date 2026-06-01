import ARKit
import Capacitor
import Foundation
import UIKit

@objc(ARPlugin)
public class ARPlugin: CAPPlugin, CAPBridgedPlugin {
    @objc public let identifier = "ARPlugin"
    @objc public let jsName = "ARBridge"
    @objc public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openAR", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": ARWorldTrackingConfiguration.isSupported])
    }

    @objc func openAR(_ call: CAPPluginCall) {
        guard ARWorldTrackingConfiguration.isSupported else {
            call.reject("ARKit not supported on this device")
            return
        }

        guard let rawSteps = call.getArray("steps") as? [[String: Any]] else {
            call.reject("steps required")
            return
        }

        let steps: [ARStep] = rawSteps.compactMap { d in
            guard let order = d["order"] as? Int,
                  let title = d["title"] as? String,
                  let duration = d["duration"] as? String
            else { return nil }
            return ARStep(order: order, title: title, duration: duration, reason: d["reason"] as? String ?? "")
        }

        DispatchQueue.main.async {
            let vc = ARViewController()
            vc.steps = steps
            vc.onClose = { checkedCount in
                call.resolve(["checkedCount": checkedCount])
            }
            vc.modalPresentationStyle = .fullScreen
            self.bridge?.viewController?.present(vc, animated: true)
        }
    }
}
