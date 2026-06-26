import Svg, { Circle, G, Path } from "react-native-svg";
import { BodyModelData, BodyPart } from "../types";

type BodySvgRendererProps = {
  data: BodyModelData;
  strokeColor: string;
  selectedPartId?: string | null;
  pressedPartId?: string | null;
  onPressPart: (part: BodyPart) => void;
  onPressInPart: (part: BodyPart) => void;
  onPressOutPart: () => void;
};

const SELECTED_FILL = "rgba(132, 175, 235, 0.45)";
const PRESSED_FILL = "rgba(132, 175, 235, 0.28)";
const INACTIVE_FILL = "rgba(0, 0, 0, 0.01)";

export function BodySvgRenderer({
  data,
  strokeColor,
  selectedPartId,
  pressedPartId,
  onPressPart,
  onPressInPart,
  onPressOutPart,
}: BodySvgRendererProps) {
  const getPartFill = (partId: string) => {
    if (selectedPartId === partId) {
      return SELECTED_FILL;
    }

    if (pressedPartId === partId) {
      return PRESSED_FILL;
    }

    return INACTIVE_FILL;
  };

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={data.viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <G>
        {data.bodyParts.map((part) => (
          <Path
            key={part.id}
            id={part.id}
            d={part.d}
            fill={getPartFill(part.id)}
            fillRule="evenodd"
            clipRule="evenodd"
            onPress={() => onPressPart(part)}
            onPressIn={() => onPressInPart(part)}
            onPressOut={onPressOutPart}
          />
        ))}
      </G>

      <G pointerEvents="none">
        {data.outlines.map((outline, index) => (
          <Path
            key={`outline-${index}`}
            d={outline.d}
            fill="none"
            stroke={strokeColor}
            strokeWidth={outline.strokeWidth ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
          />
        ))}

        {data.outlineCircles?.map((circle, index) => (
          <Circle
            key={`outline-circle-${index}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={circle.strokeWidth ?? 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
          />
        ))}
      </G>
    </Svg>
  );
}
