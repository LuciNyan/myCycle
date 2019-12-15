// Minimal speech driver - just speech, no options or events
//
// Limited availablity see caniuse
//
// TODO Add fallback or error

import { Observable } from 'rxjs';

export default function speechDriver(speechText$: Observable<string>): void {
    speechText$.subscribe({
        next: what => {
            if (window.speechSynthesis !== undefined) {
                const utterance = new SpeechSynthesisUtterance(what);
                window.speechSynthesis.speak(utterance);
            }
        }
    });
}
