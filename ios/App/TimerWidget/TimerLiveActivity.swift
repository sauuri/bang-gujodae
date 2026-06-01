import ActivityKit
import SwiftUI
import TimerShared
import WidgetKit

struct TimerLiveActivityView: View {
    let context: ActivityViewContext<TimerActivityAttributes>

    var body: some View {
        HStack(spacing: 16) {
            Text("🧹")
                .font(.system(size: 28))

            VStack(alignment: .leading, spacing: 2) {
                if !context.state.label.isEmpty {
                    Text(context.state.label)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.85))
                        .lineLimit(1)
                }
                Text(context.state.endTime, style: .timer)
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .monospacedDigit()
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .activityBackgroundTint(Color(red: 0.46, green: 0.77, blue: 0.26))
    }
}

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            TimerLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text("🧹").font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.endTime, style: .timer)
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .monospacedDigit()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if !context.state.label.isEmpty {
                        Text(context.state.label)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.85))
                    }
                }
            } compactLeading: {
                Text("🧹").font(.caption2)
            } compactTrailing: {
                Text(context.state.endTime, style: .timer)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .monospacedDigit()
                    .frame(maxWidth: 50)
            } minimal: {
                Text(context.state.endTime, style: .timer)
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .monospacedDigit()
            }
        }
    }
}
