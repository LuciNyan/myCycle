import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/lib/cjs/rxjs';
import { Observable, of, interval } from 'rxjs';
import { merge, mapTo, map, tap, filter } from 'rxjs/operators';
import { get } from 'lodash';

import { Sources, Sinks, Reducer } from '../../interfaces';

export interface State {
    count: number;
    tempo: number;
    clickCount: number;
    timeLine: number;
    prevHits: number;
    newAddHits: number;
    continuousHits: number;
}

export const defaultState: State = {
    count: 0,
    tempo: 80,
    clickCount: 0,
    timeLine: 0,
    prevHits: 0,
    newAddHits: 0,
    continuousHits: 0
};

interface DOMIntent {
    increment$: Observable<null>;
    decrement$: Observable<null>;
    link$: Observable<null>;
    tempo$: Observable<number>;
    documentClick$: Observable<null>;
    timeLine$: Observable<number>;
}

export function Metronome({ DOM, state }: Sources<State>): Sinks<State> {
    const {
        increment$,
        decrement$,
        link$,
        tempo$,
        documentClick$,
        timeLine$
    }: DOMIntent = intent(DOM);

    return {
        DOM: view(state.stream),
        state: model(increment$, decrement$, tempo$, documentClick$, timeLine$),
        router: redirect(link$)
    };
}

function model(
    increment$: Observable<any>,
    decrement$: Observable<any>,
    tempo$: Observable<number>,
    documentClick$: Observable<any>,
    timeLine$: Observable<number>
): Observable<Reducer<State>> {
    const init$ = of<Reducer<State>>(prevState =>
        prevState === undefined ? defaultState : prevState
    );

    const addToState: (n: number) => Reducer<State> = n => (state: State) => ({
        ...state,
        count: (state as State).count + n
    });

    const addClickState: (n: number) => Reducer<State> = n => (
        state: State
    ) => ({
        ...state,
        clickCount: (state as State).clickCount + n
    });

    const tempoReducer: (tempo: number) => Reducer<State> = tempo => (
        state: State
    ) => ({
        ...state,
        tempo
    });

    const timeLineReducer: (timeLine: number) => Reducer<State> = timeLine => (
        state: State
    ) => ({
        ...state,
        timeLine
    });

    const hitsReducer: () => Reducer<State> = () => (state: State) => {
        const newAddHits = state.clickCount - state.prevHits;
        const continuousHits =
            newAddHits === 0 ? 0 : state.continuousHits + newAddHits;

        return {
            ...state,
            newAddHits,
            continuousHits,
            prevHits: state.clickCount
        };
    };

    const add$ = increment$.pipe(mapTo(addToState(1)));
    const subtract$ = decrement$.pipe(mapTo(addToState(-1)));
    const click$ = documentClick$.pipe(mapTo(addClickState(1)));

    const tempoMemory$ = tempo$.pipe(map(tempo => tempoReducer(tempo)));
    const timeLineMemory$ = timeLine$.pipe(
        map(timeLine => timeLineReducer(timeLine))
    );
    const hitsMemory$ = timeLine$.pipe(
        filter(second => second % 5 === 0),
        map(_ => hitsReducer())
    );

    const source$ = init$.pipe(
        merge(
            add$,
            subtract$,
            tempoMemory$,
            click$,
            timeLineMemory$,
            hitsMemory$
        )
    );
    return source$;
}

function view(state$: Observable<State>): Observable<VNode> {
    return state$.pipe(
        // tap(({ timeLine, clickCount, prevHits, newAddHits }) => console.log({ timeLine, clickCount, prevHits, newAddHits })),
        map(
            ({
                count,
                tempo,
                clickCount,
                timeLine,
                newAddHits,
                prevHits,
                continuousHits
            }) => (
                <div>
                    {/*<span>{'Counter: ' + count}</span>*/}
                    {/*<span>{'Tempo: ' + tempo}</span>*/}
                    <span>循环周期: 500毫秒</span>
                    <span>{'总点击: ' + clickCount}</span>
                    <span>{'上一循环周期为止的点击: ' + prevHits}</span>
                    <span>{'新增点击: ' + newAddHits}</span>
                    <span>{'连击: ' + continuousHits}</span>
                    <span>{'计时: ' + timeLine / 10}</span>
                    {/*<button type="button" className="add">*/}
                    {/*    Increase*/}
                    {/*</button>*/}
                    {/*<button type="button" className="subtract">*/}
                    {/*    Decrease*/}
                    {/*</button>*/}
                    {/*<button type="button" data-action="navigate">*/}
                    {/*    Page 2*/}
                    {/*</button>*/}
                    {/*<input type="text" value={tempo} className="haru"/>*/}
                </div>
            )
        )
    );
}

function intent(DOM: DOMSource): DOMIntent {
    const timeLine$: Observable<number> = interval(100);

    const documentClick$ = DOM.select('document')
        .events('click')
        .pipe(mapTo(null));

    const increment$ = DOM.select('.add')
        .events('click')
        .pipe(mapTo(null));

    const decrement$ = DOM.select('.subtract')
        .events('click')
        .pipe(mapTo(null));

    const tempo$: Observable<number> = DOM.select('.haru')
        .events('input')
        .pipe(
            map(el => {
                let value = get(el, 'target.value');
                value = isNaN(parseInt(value)) ? 0 : parseInt(value);
                return value;
            }),
            tap(el => console.log(el))
        );

    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .pipe(mapTo(null));

    return { increment$, decrement$, link$, tempo$, documentClick$, timeLine$ };
}

function redirect(link$: Observable<any>): Observable<string> {
    return link$.pipe(mapTo('/speaker'));
}
