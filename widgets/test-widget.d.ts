import type { Widget } from "expo-widgets";
import type { ReactElement } from "react";

export type TestWidgetProps = {
  title?: string;
  message?: string;
  count?: number;
};

export declare function TestWidgetComponent(props: TestWidgetProps): ReactElement;

export declare const widget: Widget<TestWidgetProps>;

declare const _default: Widget<TestWidgetProps>;
export default _default;