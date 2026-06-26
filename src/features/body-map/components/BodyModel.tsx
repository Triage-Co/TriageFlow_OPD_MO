import { BodySvgRenderer } from "./BodySvgRenderer";
import { femaleBackData } from "../data/femaleBackData";
import { femaleFrontData } from "../data/femaleFrontData";
import { maleBackData } from "../data/maleBackData";
import { maleFrontData } from "../data/maleFrontData";
import { BodyGender, BodyModelData, BodyPart, BodySide } from "../types";

type BodyModelProps = {
  gender: BodyGender;
  side: BodySide;
  strokeColor: string;
  selectedPartId?: string | null;
  pressedPartId?: string | null;
  onPressPart: (part: BodyPart) => void;
  onPressInPart: (part: BodyPart) => void;
  onPressOutPart: () => void;
};

function getBodyModelData(gender: BodyGender, side: BodySide): BodyModelData {
  if (gender === "female" && side === "front") {
    return femaleFrontData;
  }

  if (gender === "female" && side === "back") {
    return femaleBackData;
  }

  if (gender === "male" && side === "back") {
    return maleBackData;
  }

  return maleFrontData;
}

export function BodyModel({
  gender,
  side,
  strokeColor,
  selectedPartId,
  pressedPartId,
  onPressPart,
  onPressInPart,
  onPressOutPart,
}: BodyModelProps) {
  const data = getBodyModelData(gender, side);

  return (
    <BodySvgRenderer
      data={data}
      strokeColor={strokeColor}
      selectedPartId={selectedPartId}
      pressedPartId={pressedPartId}
      onPressPart={onPressPart}
      onPressInPart={onPressInPart}
      onPressOutPart={onPressOutPart}
    />
  );
}
