/** Exclut beauté, savons, cartes cadeau, etc. — catalogue mode uniquement. */
const NON_CLOTHING =
  /savon|soap|parfum|perfume|eau de toilette|cologne|carte cadeau|gift\s*card|giftcard|bougie|candle|cr[eè]me|cream|s[eé]rum|serum|shampo|maquillage|makeup|cosm[eé]t|lotion|huile essentiel|dentifrice|deodorant|d[eé]odorant|eponge|éponge|brosse|peigne|mug|tasse|vaisselle|d[eé]co maison|home decor/i;

const CLOTHING_HINT =
  /robe|dress|top|blouse|shirt|tee|pull|sweat|pantalon|pant|jean|jupe|skirt|short|legging|veste|jacket|coat|blazer|manteau|gilet|cardigan|abaya|hijab|tunique|tunic|combinaison|jumpsuit|body|lingerie|soutien|bra|bikini|swim|maillot|chaussure|shoe|boot|sandal|sac\b|bag\b|ceinture|belt|écharpe|scarf|hat\b|chapeau|headband|head band|bandana|bandeau|mode\b|fashion|wear|clothing|vêtement|vetement|habillement/i;

export function isClothingProduct(name: string, category?: string, merchantCategory?: string): boolean {
  const haystack = `${name} ${category ?? ''} ${merchantCategory ?? ''}`.toLowerCase();
  if (NON_CLOTHING.test(haystack)) return false;
  if (CLOTHING_HINT.test(haystack)) return true;
  // Prix 0 = souvent carte cadeau
  return false;
}

export function isLikelyGiftOrSample(name: string, price: number): boolean {
  if (price <= 0) return true;
  return /carte cadeau|gift card|échantillon|sample kit/i.test(name);
}
