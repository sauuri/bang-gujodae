import ActivityKit
import Foundation

public struct TimerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var endTime: Date
        public var label: String

        public init(endTime: Date, label: String) {
            self.endTime = endTime
            self.label = label
        }
    }

    public init() {}
}
