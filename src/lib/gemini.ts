import type { Morphology } from './morphology';
import { ALL_MORPHOLOGIES } from './morphology';
import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

export interface MorphoTagResult {
  tags: Morphology[];
  category: string;
  confidence: number;
  /** Présent uniquement si `debug: true` a été passé — texte brut renvoyé par Gemini. */
  debugRawText?: string;
}

interface TagGarmentInput {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  /** Renvoie en plus le texte brut de Gemini — pour validation manuelle avant de scaler. */
  debug?: boolean;
}

/**
 * Appelle la Supabase Edge Function `tag-morphology` (qui interroge Gemini 2.0 Flash)
 * et renvoie les tags de morphologie adaptés au vêtement décrit.
 * La clé Gemini reste côté serveur : elle n'est jamais embarquée dans l'app.
 */
export async function tagGarment(input: TagGarmentInput): Promise<MorphoTagResult> {
  if (!input.description && !input.imageBase64) {
    throw new Error('Décris le vêtement ou fournis une image.');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/tag-morphology`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analyse indisponible (${response.status}) : ${text.slice(0, 200)}`);
  }

  const raw = (await response.json()) as Partial<MorphoTagResult>;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is Morphology => (ALL_MORPHOLOGIES as string[]).includes(t))
    : [];

  return {
    tags,
    category: typeof raw.category === 'string' ? raw.category : 'Inconnu',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
    debugRawText: typeof raw.debugRawText === 'string' ? raw.debugRawText : undefined,
  };
}
