export interface ITranslationProvider {
  translate(text: string, from: string, to: string): Promise<string>;
}
