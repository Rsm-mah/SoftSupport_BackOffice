import { afterNextRender, DestroyRef, ElementRef, inject } from '@angular/core';

/**
 * Rattache l'élément hôte du composant à <body>.
 *
 * Une modale en `position: fixed` se cale sur le premier ancêtre qui porte un
 * transform, un filter ou une animation de ces propriétés (entrées de page, transitions
 * de vue) au lieu de l'écran : elle se retrouvait centrée dans la zone de contenu, sous
 * la topbar. Depuis <body>, l'overlay couvre toujours tout l'écran.
 *
 * Déplacé après le premier rendu : une vue embarquée (@if) insère ses nœuds racines
 * après la construction du composant et remettrait l'hôte à sa place d'origine.
 */
export function attachHostToBody(): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  if (typeof document === 'undefined') {
    return;
  }
  afterNextRender(() => document.body.appendChild(host));
  inject(DestroyRef).onDestroy(() => host.remove());
}
