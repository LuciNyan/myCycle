import { VNode, div, h2, textarea, button } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/lib/cjs/rxjs';
import { Observable, of } from 'rxjs';
import { map, mapTo, withLatestFrom, merge } from 'rxjs/operators';

import { Sources, Sinks, Reducer } from '../interfaces';

export interface State {
    text: string;
}
export const defaultState: State = { text: 'Edit me!' };

export interface DOMIntent {
    speech$: Observable<null>;
    link$: Observable<null>;
    updateText$: Observable<string>;
}

export function Speaker({ DOM, state }: Sources<State>): Sinks<State> {
    const { speech$, link$, updateText$ }: DOMIntent = intent(DOM);

    return {
        DOM: view(state.stream),
        speech: speech(speech$, state.stream),
        state: model(updateText$),
        router: redirect(link$)
    };
}

function model(updateText$: Observable<string>): Observable<Reducer<State>> {
    const init$ = of<Reducer<State>>(() => defaultState);

    const update$ = updateText$.pipe(
        map(text => (state: State) => ({
            ...state,
            text
        }))
    );

    return init$.pipe(merge(update$));
}

function view(state$: Observable<State>): Observable<VNode> {
    return state$.pipe(
        map(({ text }) =>
            div([
                h2('My Awesome Cycle.js app - Page 2'),
                textarea({
                    attrs: { id: 'text', rows: '3' },
                    props: { value: text }
                }),
                button(
                    { attrs: { type: 'button' }, dataset: { action: 'speak' } },
                    ['Speak to Me!']
                ),
                button(
                    {
                        attrs: { type: 'button' },
                        dataset: { action: 'navigate' }
                    },
                    ['Page 1']
                )
            ])
        )
    );
}

function intent(DOM: DOMSource): DOMIntent {
    const updateText$ = DOM.select('#text')
        .events('input')
        .pipe(map((ev: any) => ev.target.value));

    const speech$ = DOM.select('[data-action="speak"]')
        .events('click')
        .pipe(mapTo(null));

    const link$ = DOM.select('[data-action="navigate"]')
        .events('click')
        .pipe(mapTo(null));

    return { updateText$, speech$, link$ };
}

function redirect(link$: Observable<any>): Observable<string> {
    return link$.pipe(mapTo('/counter'));
}

function speech(
    speech$: Observable<any>,
    state$: Observable<State>
): Observable<string> {
    return speech$.pipe(
        withLatestFrom(state$),
        map(([_, s]: [any, State]) => s.text)
    );
}
