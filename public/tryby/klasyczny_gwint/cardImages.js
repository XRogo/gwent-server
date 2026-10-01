/** Czy gracz ma włączone alternatywne grafiki kart */
export function isAlterCardsEnabled() {
    try {
        return localStorage.getItem('gwent_alter_cards') === 'true';
    } catch (e) {
        return false;
    }
}

/** Mała karta (stół / ręka) */
export function getCardImage(card) {
    if (!card) return '';
    if (isAlterCardsEnabled() && card.alter_karta) return card.alter_karta;
    return card.karta || '';
}

/** Duża karta (podgląd / kolekcja / lider) */
export function getDCardImage(card) {
    if (!card) return '';
    if (isAlterCardsEnabled() && card.alter_dkarta) return card.alter_dkarta;
    return card.dkarta || '';
}

if (typeof window !== 'undefined') {
    window.isAlterCardsEnabled = isAlterCardsEnabled;
    window.getCardImage = getCardImage;
    window.getDCardImage = getDCardImage;
}
