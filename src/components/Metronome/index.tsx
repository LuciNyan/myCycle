import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/lib/cjs/rxjs';
import { Observable, of } from 'rxjs';
import { merge, mapTo, map, tap } from 'rxjs/operators';

import { Sources, Sinks, Reducer } from '../../interfaces';

export interface State {
    count: number;
    tempo: number;
}

export const defaultState: State = {
    count: 0,
    tempo: 80
};

interface DOMIntent {
    increment$: Observable<null>;
    decrement$: Observable<null>;
    link$: Observable<null>;
    tempo$: Observable<number>;
}

export function Metronome({ DOM, state }: Sources<State>): Sinks<State> {
    const { increment$, decrement$, link$, tempo$ }: DOMIntent = intent(DOM);

    return {
        DOM: view(state.stream),
        state: model(increment$, decrement$, tempo$),
        router: redirect(link$)
    };
}

function model(
    increment$: Observable<any>,
    decrement$: Observable<any>,
    tempo$: Observable<any>
): Observable<Reducer<State>> {
    const init$ = of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (n: number) => Reducer<State> = n => state => ({
        ...state,
        count: (state as State).count + n,
        tempo: (state as State).tempo
    });
    const add$ = increment$.pipe(mapTo(addToState(1)));
    const subtract$ = decrement$.pipe(mapTo(addToState(-1)));

    const tempoReducer: (tempo: number) => Reducer<State> = tempo => (
        state: State
    ) => ({
        ...state,
        tempo
    });

    tempo$ = tempo$.pipe(map(tempo => tempoReducer(tempo)));

    return init$.pipe(merge(add$, subtract$, tempo$));
}

function view(state$: Observable<State>): Observable<VNode> {
    return state$.pipe(
        tap(el => console.log(el)),
        map(({ count, tempo }) => (
            <div>
                <span>{'Counter: ' + count}</span>
                <span>{'Tempo: ' + tempo}</span>
                <button type="button" className="add">
                    Increase
                </button>
                <button type="button" className="subtract">
                    Decrease
                </button>
                <button type="button" data-action="navigate">
                    Page 2
                </button>
                <input type="text" value={tempo} className="haru" />
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

    const tempo$: Observable<number> = DOM.select('.haru')
        .events('input')
        .pipe(
            map(el =>
                isNaN(parseInt(el.target.value)) ? 0 : parseInt(el.target.value)
            ),
            tap(el => console.log(el))
        );

    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .pipe(mapTo(null));

    return { increment$, decrement$, link$, tempo$ };
}

function redirect(link$: Observable<any>): Observable<string> {
    return link$.pipe(mapTo('/speaker'));
}
