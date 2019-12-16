import { Observable } from 'rxjs';
import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/lib/es6/rxjs';

import { StateSource, Reducer } from '@cycle/state';
import { RouterSource, HistoryInput } from 'cyclic-router';

export { StateSource, Reducer } from '@cycle/state';

export type Component<State> = (s: Sources<State>) => Sinks<State>;

export interface Sources<State> {
    DOM: DOMSource;
    router: RouterSource;
    state: {
        stream: Observable<State>;
    };
}

export interface Sinks<State> {
    DOM?: Observable<VNode>;
    router?: Observable<HistoryInput>;
    speech?: Observable<string>;
    state?: Observable<Reducer<State>>;
}
