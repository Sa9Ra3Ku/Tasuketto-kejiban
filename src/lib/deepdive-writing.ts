import { DeepDiveType } from "@prisma/client";

export const deepDiveTypeDescriptions: Record<DeepDiveType, string> = {
  EMPATHY: "気持ちや引っかかりに寄り添って重ねる角度",
  PERSPECTIVE: "別の見方や立ち位置を置く角度",
  HYPOTHESIS: "まだ確定していない仮説を置く角度",
  DEDUCTION: "条件や流れから筋道を立てる角度",
  REBUTTAL: "既存の見方に違う線を差し込む角度",
  SUMMARY: "ここまでの重なりを整理する角度",
  EXPERIENCE: "自分の体験や観測から重ねる角度",
};

export const deepDiveTypePlaceholders: Record<DeepDiveType, string> = {
  EMPATHY: "どこに引っかかったのか、どの感覚に寄り添うのかを書いてください",
  PERSPECTIVE: "今とは違う見方や立場から見えるものを書いてください",
  HYPOTHESIS: "まだ断定できないが、こうかもしれないと思う線を書いてください",
  DEDUCTION: "条件や流れから、どうつながるかを書いてください",
  REBUTTAL: "今ある見方に対して、別の線や違和感を書いてください",
  SUMMARY: "ここまでの深堀りを、崩さず整理してください",
  EXPERIENCE: "自分が見たこと、起きたこと、似た体験を書いてください",
};

export const deepDiveTypeGuides: Record<DeepDiveType, string> = {
  EMPATHY: "感情をまとめ切らなくても、寄り添う位置が見えるだけで深堀りになります。",
  PERSPECTIVE: "結論ではなく、視点をひとつ置くだけでも深堀りが前に進みます。",
  HYPOTHESIS: "断定しない言い回しでも、線が見えると重なりやすくなります。",
  DEDUCTION: "前提と流れを短くつなぐだけでも、筋道として十分機能します。",
  REBUTTAL: "否定よりも違和感の置き方を示すと、次の深堀りが重なりやすくなります。",
  SUMMARY: "要約しきるより、どこまで重なったかを丁寧に残す感覚で書けます。",
  EXPERIENCE: "短い体験でも、観測として置くと深堀りの層が厚くなります。",
};

export const deepDiveStarterChips: Record<DeepDiveType, string[]> = {
  EMPATHY: ["引っかかるのは", "感覚として近いのは", "気持ちの流れで見ると"],
  PERSPECTIVE: ["別の角度から見ると", "立場をずらすと", "見方を変えると"],
  HYPOTHESIS: ["まだ断定できませんが", "ひとつの線としては", "もしこの仮説で見るなら"],
  DEDUCTION: ["流れで見ると", "条件を並べると", "筋道でつなぐと"],
  REBUTTAL: ["別の線で見ると", "ここには違和感があります", "この見方だけだと"],
  SUMMARY: ["ここまでを重ねると", "いったん整理すると", "重なった点だけ拾うと"],
  EXPERIENCE: ["自分の体験では", "似た流れとしては", "実際に起きたこととしては"],
};
