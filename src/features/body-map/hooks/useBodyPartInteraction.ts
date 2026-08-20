import { useState } from "react";
import { BodyGender, BodyPart, BodySide, SelectedBodyPart } from "../types";

type UseBodyPartInteractionParams = {
  gender: BodyGender;
  side: BodySide;
  onSelectPart?: (part: SelectedBodyPart) => void;
};

export function useBodyPartInteraction({
  gender,
  side,
  onSelectPart,
}: UseBodyPartInteractionParams) {
  const [pressedPartId, setPressedPartId] = useState<string | null>(null);

  const handlePressInPart = (part: BodyPart) => {
    setPressedPartId(part.id);
  };

  const handlePressOutPart = () => {
    setPressedPartId(null);
  };

  const handlePressPart = (part: BodyPart) => {
    onSelectPart?.({
      ...part,
      gender,
      side,
      labelVi: part.name,
      labelEn: part.name,
      searchPhrase: part.name,
    });
  };

  return {
    pressedPartId,
    handlePressPart,
    handlePressInPart,
    handlePressOutPart,
  };
}
