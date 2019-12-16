import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/lib/cjs/rxjs';
import { Observable, of } from 'rxjs';
import { merge, mapTo, map } from 'rxjs/operators';

import { Sources, Sinks, Reducer } from '../interfaces';

export interface State {
    count: number;
}
export const defaultState: State = {
    count: 0
};

interface DOMIntent {
    increment$: Observable<null>;
    decrement$: Observable<null>;
    link$: Observable<null>;
}

export function Counter({ DOM, state }: Sources<State>): Sinks<State> {
    const { increment$, decrement$, link$ }: DOMIntent = intent(DOM);

    return {
        DOM: view(state.stream),
        state: model(increment$, decrement$),
        router: redirect(link$)
    };
}

function model(
    increment$: Observable<any>,
    decrement$: Observable<any>
): Observable<Reducer<State>> {
    const init$ = of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (n: number) => Reducer<State> = n => state => ({
        ...state,
        count: (state as State).count + n
    });
    const add$ = increment$.pipe(mapTo(addToState(1)));
    const subtract$ = decrement$.pipe(mapTo(addToState(-1)));

    return init$.pipe(merge(add$, subtract$));
}

function view(state$: Observable<State>): Observable<VNode> {
    return state$.pipe(
        map(({ count }) => (
            <div>
                <h2>My Awesome Cycle.js app - Page 1</h2>
                <span>{'Counter: ' + count}</span>
                <button type="button" className="add">
                    Increase
                </button>
                <button type="button" className="subtract">
                    Decrease
                </button>
                <button type="button" data-action="navigate">
                    Page 2
                </button>
            </div>
        ))
    );
}

function intent(DOM: DOMSource): DOMIntent {
    const increment$ = DOM.select('.add')
        .events('click')
        .pipe(mapTo(null));

    const decrement$ = DOM.select('.subtract')
        .events('click')
        .pipe(mapTo(null));

    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .pipe(mapTo(null));

    return { increment$, decrement$, link$ };
}

function redirect(link$: Observable<any>): Observable<string> {
    return link$.pipe(mapTo('/speaker'));
}
