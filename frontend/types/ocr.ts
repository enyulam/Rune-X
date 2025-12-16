export type RecognizedCharacter = {
  char: string;
  pinyin: string;
  english: string;
  confidence: number;
};

export type OCRResponse = {
  image_id: string;
  text: string;
  characters: RecognizedCharacter[];
  translation: string;
};

